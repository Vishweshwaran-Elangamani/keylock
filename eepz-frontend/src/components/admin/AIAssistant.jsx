import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Loader2, Sparkles } from "lucide-react";
import "./AIAssistant.css";

const AIAssistant = ({ dashboardStats, userData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "👋 Hi! I'm your AI Admin Assistant. Ask me anything about your dashboard data, user management, or get insights!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // ⚠️ HARDCODED API KEY - Replace with your actual key
  const GEMINI_API_KEY = "AIzaSyDcac8wndFNiH3ngkXl4OWaI5VEA4vNZEE"; // Replace this!

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getContextData = () => {
    return `
Current Dashboard Data:
- Total Users: ${dashboardStats.totalUsers}
- Active Users: ${dashboardStats.activeUsers} (${dashboardStats.activeRate}%)
- Inactive Users: ${dashboardStats.inactiveUsers}
- New Users This Month: ${dashboardStats.newUsers}
- Total Departments: ${dashboardStats.totalDepartments}
- Total Roles: ${dashboardStats.totalRoles}
- Pending Change Requests: ${dashboardStats.pendingRequests}
- Approved Requests: ${dashboardStats.approvedRequests}
- Rejected Requests: ${dashboardStats.rejectedRequests}

User Details:
${userData.map(u => `- ${u.roleName}: ${u.departmentName}`).slice(0, 10).join('\n')}
`;
  };

 const askAI = async () => {
  if (!input.trim()) return;

  const userMessage = { role: "user", content: input };
  setMessages((prev) => [...prev, userMessage]);
  const currentInput = input;
  setInput("");
  setLoading(true);

  try {
    const apiKey = GEMINI_API_KEY;
    
    if (!apiKey || apiKey === "AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxx") {
      throw new Error("API key not configured.");
    }

    const conversationHistory = messages
      .filter(m => m.role !== "system")
      .slice(-4)
      .map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const fullPrompt = `You are an intelligent admin dashboard assistant for an Employee Management System. You help administrators analyze data, provide insights, and answer questions.

${getContextData()}

Guidelines:
- Be concise and professional (max 3-4 sentences)
- Provide actionable insights based on the data above
- Use data from the context to answer questions
- Suggest improvements when relevant
- Use emojis sparingly for emphasis

${conversationHistory ? `Previous conversation:\n${conversationHistory}\n\n` : ""}User: ${currentInput}

Provide a helpful response:`;

    //  CORRECT: Use gemini-1.5-pro (stable and widely available)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: fullPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `API Error: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error("Invalid response from Gemini API");
    }

    const aiResponse = {
      role: "assistant",
      content: data.candidates[0].content.parts[0].text,
    };

    setMessages((prev) => [...prev, aiResponse]);
  } catch (error) {
    console.error("AI Error:", error);
    
    let errorMessage = "❌ Sorry, I encountered an error. ";
    
    if (error.message.includes("API key not configured")) {
      errorMessage += "Please add your Gemini API key to the code.";
    } else if (error.message.includes("API_KEY_INVALID")) {
      errorMessage += "Invalid API key. Please check your Gemini API key.";
    } else if (error.message.includes("RESOURCE_EXHAUSTED")) {
      errorMessage += "Rate limit exceeded. Try again later.";
    } else if (error.message.includes("PERMISSION_DENIED")) {
      errorMessage += "Permission denied. Check your API key permissions.";
    } else {
      errorMessage += error.message || "Please try again.";
    }

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: errorMessage,
      },
    ]);
  } finally {
    setLoading(false);
  }
};


  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askAI();
    }
  };

  const quickQuestions = [
    "What's the user activity trend?",
    "Which department has most users?",
    "How many pending requests?",
    "Suggest improvements",
  ];

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button className="ai-chat-button" onClick={() => setIsOpen(true)}>
          <Sparkles size={24} />
          {dashboardStats.pendingRequests > 0 && (
            <span className="ai-chat-badge">{dashboardStats.pendingRequests}</span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="ai-chat-container">
          <div className="ai-chat-header">
            <div className="ai-chat-title">
              <MessageSquare size={20} />
              <span>AI Assistant</span>
              <span className="ai-status">● Online</span>
            </div>
            <button className="ai-close-btn" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="ai-chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`ai-message ${msg.role}`}>
                <div className="ai-message-content">
                  {msg.role === "assistant" && (
                    <div className="ai-avatar">🤖</div>
                  )}
                  <div className="ai-message-text">{msg.content}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="ai-message assistant">
                <div className="ai-message-content">
                  <div className="ai-avatar">🤖</div>
                  <div className="ai-typing">
                    <Loader2 size={16} className="ai-spinner" />
                    Thinking...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="ai-quick-questions">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  className="ai-quick-btn"
                  onClick={() => {
                    setInput(q);
                    setTimeout(() => askAI(), 100);
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="ai-chat-input">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your dashboard..."
              rows={1}
              disabled={loading}
            />
            <button
              onClick={askAI}
              disabled={!input.trim() || loading}
              className="ai-send-btn"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
