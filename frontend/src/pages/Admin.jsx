import React, { useState, useEffect } from "react";
import { adminStats, adminUsers } from "../services/api";
import "../styles/global.css";
import "../styles/dashboard.css";

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([adminStats(), adminUsers()])
      .then(([s, u]) => {
        setStats(s);
        setUsers(u);
      })
      .catch((err) => setError(err.message || "Admin access required"))
      .finally(() => setLoading(false));
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
      <h1 className="page-title">Admin</h1>
      <div className="admin-stats">
        <div className="stat gradient-1">
          <div className="label">Total users</div>
          <div className="value">{stats?.total_users ?? 0}</div>
        </div>
        <div className="stat gradient-2">
          <div className="label">Total files</div>
          <div className="value">{stats?.total_files ?? 0}</div>
        </div>
        <div className="stat gradient-3">
          <div className="label">Total storage (MB)</div>
          <div className="value">{stats?.total_storage_mb ?? 0}</div>
        </div>
        <div className="stat gradient-4">
          <div className="label">Recent activities</div>
          <div className="value">{stats?.recent_activities ?? 0}</div>
        </div>
      </div>
      <h2 className="admin-section-title">Users</h2>
      <div className="admin-table-wrap">
        <div className="files-list">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Name</th>
                <th>Admin</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="file-meta">{u.id}</td>
                  <td className="file-name">{u.email}</td>
                  <td className="file-meta">{u.full_name || "—"}</td>
                  <td>
                    <span className={`admin-badge ${u.is_admin ? "" : "no"}`}>
                      {u.is_admin ? "Admin" : "User"}
                    </span>
                  </td>
                  <td className="file-meta">
                    {u.created_at ? new Date(u.created_at).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
