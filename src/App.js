import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FiPower, FiClipboard } from "react-icons/fi";
import TextareaAutosize from "react-textarea-autosize";

const API_KEY = process.env.REACT_APP_API_KEY;
const MODEL_IMAGE_URL = "/kailux.png";

const CodeBlock = ({ children, className }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyClick = () => {
    navigator.clipboard
      .writeText(String(children).replace(/\n$/, ""))
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1500);
      })
      .catch((err) => console.error("Could not copy text: ", err));
  };

  return (
    <div className="overflow-x-auto relative">
      <code className={className}>{children}</code>
      <button
        className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md p-1 text-xs focus:outline-none"
        onClick={handleCopyClick}
        title={isCopied ? "Copied!" : "Copy code"}
      >
        {isCopied ? "✅" : <FiClipboard />}
      </button>
    </div>
  );
};

const Dropdown = ({ options, selectedValue, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleOpen = () => setIsOpen(!isOpen);

  const handleOptionClick = (value) => {
    onSelect(value);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="bg-[#430f5f] text-white p-2 rounded-2xl min-w-[300px] sm:max-w-96 poppins-regular text-sm focus:outline-none flex items-center text-start sm:text-sm justify-between"
        onClick={toggleOpen}
      >
        {options.find((option) => option.value === selectedValue)?.label ||
          "Select Model"}
        <svg
          className={`w-4 h-4 ml-2 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute left-0 mt-2 min-w-[300px] sm:max-w-96 rounded-md shadow-lg z-10 bg-[#430f5f]">
          {options.map((option) => (
            <button
              key={option.value}
              className="block px-4 py-2 text-left text-sm poppins-regular text-white hover:bg-[#7A1CAC] w-full focus:outline-none"
              onClick={() => handleOptionClick(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

function Chatbot() {
  const [input, setInput] = useState("");
  const [inputPlaceholder, setInputPlaceholder] = useState("Type something...");
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash");
  const chatboxRef = useRef(null);
  const userMessageRef = useRef(null);

  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (userMessageRef.current) {
      userMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const modelOptions = [
    { id: "flash-2.0", value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    { id: "pro-2.0", value: "gemini-2.0-pro-exp-02-05", label: "Gemini 2.0 Pro Experimental 02-05" },
    {
      id: "flash-thinking-exp",
      value: "gemini-2.0-flash-thinking-01-21",
      label: "Gemini 2.0 Flash Thinking Experimental 01-21",
    },
  ];

  const sendMessage = async () => {
    if (input.trim() === "") return;

    const newMessage = { role: "user", text: input, image: null };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput("");
    setInputPlaceholder("Responding...");

    const startTime = Date.now();
    setTyping(true);

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${API_KEY}`;

    try {
      const formattedMessages = updatedMessages.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.output || msg.text || "" }],
      }));

      const response = await axios.post(API_URL, {
        contents: formattedMessages,
      });

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

      const endTime = Date.now();
      const elapsed = (endTime - startTime) / 1000;

      setMessages((prevMessages) => [
        ...prevMessages,
        { ...botMessage, thinkingTime: elapsed },
      ]);
      setInputPlaceholder("Type something...");
      setTyping(false);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage =
        error.response?.data?.error?.message || "Sorry, an error occurred.";
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "model", text: errorMessage, image: MODEL_IMAGE_URL },
      ]);
      setInputPlaceholder("Type something...");
      setTyping(false);
    }
  };

  const handleLogout = () => {
    setMessages([]);
  };

  return (
    <div className="bg-[#2E073F] text-white h-screen flex flex-col">
      {/* Header Section */}
      <div className="sticky top-0 bg-[#2E073F] z-10 px-4 py-4 sm:px-10 md:px-20 lg:px-36 flex items-center justify-between flex-wrap sm:flex-nowrap">
        <div className="w-96 mb-2 sm:mb-0 flex justify-between sm:block items-center">
          <Dropdown
            options={modelOptions}
            selectedValue={selectedModel}
            onSelect={setSelectedModel}
          />
          <button
            onClick={handleLogout}
            className="sm:hidden bg-red-500 hover:bg-red-600 text-white font-bold p-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
          >
            <FiPower />
          </button>
        </div>
        <button
          onClick={handleLogout}
          className="hidden sm:block bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-3xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
        >
          Clear Chat
        </button>
      </div>

      {/* Chat Messages Section */}
      <div className="px-4 sm:px-10 md:px-20 lg:px-36 flex-grow overflow-hidden flex flex-col">
        <div
          className="overflow-y-auto hide-scrollbar pb-24 sm:pb-28 flex-1"
          ref={chatboxRef}
        >
          {messages.map((message, index) => {
            const isUser = message.role === "user";
            return (
              <div
                key={index}
                className={`flex mb-4 ${
                  isUser ? "justify-end" : "items-start"
                }`}
                ref={isUser ? userMessageRef : null}
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
                    isUser
                      ? "bg-[#430f5f] text-right px-4"
                      : "bg-[#2E073F] text-left max-w-full sm:max-w-7/10 md:max-w-3/5 lg:max-w-full relative"
                  } poppins-regular`}
                >
                  {isUser ? (
                    <ReactMarkdown
                      className="text-sm text-start items-center"
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || "");
                          return !inline && match ? (
                            <CodeBlock className={className}>
                              {children}
                            </CodeBlock>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
                  ) : message.thinking && message.output ? (
                    <ThinkingOutput
                      message={message}
                      thinkingTime={message.thinkingTime}
                    />
                  ) : (
                    <ReactMarkdown
                      className="text-sm leading-5 markdown-output"
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || "");
                          return !inline && match ? (
                            <CodeBlock className={className}>
                              {children}
                            </CodeBlock>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            );
          })}
          {typing && (
            <div className={`flex mb-4 items-start animate-pulse`}>
              <img
                src={MODEL_IMAGE_URL}
                alt="Model Avatar"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-2 mt-1"
              />
              <div className="rounded-lg p-3 text-left max-w-full">
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

      {/* Input Section */}
      <div className="fixed bottom-0 left-0 right-0 px-4 sm:px-10 md:px-20 lg:px-36 pb-6 bg-[#2E073F] shadow-inner">
        <div className="w-full bg-[#430f5f] rounded-3xl p-3 flex items-center shadow-md">
          <TextareaAutosize
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={inputPlaceholder}
            className="flex-grow bg-transparent text-white outline-none px-2 poppins-regular text-sm resize-none overflow-auto"
            disabled={typing}
            minRows={1}
            maxRows={6}
            aria-label="Chat input"
          />
          <button
            className="text-gray-400 hover:text-white focus:outline-none ml-2"
            onClick={sendMessage}
            disabled={typing}
            title="Send Message"
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
              className="transform rotate-45"
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

const ThinkingOutput = ({ message, thinkingTime }) => {
  const [showThinking, setShowThinking] = useState(false);

  const handleToggleThinking = () => {
    setShowThinking(!showThinking);
  };

  return (
    <div
      className="text-sm poppins-regular break-words"
      onClick={handleToggleThinking}
    >
      {showThinking && (
        <div>
          <p className="text-sm poppins-regular italic cursor-pointer text-gray-400 mt-2">
            Thinking Process
          </p>
          <ReactMarkdown
            className="text-sm leading-5 poppins-regular markdown-output"
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                return !inline && match ? (
                  <CodeBlock className={className}>{children}</CodeBlock>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.thinking}
          </ReactMarkdown>
          <hr className="my-4" />
        </div>
      )}
      {!showThinking && message.thinking && (
        <>
          {thinkingTime > 0 && (
            <p
              className="text-sm text-gray-500 cursor-pointer hover:text-gray-400 transition-colors duration-200"
              onClick={handleToggleThinking}
            >
              Thinking for {thinkingTime.toFixed(1)} Seconds
            </p>
          )}
        </>
      )}
      <ReactMarkdown
        className="text-sm leading-5 poppins-regular markdown-output"
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              <CodeBlock className={className}>{children}</CodeBlock>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {message.output}
      </ReactMarkdown>
    </div>
  );
};

export default Chatbot;
