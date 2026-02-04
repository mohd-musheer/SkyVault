import React from "react";

const icons = { storage: "💾", files: "📁", time: "🕐", activity: "📊" };
export default function DashboardCard({ label, value, icon = "storage" }) {
  return (
    <div className={`dashboard-card ${icon}-card`}>
      <div className={`card-icon ${icon}`}>
        {icons[icon] || "📌"}
      </div>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}
