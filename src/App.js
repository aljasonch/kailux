import React, { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import icon_gemini from "./assets/gemini.png";

const API_KEY = process.env.REACT_APP_API_KEY;

function Chatbot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-1.5-pro-latest");

  const modelOptions = [
    { id: "pro", value: "gemini-1.5-pro-latest", label: "Gemini 1.5 Pro" },
    { id: "flash", value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
    {
      id: "exp1114",
      value: "gemini-exp-1114",
      label: "Gemini Experimental 1114",
    },
    {
      id: "exp1121",
      value: "gemini-exp-1121",
      label: "Gemini Experimental 1121",
    },
    {
      id: "learnlm",
      value: "learnlm-1.5-pro-experimental",
      label: "LearnLM 1.5 Pro Experimental",
    },
  ];

  const sendMessage = async () => {
    if (input.trim() === "") return;
    setLoading(true);

    const newMessage = { text: input, sender: "user" };
    const updatedMessages = [...messages, newMessage]; 
    setMessages(updatedMessages);
    setInput("");

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${API_KEY}`;

    const history = updatedMessages.map((message) => ({
      role: message.sender === "user" ? "user" : "model",
      parts: [{ text: message.text }],
    }));

    try {
      const response = await axios.post(API_URL, {
        contents: [
          {
            role: "user",
            parts: [{ text: input }],
          },
          ...history,
        ],
      });

      const geminiResponse = response.data.candidates[0].content.parts[0].text;
      const botMessage = { text: geminiResponse, sender: "bot" };
      setMessages([...updatedMessages, botMessage]); 
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage =
        error.response?.data?.error?.message || "Sorry, something went wrong.";
      setMessages([...updatedMessages, { text: errorMessage, sender: "bot" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:max-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 md:p-8 lg:p-12 flex justify-center items-center">
      <div className="w-full rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center p-4 md:p-6 from-indigo-500 via-purple-500 to-pink-500">
          {" "}
          <img
            src={icon_gemini}
            alt="Orion AI Logo"
            className="h-8 w-8 md:h-12 md:w-12 mr-4"
          />
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold  text-white  md:p-2 text-start">
            Orion AI
          </h1>
        </div>
        <div className="md:h-[400px] lg:h-[500px] overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-50">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`w-fit max-w-full md:max-w-3xl p-3 md:p-4 rounded-2xl shadow-lg ${
                  message.sender === "user"
                    ? "bg-gradient-to-r from-blue-600 to-blue-400 text-white"
                    : "bg-white text-gray-800"
                }`}
              >
                {message.sender === "bot" ? (
                  <ReactMarkdown className="break-words text-sm md:text-base">
                    {message.text}
                  </ReactMarkdown>
                ) : (
                  <p className="break-words text-sm md:text-base">
                    {message.text}
                  </p>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-center items-center p-4">
              <svg
                className="animate-spin h-6 w-6 mr-3 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="text-gray-600 italic text-sm md:text-base">
                Processing...
              </p>
            </div>
          )}
        </div>
        <div className="p-4 md:p-6 bg-white">
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="p-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent text-sm md:text-base w-full md:w-auto"
            >
              {modelOptions.map((option) => (
                <option key={option.id} value={option.value}>
                  {" "}
                  {option.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={input}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 p-3 md:p-4 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent text-sm md:text-base"
              placeholder="Type your message..."
              disabled={loading}
            />
            <button
              onenter
              onClick={sendMessage}
              className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold py-3 md:py-4 px-4 md:px-6 rounded-2xl transition-colors duration-200 text-sm md:text-base"
              disabled={loading}
            >
              {loading ? (
                <svg
                  className="animate-spin h-6 w-6 mr-3 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                "Send"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;
