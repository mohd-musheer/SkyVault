import React from "react";
import "../styles/global.css";
import "../styles/layout.css";

export default function Navbar({ user, onLogout }) {
  return (
    <header className="app-navbar">
      <div className="app-navbar-brand">
        Cloud Drive
      </div>
      <div className="app-navbar-actions">
        {user && (
          <>
            <span className="app-navbar-email" title={user.email}>{user.email}</span>
            <button type="button" className="btn btn-ghost" onClick={onLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
