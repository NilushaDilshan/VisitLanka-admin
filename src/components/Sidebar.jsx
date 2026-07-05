import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import "./Sidebar.css";
import logo from "../assets/logo.jpg";

import {
  FaTachometerAlt,
  FaMapMarkedAlt,
  FaHotel,
  FaCar,
  FaBook,
  FaUsers,
  FaUserTie,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
  FaUserCircle
} from "react-icons/fa";

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();

  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.role === "admin";

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

  // Admin menu items - full access
  const adminMenuItems = [
    { path: "/dashboard", name: "Dashboard", icon: <FaTachometerAlt /> },
    { path: "/destinations", name: "Destinations", icon: <FaMapMarkedAlt /> },
    { path: "/hotels", name: "Hotels", icon: <FaHotel /> },
    { path: "/vehicles", name: "Vehicles", icon: <FaCar /> },
    { path: "/bookings", name: "All Bookings", icon: <FaBook /> },
    { path: "/users", name: "Users", icon: <FaUsers /> },
    { path: "/agents", name: "Agents", icon: <FaUserTie /> },
    { path: "/report", name: "Report", icon: <FaChartBar /> },
    { path: "/settings", name: "Settings", icon: <FaCog /> },
  ];

  // Agent menu items - limited access
  const agentMenuItems = [
    { path: "/dashboard", name: "Dashboard", icon: <FaTachometerAlt /> },
    { path: "/hotels", name: "Hotels", icon: <FaHotel /> },
    { path: "/destinations", name: "Destinations", icon: <FaMapMarkedAlt /> },
    { path: "/vehicles", name: "Vehicles", icon: <FaCar /> },
    { path: "/bookings", name: "Bookings", icon: <FaBook /> },
    { path: "/settings", name: "Settings", icon: <FaCog /> },
  ];

  const menuItems = isAdmin? adminMenuItems : agentMenuItems;
  const isActive = (path) => location.pathname === path;

  return (
    <div className={`sidebar-card ${sidebarOpen? "open" : "closed"}`}>
      {/* LOGO SECTION */}
      <div className="logo-section">
        <img src={logo} alt="logo" />
        {sidebarOpen && (
          <h2>
            <span className="text-blue">Visit</span>
            <span className="text-green">Lanka</span>
            <p className="role-badge">{isAdmin? "Admin Panel" : "Agent Panel"}</p>
          </h2>
        )}
      </div>

      {/* USER INFO BLOCK එක අයින් කළා */}

      {/* MENU */}
      <nav className="menu">
        {menuItems.map((item) => (
          <Link 
            key={item.path}
            to={item.path}
            className={isActive(item.path)? "active" : ""}
            title={!sidebarOpen? item.name : ""}
          >
            {item.icon} {sidebarOpen && item.name}
          </Link>
        ))}
      </nav>

      {/* LOGOUT */}
      <button className="logout-btn" onClick={handleLogout}>
        <FaSignOutAlt /> {sidebarOpen && "Logout"}
      </button>
    </div>
  );
}