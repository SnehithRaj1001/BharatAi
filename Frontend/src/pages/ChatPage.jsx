import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getChatHistory, sendChatMessage } from "../services/api.js";
import ReactMarkdown from "react-markdown";

const ChatPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // If user is not logged in, use a session ID or prompt them
  const userId = user?.id || user?._id || "guest-user";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getChatHistory(userId);
        // Backend returns newest first because of sort({ timestamp: -1 })
        // We want to display oldest first, so we reverse it
        setMessages(history.reverse());
      } catch {
        setMessages([]);
      }
    };
    void fetchHistory();
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    if (!question.trim()) return;

    const currentQuestion = question;
    setQuestion("");
    setLoading(true);

    // Optimistically add the user's question to the UI
    const tempMessage = { question: currentQuestion, answer: null, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      // Backend calls OpenRouter and returns the full conversation object
      const conversation = await sendChatMessage({ userId, question: currentQuestion });
      
      // Update the last message with the real answer
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = conversation;
        return newMessages;
      });
    } catch (err) {
      setError(err.message);
      // Remove the optimistic message on failure
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900 mb-4">
          {t("chat")}
        </h1>
        <p className="text-slate-600 mb-6">{t("placeholderFeedback")}</p>

        <div className="mb-6 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {messages.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <span className="text-4xl mb-3 block">👋</span>
              No messages yet. Ask a question to get started!
            </div>
          ) : (
            messages.map((item, index) => (
              <div
                key={`${item.timestamp}-${index}`}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
              >
                <p className="text-sm font-medium text-slate-700 mb-3">
                  <span className="font-semibold text-slate-900">You:</span> {item.question}
                </p>
                {item.answer ? (
                  <div className="border-t border-slate-200 pt-3 text-slate-800 text-sm prose prose-slate max-w-none">
                    <ReactMarkdown
                      components={{
                        a: ({ node, ...props }) => {
                          // If it's an internal link, use React Router Link
                          if (props.href && props.href.startsWith('/')) {
                            return (
                              <Link to={props.href} className="text-indigo-600 hover:text-indigo-800 font-semibold no-underline hover:underline">
                                {props.children}
                              </Link>
                            );
                          }
                          // Otherwise, regular external link
                          return (
                            <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                              {props.children}
                            </a>
                          );
                        }
                      }}
                    >
                      {item.answer}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="border-t border-slate-200 pt-3 flex items-center gap-2 text-sm text-indigo-600 font-medium">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    BharatAI is typing...
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="pt-6 border-t border-slate-100 flex gap-3 items-end">
          <div className="flex-1">
            <label className="sr-only" htmlFor="chat-input">
              {t("askQuestion")}
            </label>
            <textarea
              id="chat-input"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={t("typeQuestion")}
              rows={2}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="flex-shrink-0 flex items-center justify-center h-[46px] w-[46px] rounded-full bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-60 transition-all mb-[1px]"
            title={t("send")}
          >
            <svg className="w-5 h-5 -mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </main>
  );
};

export default ChatPage;
