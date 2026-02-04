import React, { useState, useEffect } from "react";
import { getHistory, clearHistory } from "../services/api";
import "../styles/global.css";
import "../styles/dashboard.css";

function getActionIcon(action) {
  const a = (action || "").toLowerCase();
  if (a.includes("upload")) return "upload";
  if (a.includes("download")) return "download";
  if (a.includes("delete")) return "delete";
  return "upload";
}

export default function History() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearLoading, setClearLoading] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = () => {
    setError("");
    getHistory(50)
      .then(setItems)
      .catch((err) => setError(err.message || "Failed to load history"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadHistory();
  }, []);

  if (loading) {
    return (
      <div className="app-content app-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-content">
        <p className="msg-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="app-content">
      {/* HEADER WITH CLEAR BUTTON */}
      <div className="history-header">
        <h1 className="page-title">History</h1>

        {items.length > 0 && (
          <button
            type="button"
            className="danger-btn"
            disabled={clearLoading}
            onClick={async () => {
              if (!window.confirm("Clear all history?")) return;
              setClearLoading(true);
              setError("");
              try {
                await clearHistory();
                setItems([]);
              } catch (err) {
                setError(err.message || "Failed to clear history");
              } finally {
                setClearLoading(false);
              }
            }}
            style={{
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "#fff",
              border: "none",
              padding: "8px 14px",
              borderRadius: "10px",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: clearLoading ? "not-allowed" : "pointer",
              boxShadow: "0 6px 14px rgba(239, 68, 68, 0.35)",
              opacity: clearLoading ? 0.7 : 1,
            }}
          >
            {clearLoading ? "Clearing…" : "Clear History"}
          </button>
        )}
      </div>

      <div className="history-list">
        {items.length === 0 ? (
          <p className="history-empty">No activity yet.</p>
        ) : (
          <ul>
            {items.map((a) => (
              <li key={a.id}>
                <span className={`action-icon ${getActionIcon(a.action)}`}>
                  {getActionIcon(a.action) === "upload" && "📤"}
                  {getActionIcon(a.action) === "download" && "📥"}
                  {getActionIcon(a.action) === "delete" && "🗑️"}
                </span>

                <span className="action-badge">{a.action}</span>

                <span className="history-filename">
                  {a.filename || "—"}
                </span>

                <span className="history-date">
                  {a.created_at
                    ? new Date(a.created_at).toLocaleString()
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
