import React, { useState, useRef, useEffect } from "react";
import "../styles/global.css";
import "../styles/files.css";

export default function UploadModal({ onUpload, onClose, initialFile }) {
  const [file, setFile] = useState(initialFile || null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const uploadStartedRef = useRef(false);

  useEffect(() => {
    if (initialFile) setFile(initialFile);
    uploadStartedRef.current = false;
  }, [initialFile]);

  const resetInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const runUpload = async (fileToUpload) => {
    if (!fileToUpload || uploading) return;
    setError("");
    setUploading(true);
    setProgress(0);
    resetInput();
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 12, 90));
    }, 150);
    try {
      await onUpload(fileToUpload);
      clearInterval(interval);
      setProgress(100);
      setSuccess(true);
      setTimeout(() => {
        setFile(null);
        setUploading(false);
        uploadStartedRef.current = false;
        onClose();
      }, 800);
    } catch (err) {
      clearInterval(interval);
      setError(err.message || "Upload failed");
      setUploading(false);
      uploadStartedRef.current = false;
    }
  };

  useEffect(() => {
    if (!file || uploading || success || uploadStartedRef.current) return;
    const toUpload = file;
    uploadStartedRef.current = true;
    runUpload(toUpload);
    return () => {
      uploadStartedRef.current = false;
    };
  }, [file]);

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer?.files;
    if (files?.length) {
      setFile(files[0]);
      if (files.length > 1) setError("Only the first file will be uploaded.");
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  const onInputChange = (e) => {
    const chosen = e.target.files?.[0];
    if (chosen) setFile(chosen);
  };

  const handleBackdropClick = (e) => {
    if (uploading) return;
    if (e.target === e.currentTarget) onClose();
  };

  const formatSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="upload-modal-backdrop" onClick={handleBackdropClick}>
      <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
        {success ? (
          <div className="upload-success visible">
            <div className="success-icon">✅</div>
            <p>Upload complete!</p>
          </div>
        ) : (
          <>
            <h3>Upload file</h3>
            <form onSubmit={(e) => e.preventDefault()}>
              <div
                className={`upload-drop-zone ${isDragOver ? "drag-over" : ""} ${uploading ? "uploading" : ""}`}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => !uploading && fileInputRef.current?.click()}
                style={{ pointerEvents: uploading ? "none" : undefined }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={onInputChange}
                  disabled={uploading}
                  style={{ position: "absolute", inset: 0, opacity: 0, cursor: uploading ? "not-allowed" : "pointer", width: "100%", height: "100%" }}
                />
                <div className="drop-icon">📁</div>
                <p>{file ? file.name : "Click or drag a file here"}</p>
              </div>

              {file && !uploading && !success && (
                <div className="upload-preview">
                  <div className="upload-preview-icon">📄</div>
                  <div className="upload-preview-info">
                    <div className="upload-preview-name">{file.name}</div>
                    <div className="upload-preview-size">{formatSize(file.size)}</div>
                  </div>
                </div>
              )}

              <div className={`upload-progress-wrap ${uploading ? "visible" : ""}`}>
                <div className="label">
                  <span>Uploading…</span>
                  <span>{progress}%</span>
                </div>
                <div className="upload-progress-track">
                  <div className="upload-progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {error && <p className="msg-error">{error}</p>}

              <div className="upload-modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    if (!uploading) {
                      setError("");
                      setFile(null);
                      resetInput();
                      uploadStartedRef.current = false;
                      onClose();
                    }
                  }}
                  disabled={uploading}
                >
                  Cancel
                </button>
                {error && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => runUpload(file)}
                    disabled={uploading}
                  >
                    Retry
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
