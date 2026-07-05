import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { FaUserCircle, FaUserTie } from "react-icons/fa";
import "./Navbar.css";

export default function Navbar({ sidebarOpen, setSidebarOpen }) {
  const [time, setTime] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  const dropdownRef = useRef();
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current &&!dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      try {
        await signOut(auth);
        localStorage.removeItem("user");
        navigate("/");
      } catch (err) {
        console.error("Logout error:", err);
      }
    }
  };

  const isAdmin = user?.role === "admin";

  return (
    <div className="navbar">
      {/* LEFT */}
      <div className="nav-left">
        
        <h3>{isAdmin? "Admin Dashboard" : "Agent Dashboard"}</h3>
      </div>

      {/* RIGHT - Time + Date + Profile */}
      <div className="nav-right">
        {/* DATE & TIME */}
        <div className="datetime-wrapper">
          <span>⏰ {time.toLocaleTimeString()}</span>
          <span>📅 {time.toLocaleDateString()}</span>
        </div>

        {/* PROFILE */}
        <div ref={dropdownRef}>
          <div className="profile-wrapper" onClick={() => setOpen(!open)}>
            <div className="profile-icon">
              {isAdmin? <FaUserCircle /> : <FaUserTie />}
            </div>
            <div className="profile-name">{user?.name || "User"}</div>
          </div>

          {/* DROPDOWN */}
          {open && user && (
            <div className="dropdown">
              <p><b>Name:</b> {user.name}</p>
              <p><b>Email:</b> {user.email}</p>
              <p><b>Role:</b> {isAdmin? "Administrator" : "Agent"}</p>
              <p><b>Country:</b> {user.country}</p>
              <p><b>Phone:</b> {user.phone}</p>
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
