import { useState } from "react";
import { api } from "../api";

export default function Chatbot() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi — I’m the PurrCare assistant. Describe a behavior change (when it started, eating, litter, energy). I’ll suggest practical next steps. For emergencies, contact a vet right away.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  async function send(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setErr(null);
    setLoading(true);

    try {
      const { reply } = await api.chat(
        next.map(({ role, content }) => ({ role, content }))
      );
      setMessages((m) => [
        ...m,
        { role: "assistant", content: reply || "No reply returned." },
      ]);
    } catch (error) {
      setErr(error.message);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Something went wrong reaching the server. Is the API running on port 5000?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div
        style={{
          background: "rgba(247, 244, 255, 0.82)",
          border: "1px solid #8f79c9",
          borderRadius: "18px",
          padding: "1.1rem 1.25rem",
          marginBottom: "1.25rem",
          boxShadow: "0 8px 18px rgba(60, 34, 112, 0.08)",
          maxWidth: "580px",
    marginInline: "auto",
        }}
      >
        <h1 style={{ textAlign: "center" }}>Chatbot</h1>
        <p className="lede" style={{ marginBottom: 0, textAlign: "center" }}>
          Ask questions about your cat to better understand its behavior. This can
          give you helpful guidance, but it may not always provide exact answers.
        </p>
      </div>

      {err && <div className="alert error">{err}</div>}

      <div
        className="card"
        style={{
          minHeight: "420px",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          overflow: "hidden",
          background: "rgba(247, 244, 255, 0.96)",
          border: "1px solid #8f79c9",
          boxShadow: "0 10px 24px rgba(60, 34, 112, 0.14)",
        }}
      >
        <div
          style={{
            padding: "0.9rem 1rem",
            borderBottom: "1px solid #d7c8ff",
            background: "linear-gradient(90deg, #ece4ff 0%, #f7f4ff 100%)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "14px",
              display: "grid",
              placeItems: "center",
              background: "#5b2db8",
              color: "#fff",
              fontSize: "1.2rem",
              boxShadow: "0 8px 16px rgba(91, 45, 184, 0.22)",
              flexShrink: 0,
            }}
          >
            🐱
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                color: "#24143f",
                fontSize: "1rem",
              }}
            >
              PurrCare Assistant
            </div>
            <div
              style={{
                color: "#5f4b8a",
                fontSize: "0.86rem",
                marginTop: "0.1rem",
              }}
            >
              Friendly guidance for cat behavior and daily care
            </div>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            padding: "1rem 1.15rem",
            overflowY: "auto",
            maxHeight: "min(56vh, 460px)",
            background:
              "linear-gradient(180deg, #ece4ff 0%, #f7f4ff 45%, #fbf9ff 100%)",
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                marginBottom: "0.9rem",
                display: "flex",
                justifyContent:
                  m.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "85%",
                  padding: "0.75rem 0.9rem",
                  borderRadius: "16px",
                  background: m.role === "user" ? "#5b2db8" : "#ffffff",
                  color: m.role === "user" ? "#ffffff" : "#24143f",
                  border:
                    m.role === "user" ? "none" : "1px solid #d8c7ff",
                  boxShadow:
                    m.role === "user"
                      ? "0 8px 18px rgba(91, 45, 184, 0.22)"
                      : "0 6px 14px rgba(60, 34, 112, 0.08)",
                  whiteSpace: "pre-wrap",
                  fontSize: "0.95rem",
                  lineHeight: 1.5,
                }}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading ? (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div
                style={{
                  maxWidth: "85%",
                  padding: "0.7rem 0.9rem",
                  borderRadius: "16px",
                  background: "#ffffff",
                  color: "#5f4b8a",
                  border: "1px solid #d8c7ff",
                  boxShadow: "0 6px 14px rgba(60, 34, 112, 0.08)",
                  fontSize: "0.94rem",
                }}
              >
                Thinking...
              </div>
            </div>
          ) : null}
        </div>

        <form
          onSubmit={send}
          style={{
            display: "flex",
            gap: "0.5rem",
            padding: "0.85rem",
            borderTop: "1px solid var(--line)",
            background: "#f2ebff",
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. My cat has been hiding for no reason for a few days…"
            disabled={loading}
            style={{
              flex: 1,
              margin: 0,
              background: "#ffffff",
              border: "1px solid #cdb7ff",
              boxShadow: "inset 0 1px 2px rgba(60, 34, 112, 0.06)",
            }}
          />
          <button
            type="submit"
            className="btn"
            disabled={loading || !input.trim()}
            style={{
              minWidth: "96px",
              boxShadow: "0 8px 18px rgba(91, 45, 184, 0.24)",
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}