import React from "react";
import { Link } from "react-router-dom";
import "../styles/global.css";
import "../styles/landing.css";

export default function Landing() {
  const features = [
    { title: "Secure", desc: "Your files are stored safely with authentication.", icon: "🔒" },
    { title: "History", desc: "See upload and download activity anytime.", icon: "📋" },
    { title: "Storage", desc: "Track usage and manage your files in one place.", icon: "📦" },
  ];
  const steps = [
    "Create an account or log in.",
    "Upload your files from the dashboard.",
    "View history and manage storage anytime.",
  ];

  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero-content">
          <h1>Your files, secure in the cloud</h1>
          <p className="subheading">
            Upload, store, and access your files from anywhere. Simple, fast, and private.
          </p>
          <div className="landing-hero-cta">
            <Link to="/login" className="btn btn-primary">
              Login
            </Link>
            <Link to="/register" className="btn btn-secondary">
              Register
            </Link>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <h2 className="landing-section-title">Why use Cloud Drive?</h2>
        <div className="landing-features">
          {features.map((f) => (
            <div key={f.title} className="landing-feature-card">
              <div className="landing-feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section landing-how">
        <h2 className="landing-section-title">How it works</h2>
        <ol className="landing-how-list">
          {steps.map((text, i) => (
            <li key={i}>
              <span className="landing-how-step">{i + 1}</span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
      </section>

      <footer className="landing-footer">
        Cloud Drive – Secure storage. Login or Register to get started.
      </footer>
    </div>
  );
}
