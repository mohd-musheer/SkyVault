import React, { useState, useEffect, useRef } from "react";
import { getFiles, downloadFile, deleteFile, uploadFile } from "../services/api";
import UploadModal from "../components/UploadModal";
import "../styles/global.css";
import "../styles/dashboard.css";
import "../styles/files.css";

export default function Files({ user, onRefresh }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadModal, setUploadModal] = useState(false);
  const [droppedFile, setDroppedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const loadIdRef = useRef(0);

  const load = async () => {
    const id = loadIdRef.current + 1;
    loadIdRef.current = id;
    setLoading(true);
    setError("");
    try {
      const data = await getFiles();
      if (loadIdRef.current === id) {
        setFiles(data);
      }
    } catch (err) {
      if (loadIdRef.current === id) {
        setError(err.message || "Failed to load files");
      }
    } finally {
      if (loadIdRef.current === id) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async (file) => {
    await uploadFile(file);
    await load();
    onRefresh?.();
  };

  const handleDownload = async (id) => {
    if (downloadingId) return;
    setDownloadingId(id);
    try {
      await downloadFile(id);
    } catch (err) {
      setError(err.message || "Download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this file?")) return;
    if (deletingId) return;
    setDeletingId(id);
    try {
      await deleteFile(id);
      await load();
      onRefresh?.();
    } catch (err) {
      setError(err.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      setDroppedFile(file);
      setUploadModal(true);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => setDragOver(false);

  const closeUploadModal = () => {
    setUploadModal(false);
    setDroppedFile(null);
  };

  if (loading && files.length === 0) {
    return (
      <div className="app-content app-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="app-content">
      <div className="page-header">
        <h1 className="page-title">Files</h1>
        <button type="button" className="btn btn-primary" onClick={() => setUploadModal(true)}>
          Upload file
        </button>
      </div>
      {error && <p className="msg-error">{error}</p>}

      <div
        className={`files-drag-zone ${dragOver ? "drag-over" : ""}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <p className="drag-icon">📤</p>
        <p>Drag and drop a file here, or use the Upload button above.</p>
      </div>

      <div className="files-list">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Size</th>
              <th>Uploaded</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {files.map((f) => (
              <tr key={f.id}>
                <td>
                  <div className="file-cell">
                    <span className="file-icon">📄</span>
                    <span className="file-name">{f.original_filename}</span>
                  </div>
                </td>
                <td className="file-meta">{formatSize(f.size_bytes)}</td>
                <td className="file-meta">
                  {f.uploaded_at ? new Date(f.uploaded_at).toLocaleString() : "—"}
                </td>
                <td>
                  <div className="file-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleDownload(f.id)}
                      disabled={downloadingId === f.id}
                    >
                      {downloadingId === f.id ? "…" : "Download"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => handleDelete(f.id)}
                      disabled={deletingId === f.id}
                    >
                      {deletingId === f.id ? "…" : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {files.length === 0 && !loading && (
          <p className="files-empty">No files yet. Upload one to get started.</p>
        )}
      </div>

      {uploadModal && (
        <UploadModal
          onUpload={handleUpload}
          onClose={closeUploadModal}
          initialFile={droppedFile}
        />
      )}
    </div>
  );
}
