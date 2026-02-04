import React, { useState, useEffect } from "react";
import { getStorage, getFiles, getHistory } from "../services/api";
import DashboardCard from "../components/DashboardCard";
import StorageBar from "../components/StorageBar";
import "../styles/global.css";
import "../styles/dashboard.css";

const MAX_STORAGE_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB

export default function Home({ user, onOpenUpload }) {
  const [storage, setStorage] = useState({ total_bytes: 0, total_mb: 0 });
  const [files, setFiles] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [s, f, h] = await Promise.all([
          getStorage(),
          getFiles(),
          getHistory(10),
        ]);
        if (!cancelled) {
          setStorage(s);
          setFiles(f);
          setHistory(h);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const lastUpload = files.length
    ? files.reduce((a, b) => (a.uploaded_at > b.uploaded_at ? a : b), files[0])
    : null;

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
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setError("");
            setLoading(true);
            Promise.all([getStorage(), getFiles(), getHistory(10)])
              .then(([s, f, h]) => {
                setStorage(s);
                setFiles(f);
                setHistory(h);
              })
              .catch((err) => setError(err.message || "Failed to load"))
              .finally(() => setLoading(false));
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="app-content">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        {onOpenUpload && (
          <button type="button" className="btn btn-primary" onClick={onOpenUpload}>
            Upload file
          </button>
        )}
      </div>

      <StorageBar usedBytes={storage.total_bytes} maxBytes={MAX_STORAGE_BYTES} />

      <div className="dashboard-grid">
        <DashboardCard label="Total storage used" value={`${storage.total_mb} MB`} icon="storage" />
        <DashboardCard label="Files uploaded" value={String(files.length)} icon="files" />
        <DashboardCard
          label="Last upload"
          value={
            lastUpload?.uploaded_at
              ? new Date(lastUpload.uploaded_at).toLocaleString()
              : "—"
          }
          icon="time"
        />
        <DashboardCard label="Recent activity count" value={String(history.length)} icon="activity" />
      </div>

      <div className="activity-section">
        <h2>Activity summary</h2>
        <ul className="activity-list">
          {history.slice(0, 5).map((a) => (
            <li key={a.id}>
              <span className="activity-badge">{a.action}</span>
              <span className="activity-filename">{a.filename || "—"}</span>
              <span className="activity-date">
                {a.created_at ? new Date(a.created_at).toLocaleString() : ""}
              </span>
            </li>
          ))}
        </ul>
        {history.length === 0 && <p className="activity-empty">No recent activity.</p>}
      </div>
    </div>
  );
}
