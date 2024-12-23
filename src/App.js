import React, { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

const API_KEY = process.env.REACT_APP_API_KEY;
const MODEL_IMAGE_URL = "/gemini.png";

function Chatbot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash-exp");

  const modelOptions = [
    { id: "pro", value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    { id: "flash", value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
    {
      id: "flash-2.0-exp",
      value: "gemini-2.0-flash-exp",
      label: "Gemini 2.0 Flash Experimental",
    },
    {
      id: "flash-thinking-exp",
      value: "gemini-2.0-flash-thinking-exp",
      label: "Gemini 2.0 Flash Thinking Experimental",
    },
  ];

  const sendMessage = async () => {
    if (input.trim() === "") return;
    const newMessage = { role: "user", text: input, image: null };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput("");
    setTyping(true);

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${API_KEY}`;

    try {
      const formattedMessages = updatedMessages.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      }));

      const response = await axios.post(API_URL, {
        contents: formattedMessages,
      });

      const geminiResponse = response.data.candidates[0].content.parts[0].text;
      const botMessage = {
        role: "model",
        text: geminiResponse,
        image: MODEL_IMAGE_URL,
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);

      setTyping(false);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage =
        error.response?.data?.error?.message || "Sorry, an error occurred.";
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "model", text: errorMessage, image: MODEL_IMAGE_URL },
      ]);
      setTyping(false);
    }
  };

  return (
    <div className="bg-[#212121] text-white h-screen flex flex-col">
      <div className="flex items-center justify-between mx-36 my-4">
        <div className="w-1/4">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-[#2F2F2F] text-white p-2 rounded-2xl w-full poppins-regular"
          >
            {modelOptions.map((option) => (
              <option key={option.id} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mx-36 flex-grow overflow-hidden">
        <div
          className="overflow-y-auto hide-scrollbar"
          style={{ height: "calc(100vh - 150px)" }}
        >
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "items-start"
              } mb-4`}
            >
              {message.role === "model" && (
                <img
                  src={message.image}
                  alt="Model Avatar"
                  className="w-10 h-10 rounded-full mr-2 mt-1"
                />
              )}
              <div
                className={`rounded-3xl p-3 ${
                  message.role === "user"
                    ? "bg-[#2F2F2F] text-right poppins-regular px-4"
                    : "bg-[#212121] text-left poppins-regular max-w-full"
                }`}
              >
                {message.role === "model" ? (
                  <ReactMarkdown className="text-sm leading-5 poppins-regular">
                    {message.text}
                  </ReactMarkdown>
                ) : (
                  <p className="text-sm">{message.text}</p>
                )}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start items-start mb-4">
              <img
                src={MODEL_IMAGE_URL}
                alt="Model Avatar"
                className="w-10 h-10 rounded-full mr-2"
              />
              <div className="rounded-lg p-3 text-left max-w-full">
                <p className="text-sm poppins-regular">Typing...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mx-36 mb-10">
        <div className="w-full bg-[#2F2F2F] rounded-3xl p-3 flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
            placeholder="Type something..."
            className="flex-grow bg-transparent text-white outline-none px-2 poppins-regular"
            disabled={typing}
          />
          <button
            className="text-gray-400 hover:text-white"
            onClick={sendMessage}
            disabled={typing}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;