import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Files from "./pages/Files";
import History from "./pages/History";
import Admin from "./pages/Admin";
import { logout as apiLogout, getMe } from "./services/api";
import "./styles/global.css";
import "./styles/layout.css";

function PrivateLayout({ user, setUser, children }) {
  const navigate = useNavigate();
  const handleLogout = () => {
    apiLogout();
    setUser(null);
    navigate("/", { replace: true });
  };
  return (
    <div className="app-layout">
      <div className="app-sidebar-wrap">
        <Sidebar user={user} />
      </div>
      <div className="app-main-wrap">
        <Navbar user={user} onLogout={handleLogout} />
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authCheckDone, setAuthCheckDone] = useState(false);
  const navigate = useNavigate();

  const goToFiles = () => navigate("/files");

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    const done = () => { if (!cancelled) setAuthCheckDone(true); };
    if (token && savedUser) {
      let parsedUser = null;
      try {
        parsedUser = JSON.parse(savedUser);
      } catch {
        apiLogout();
      }
      if (parsedUser) {
        getMe()
          .then((u) => { if (!cancelled) setUser(u); })
          .catch(() => {
            apiLogout();
            if (!cancelled) setUser(null);
          })
          .finally(done);
      } else {
        if (!cancelled) setUser(null);
        done();
      }
    } else {
      try {
        setUser(savedUser ? JSON.parse(savedUser) : null);
      } catch {
        setUser(null);
      }
      done();
    }
    return () => { cancelled = true; };
  }, []);

  if (!authCheckDone) {
    return (
      <div className="app-loading" style={{ minHeight: "100vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <Routes>
        <Route path="/" element={user ? <Navigate to="/home" /> : <Landing />} />
        <Route
  path="/login"
  element={user ? <Navigate to="/home" /> : <Login setUser={setUser} />}
/>
<Route
  path="/register"
  element={user ? <Navigate to="/home" /> : <Register setUser={setUser} />}
/>
        <Route
          path="/home"
          element={
            user ? (
              <PrivateLayout user={user} setUser={setUser}>
                <Home user={user} onOpenUpload={goToFiles} />
              </PrivateLayout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/files"
          element={
            user ? (
              <PrivateLayout user={user} setUser={setUser}>
                <Files user={user} />
              </PrivateLayout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/history"
          element={
            user ? (
              <PrivateLayout user={user} setUser={setUser}>
                <History />
              </PrivateLayout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/admin"
          element={
            user ? (
              <PrivateLayout user={user} setUser={setUser}>
                <Admin />
              </PrivateLayout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
  );
}
