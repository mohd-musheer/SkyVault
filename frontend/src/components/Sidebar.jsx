import React from "react";
import { NavLink } from "react-router-dom";
import "../styles/global.css";
import "../styles/layout.css";

const navItems = [
  { to: "/home", label: "Home", icon: "🏠" },
  { to: "/files", label: "Files", icon: "📁" },
  { to: "/history", label: "History", icon: "📋" },
  { to: "/admin", label: "Admin", icon: "⚙️", adminOnly: true },
];

export default function Sidebar({ user }) {
  return (
    <aside className="app-sidebar-wrap">
      <nav className="app-sidebar">
        <div className="app-sidebar-nav">
          {navItems
            .filter((item) => !item.adminOnly || user?.is_admin)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  "app-sidebar-link" + (isActive ? " active" : "")
                }
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
        </div>
      </nav>
    </aside>
  );
}
