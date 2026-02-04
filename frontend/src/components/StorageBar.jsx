import React from "react";

/**
 * Storage usage bar: used / max (e.g. 2.5 GB / 5 GB), visual bar.
 */
export default function StorageBar({ usedBytes = 0, maxBytes = 5 * 1024 * 1024 * 1024 }) {
  const usedMB = (usedBytes / (1024 * 1024)).toFixed(2);
  const maxGB = (maxBytes / (1024 * 1024 * 1024)).toFixed(1);
  const percent = maxBytes > 0 ? Math.min(100, (usedBytes / maxBytes) * 100) : 0;

  return (
    <div className="storage-bar-wrap">
      <div className="label">
        <span>Storage used</span>
        <span>
          {usedMB} MB / {maxGB} GB
        </span>
      </div>
      <div className="storage-bar-track">
        <div
          className="storage-bar-fill"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
