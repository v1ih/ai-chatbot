import React, { useEffect, useState, useRef } from "react";
import ChatbotIcon from "./components/ChatbotIcon";
import ChatForm from "./components/ChatForm";
import ChatMessage from "./components/ChatMessage";
import { companyInfo } from "./companyInfo";

const App = () => {
  const [chatHistory, setChatHistory] = useState([
    { hideInChat: true, role: "model", text: companyInfo }
  ]);
  const [showChatbot, setShowChatbot] = useState(false);
  const chatBotRef = useRef();

  const getLocalResponse = (message) => {
    const text = message.toLowerCase();

    if (text.includes("menu") || text.includes("coffee") || text.includes("drink")) {
      return "Our menu includes espresso, cappuccino, lattes, cold brew, pour over, matcha, chai, pastries and snacks. A classic latte is $4.50 and our cold brew is $4.50.";
    }
    if (text.includes("hour") || text.includes("open") || text.includes("close")) {
      return "Aroma Beans is open Monday to Friday from 7:00 AM to 9:00 PM, and on weekends from 8:00 AM to 10:00 PM.";
    }
    if (text.includes("where") || text.includes("address") || text.includes("location")) {
      return "You can find Aroma Beans at 123 Coffee Lane, Brew City, California.";
    }
    if (text.includes("contact") || text.includes("phone") || text.includes("email")) {
      return "You can reach the café at hello@aromabeanscoffee.com or +1 (555) 123-4567.";
    }
    if (text.includes("brew") || text.includes("tip")) {
      return "For a balanced pour over, start with freshly ground coffee, use water just below boiling, and aim for a brewing time between 3 and 4 minutes.";
    }
    return "I can help with our menu, opening hours, location, contact details and brewing tips. What would you like to know?";
  };

  const generateBotResponse = async (history) => {
    const updateHistory = (text, isError = false ) => {
      setChatHistory(prev => [
        ...prev.filter(msg => msg.text !== "Thinking..."),
        {role: "model", text, isError}
      ]);
    }
    const latestMessage = history.filter(({ role }) => role === "user").at(-1)?.text || "";

    if (!import.meta.env.VITE_API_URL) {
      window.setTimeout(() => updateHistory(getLocalResponse(latestMessage)), 500);
      return;
    }

    history = history.map(({role, text}) => ({role, parts: [{text}]}));


    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: history })
    }

    try {
      const response = await fetch(import.meta.env.VITE_API_URL, requestOptions);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error.message || "Failed to fetch response. Something went wrong.");
      }
      const apiResponseText = data.candidates[0].content.parts[0].text.replace(/<[^>]*>/g, '').trim();
      updateHistory(apiResponseText);
    } catch (error) {
      updateHistory(error.message, true);
    }
  }

  useEffect(() => {
    chatBotRef.current.scrollTo({
      top: chatBotRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [chatHistory]);

  return <div className={`container ${showChatbot ? 'show-chatbot' : ''}`}>
    <button onClick={() => setShowChatbot(prev => !prev)} id="chatbot-toggler">
      <span className="material-symbols-rounded">mode_comment</span>
      <span className="material-symbols-rounded">close</span>
    </button>
    <div className="chatbot-popup">
      <div className="chatbot-header">
        <div className="header-info">
          <ChatbotIcon />
          <h2 className="logo-text">Chatbot</h2>
        </div>
        <button onClick={() => setShowChatbot(prev => !prev)} className="material-symbols-rounded">
          keyboard_arrow_down
        </button>
      </div>

      <div ref={chatBotRef} className="chat-body">
        <div className="message bot-message">
          <ChatbotIcon />
          <p className="message-text">
            Hey there! 👋 <br /> How can I assist you today?
          </p>
        </div>

        {chatHistory.map((chat, index) => (
          <ChatMessage key={index} chat={chat} />
        ) )}
        
      </div>

      <div className="chat-footer">
        <ChatForm chatHistory={chatHistory} setChatHistory={setChatHistory} generateBotResponse={generateBotResponse} />
      </div>

    </div>
  </div>
}

export default App;
