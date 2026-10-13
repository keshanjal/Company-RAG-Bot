import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import AppLayout from "../../components/layout/AppLayout";
import { askQuestion } from "../../services/chatService";
import {
  getChatSessionMessages,
} from "../../services/chatSessionService";

function SourceCard({
  source,
  index,
  relevance,
  isLongContent,
  previewLength,
}) {
  const [expanded, setExpanded] = useState(false);

  const displayedContent =
    expanded || !isLongContent
      ? source.content
      : `${source.content.slice(
          0,
          previewLength,
        )}...`;

  return (
    <div className="source-card">
      <div className="source-card-header">
        <div className="source-title">
          <span className="source-number">
            {index + 1}
          </span>
          <span>
            Document source
          </span>
        </div>

        <span className="source-relevance">
          {relevance.label}
        </span>
      </div>

      <div className="source-preview">
        {displayedContent}
      </div>

      {isLongContent && (
        <button
          type="button"
          className="source-expand-button"
          onClick={() =>
            setExpanded((previous) => !previous)
          }
        >
          {expanded
            ? "Show less"
            : "Show more"}
        </button>
      )}

      <div className="source-meta">
        <span>
          Document #{source.document_id}
        </span>
        <span>
          Section {source.chunk_index + 1}
        </span>
      </div>
    </div>
  );
}

function Chat() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    async function loadMessages() {
      if (!sessionId) {
        setMessages([]);
        return;
      }

      try {
        setLoadingMessages(true);
        setError("");

        const data = await getChatSessionMessages(sessionId);
        setMessages(data);
      } catch (error) {
        console.error("Failed to load chat messages:", error);
        const message =
          error.response?.data?.detail ||
          "Failed to load this conversation.";
        setError(message);
      } finally {
        setLoadingMessages(false);
      }
    }

    loadMessages();
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, sending]);

  function handleQuestionChange(event) {
    setQuestion(event.target.value);

    const textarea = event.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(
      textarea.scrollHeight,
      160,
    )}px`;
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (!sending && question.trim()) {
        handleSendMessage(event);
      }
    }
  }

  async function handleSendMessage(event) {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || sending) {
      return;
    }

    setError("");
    setSending(true);

    const temporaryUserMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedQuestion,
    };

    setMessages((previous) => [
      ...previous,
      temporaryUserMessage,
    ]);

    setQuestion("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const response = await askQuestion({
        question: trimmedQuestion,
        session_id: sessionId
          ? Number(sessionId)
          : null,
        top_k: 5,
      });

     const currentSessionId = sessionId
  ? Number(sessionId)
  : response.session_id;

      if (!sessionId && response.session_id) {
        navigate(`/chat/${response.session_id}`, {
          replace: true,
        });
      }

      // --- DYNAMIC TITLE UPDATE TRIGGER ---
      // If this is the first message, tell the sidebar to update the title
      if (messages.length === 0 && currentSessionId) {
        const newTitle = trimmedQuestion.length > 28 
          ? trimmedQuestion.substring(0, 28) + "..." 
          : trimmedQuestion;
          
        window.dispatchEvent(
          new CustomEvent("update-session-title", {
            detail: { id: currentSessionId, title: newTitle },
          })
        );
      }
      // ------------------------------------

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.answer,
        sources: response.sources || [],
      };

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);
    } catch (error) {
      console.error("Failed to send message:", error);

      const message =
        error.response?.data?.detail ||
        "Failed to get a response. Please try again.";

      setError(message);

      setMessages((previous) =>
        previous.filter(
          (item) => item.id !== temporaryUserMessage.id,
        ),
      );
    } finally {
      setSending(false);
    }
  }

  function renderSources(sources) {
    if (!sources || sources.length === 0) {
      return null;
    }

    function getRelevance(distance) {
      const score = Math.max(
        0,
        Math.min(
          100,
          Math.round((1 - distance) * 100),
        ),
      );

      if (score >= 75) {
        return { label: "High relevance", score };
      }
      if (score >= 50) {
        return { label: "Relevant", score };
      }
      return { label: "Possible match", score };
    }

    return (
      <div className="message-sources">
        <div className="sources-header">
          <span className="sources-title">Sources used</span>
          <span className="sources-count">{sources.length}</span>
        </div>

        <div className="sources-list">
          {sources.map((source, index) => {
            const relevance = getRelevance(source.distance);
            const previewLength = 280;
            const isLongContent = source.content.length > previewLength;

            return (
              <SourceCard
                key={source.chunk_id || source.document_id || index}
                source={source}
                index={index}
                relevance={relevance}
                isLongContent={isLongContent}
                previewLength={previewLength}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="chat-page">
        <div className="chat-header">
          <div>
            <h1>Company Knowledge Assistant</h1>
            <p>Ask questions about your company documents and policies.</p>
          </div>
        </div>

        <div className="chat-messages">
          {loadingMessages && (
            <div className="chat-loading">Loading conversation...</div>
          )}

          {!loadingMessages && messages.length === 0 && (
            <div className="chat-welcome">
              <div className="welcome-icon">K</div>
              <h2>How can I help you?</h2>
              <p>
                Ask questions about company documents, policies, processes,
                and internal knowledge.
              </p>

              <div className="suggestion-list">
                <button
                  type="button"
                  onClick={() =>
                    setQuestion("What is the company leave policy?")
                  }
                >
                  What is the company leave policy?
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setQuestion("What are the company working hours?")
                  }
                >
                  What are the company working hours?
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setQuestion("What is the reimbursement policy?")
                  }
                >
                  What is the reimbursement policy?
                </button>
              </div>
            </div>
          )}

          {!loadingMessages &&
            messages.map((message) => (
              <div
                key={message.id}
                className={`message-row ${message.role}`}
              >
                {message.role === "assistant" && (
                  <div className="message-avatar">K</div>
                )}

                <div className="message-content">
                  <div className="message-role">
                    {message.role === "user" ? "You" : "Knowledge Bot"}
                  </div>

                  <div className="message-bubble">
                    {message.role === "assistant" ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      message.content
                    )}
                  </div>

                  {message.role === "assistant" &&
                    renderSources(message.sources)}
                </div>
              </div>
            ))}

          {sending && (
            <div className="message-row assistant">
              <div className="message-avatar">K</div>
              <div className="message-content">
                <div className="message-role">Knowledge Bot</div>
                <div className="message-bubble typing-message">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {error && <div className="chat-error">{error}</div>}

        <form className="chat-input-container" onSubmit={handleSendMessage}>
          <textarea
            ref={textareaRef}
            value={question}
            onChange={handleQuestionChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your company..."
            disabled={sending}
            rows={1}
          />
          <button type="submit" disabled={sending || !question.trim()}>
            {sending ? "..." : "Send"}
          </button>
        </form>

        <div className="chat-input-hint">
          Press Enter to send · Shift + Enter for a new line
        </div>
      </div>
    </AppLayout>
  );
}

export default Chat;