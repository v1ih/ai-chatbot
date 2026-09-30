// Função serverless da Vercel: a chave do Gemini fica só no servidor
// (variável GEMINI_API_KEY, sem prefixo VITE_, para não ir parar no bundle).
const MODEL = "gemini-2.5-flash";
const MAX_MESSAGES = 30;
const MAX_CHARS = 4000;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "API not configured" });
  }

  const contents = req.body?.contents;
  const valid = Array.isArray(contents)
    && contents.length > 0
    && contents.length <= MAX_MESSAGES
    && contents.every(c =>
      (c.role === "user" || c.role === "model")
      && typeof c.parts?.[0]?.text === "string"
      && c.parts[0].text.length <= MAX_CHARS);
  if (!valid) {
    return res.status(400).json({ error: "Invalid request" });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({ contents })
      }
    );
    const data = await response.json();
    if (!response.ok) {
      return res.status(502).json({ error: data.error?.message || "Upstream error" });
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return res.status(200).json({ text });
  } catch {
    return res.status(502).json({ error: "Upstream error" });
  }
}
