import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/auth/AuthContext";
import { toast } from "sonner";

import {
  getUserDisplayName,
  getUserInitials,
  getUserEmail,
} from "../utils/auth/helpers";

const Navbar = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    toast.success("You have been logged out successfully!");
    setTimeout(() => {
      logout();
    }, 500);
  };

  const handleChangePassword = () => {
    localStorage.setItem("tempUser", JSON.stringify(user));
    navigate("/change-password", { state: { user, fromSettings: true } });
    setShowProfileMenu(false);
  };

  const handleProfile = () => {
    navigate("/profile");
    setShowProfileMenu(false);
  };

  const formatDate = (date, locale = navigator.language || "en-IN") => {
    return new Intl.DateTimeFormat(locale, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const today = new Date();
  const formattedDate = formatDate(today);

  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(user);
  const displayEmail = getUserEmail(user);

  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          background: "#FFFFFF",
          borderBottom: "1px solid #e5e7eb",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1.5rem",
          }}
        >
          {/* Left Section */}
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <i
                  className="bi bi-person-circle"
                  style={{ fontSize: "1.2rem", color: "#97247E" }}
                ></i>
                <h6
                  style={{ margin: 0, fontWeight: "bold", color: "#97247E" }}
                >
                  Welcome, {displayName}
                </h6>
              </div>
              <small style={{ color: "#6c757d" }}>{formattedDate}</small>
            </div>
          </div>

          {/* Right Section */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* User Profile Dropdown */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  cursor: "pointer",
                  background:
                    "linear-gradient(135deg, #AC5098 0%, #97247E 100%)",
                  border: "none",
                  boxShadow: "0 2px 8px rgba(151, 36, 126, 0.3)",
                  fontSize: "0.875rem",
                }}
              >
                {initials}
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div
                  style={{
                    position: "absolute",
                    top: "50px",
                    right: 0,
                    minWidth: "320px",
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
                    padding: 0,
                    background: "#FFFFFF",
                    zIndex: 1001,
                  }}
                >
                  {/* Profile Header */}
                  <div
                    style={{
                      padding: "1.5rem",
                      textAlign: "center",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <div
                      style={{
                        width: "72px",
                        height: "72px",
                        borderRadius: "50%",
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        margin: "0 auto 1rem",
                        background:
                          "linear-gradient(135deg, #AC5098 0%, #97247E 100%)",
                        border: "4px solid #e5e7eb",
                        fontSize: "1.5rem",
                        boxShadow: "0 4px 12px rgba(151, 36, 126, 0.3)",
                      }}
                    >
                      {initials}
                    </div>
                    <h5
                      style={{
                        fontWeight: "bold",
                        marginBottom: "0.25rem",
                        fontSize: "18px",
                        color: "#97247E",
                      }}
                    >
                      {displayName}
                    </h5>
                    <p
                      style={{
                        color: "#6c757d",
                        marginBottom: "0.5rem",
                        fontSize: "14px",
                      }}
                    >
                      {displayEmail}
                    </p>
                  </div>

                  {/* Profile Actions */}
                  <div style={{ padding: "1rem" }}>
                    <button
                      onClick={handleProfile}
                      style={{
                        width: "100%",
                        marginBottom: "0.5rem",
                        padding: "0.5rem",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        backgroundColor: "#3f4d8f",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "14px",
                        cursor: "pointer",
                      }}
                    >
                      <i className="bi bi-person"></i>
                      Profile
                    </button>

                    <button
                      onClick={handleChangePassword}
                      style={{
                        width: "100%",
                        marginBottom: "0.5rem",
                        padding: "0.5rem",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        backgroundColor: "#3f4d8f",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "14px",
                        cursor: "pointer",
                      }}
                    >
                      <i className="bi bi-key"></i>
                      Change Password
                    </button>

                    <button
                      onClick={handleLogout}
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        backgroundColor: "transparent",
                        color: "#dc3545",
                        border: "1px solid #dc3545",
                        borderRadius: "8px",
                        fontSize: "14px",
                        cursor: "pointer",
                      }}
                    >
                      <i className="bi bi-box-arrow-right"></i>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Backdrop */}
      {showProfileMenu && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </>
  );
};

export default Navbar;