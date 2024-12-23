import React, { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_KEY = process.env.REACT_APP_API_KEY;
const MODEL_IMAGE_URL = "/gemini.png";
const CORRECT_PASSWORD = process.env.REACT_APP_CORRECT_PASSWORD;

function Chatbot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash-exp");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(false);

  useEffect(() => {
    const storedLoginStatus = localStorage.getItem("isLoggedIn");
    if (storedLoginStatus === "true") {
      setIsLoggedIn(true);
    }
  }, []);

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

      console.log("Gemini API Response:", response.data);

      const responseParts = response.data.candidates[0].content.parts;
      let botMessage;

      if (
        selectedModel === "gemini-2.0-flash-thinking-exp" &&
        responseParts.length >= 2
      ) {
        botMessage = {
          role: "model",
          thinking: responseParts[0].text,
          output: responseParts[1].text,
          image: MODEL_IMAGE_URL,
        };
      } else {
        botMessage = {
          role: "model",
          text: responseParts[0].text,
          image: MODEL_IMAGE_URL,
        };
      }

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

  const handleLogin = () => {
    if (password === CORRECT_PASSWORD) {
      setIsLoggedIn(true);
      setLoginError(false);
      localStorage.setItem("isLoggedIn", "true");
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.setItem("isLoggedIn", "false");
    setMessages([]);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  if (!isLoggedIn) {
    return (
      <div className="bg-[#212121] text-white h-screen flex flex-col items-center justify-center px-4">
        <div className="bg-[#2F2F2F] p-8 rounded-xl shadow-md w-full max-w-md transform transition-all duration-300 ease-in-out hover:scale-105">
          <div className="mb-4">
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter password"
              className="bg-gray-700 border border-gray-600 text-white placeholder-gray-500 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleLogin();
                }
              }}
            />
          </div>
          <button
            onClick={handleLogin}
            className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-lg w-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Log In
          </button>
          {loginError && (
            <p className="text-red-500 mt-4 text-center animate-shake">
              Incorrect password!
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#212121] text-white h-screen flex flex-col">
      <div className="flex items-center justify-between px-4 sm:px-10 md:px-20 lg:px-36 py-4">
        <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-[#2F2F2F] text-white p-2 rounded-2xl w-full poppins-regular text-sm focus:outline-none"
          >
            {modelOptions.map((option) => (
              <option key={option.id} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1 active:scale-95"
        >
          Log Out
        </button>
      </div>

      <div className="px-4 sm:px-10 md:px-20 lg:px-36 flex-grow overflow-hidden">
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
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-2 mt-1"
                />
              )}
              <div
                className={`rounded-3xl p-3 ${
                  message.role === "user"
                    ? "bg-[#2F2F2F] text-right poppins-regular px-4"
                    : "bg-[#212121] text-left poppins-regular max-w-full cursor-pointer"
                }`}
              >
                {message.role === "model" &&
                message.thinking &&
                message.output ? (
                  <ThinkingOutput message={message} />
                ) : message.role === "model" ? (
                  <ReactMarkdown
                    className="text-sm leading-5 poppins-regular markdown-output"
                    remarkPlugins={[remarkGfm]}
                  >
                    {message.text}
                  </ReactMarkdown>
                ) : (
                  <p className="text-sm">{message.text}</p>
                )}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start items-start mb-4 animate-pulse">
              <img
                src={MODEL_IMAGE_URL}
                alt="Model Avatar"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-2"
              />
              <div className="rounded-lg p-3 text-left max-w-full bg-[#2F2F2F]">
                <p className="text-sm poppins-regular">
                  {selectedModel === "gemini-2.0-flash-thinking-exp"
                    ? "Thinking..."
                    : "Typing..."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-10 md:px-20 lg:px-36 mb-10">
        <div className="w-full bg-[#2F2F2F] rounded-3xl p-3 flex items-center shadow-md">
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
            className="flex-grow bg-transparent text-white outline-none px-2 poppins-regular text-sm"
            disabled={typing}
          />
          <button
            className="text-gray-400 hover:text-white focus:outline-none"
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
              className="transform rotate-45 motion-safe:animate-bounce"
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

const ThinkingOutput = ({ message }) => {
  const [showThinking, setShowThinking] = useState(false);

  const handleToggleThinking = () => {
    setShowThinking(!showThinking);
  };

  return (
    <div className="text-sm poppins-regular" onClick={handleToggleThinking}>
      {!showThinking && message.thinking && (
        <p
          className="text-xs text-gray-500 cursor-pointer hover:text-gray-400 transition-colors duration-200"
          onClick={handleToggleThinking}
        >
          Thinking
        </p>
      )}
      <ReactMarkdown
        className="text-sm leading-5 poppins-regular markdown-output"
        remarkPlugins={[remarkGfm]}
      >
        {message.output}
      </ReactMarkdown>
      {showThinking && (
        <div>
          <p className="text-sm poppins-regular italic text-gray-400 mt-2">
            Thinking Process
          </p>
          <ReactMarkdown
            className="text-sm leading-5 poppins-regular markdown-output"
            remarkPlugins={[remarkGfm]}
          >
            {message.thinking}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default Chatbot;