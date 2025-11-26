import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/auth/AuthContext";
import { toast } from "sonner";
import {
  getUserDisplayName,
  getUserInitials,
  getUserEmail,
} from "../utils/auth/helpers";
import ProfilePhotoUploadModal from "../components/auth/Modal/common/ProfilePhotoUploadModal";
import EmployeeProfileService from "../services/auth/EmployeeProfileService";

const Navbar = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Fetch profile photo on mount
  useEffect(() => {
    const fetchProfilePhoto = async () => {
      try {
        const response = await EmployeeProfileService.getProfile();
        if (response.success && response.data?.profilePhotoBase64) {
          setProfilePhoto(`data:image/jpeg;base64,${response.data.profilePhotoBase64}`);
        }
      } catch (error) {
        console.error("Error fetching profile photo:", error);
      }
    };

    fetchProfilePhoto();
  }, []);

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

  const handleCameraClick = (e) => {
    e.stopPropagation();
    setShowPhotoModal(true);
  };

  const handlePhotoUpdate = (newPhotoUrl) => {
    setProfilePhoto(newPhotoUrl);
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
            padding: "1.15rem 1.5rem",
            maxHeight: "100px",
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
                  style={{ fontSize: "1rem", color: "#97247E" }}
                ></i>
                <h6 style={{ margin: 0, fontWeight: "bold", color: "#97247E" }}>
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
                  background: profilePhoto
                    ? "transparent"
                    : "linear-gradient(135deg, #AC5098 0%, #97247E 100%)",
                  border: profilePhoto ? "3px solid #97247E" : "none",
                  boxShadow: "0 2px 8px rgba(151, 36, 126, 0.3)",
                  fontSize: "0.875rem",
                  padding: 0,
                  overflow: "hidden",
                }}
              >
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt="Profile"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "50%",
                    }}
                  />
                ) : (
                  initials
                )}
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
                    {/* Avatar with Camera Icon */}
                    <div
                      style={{
                        position: "relative",
                        width: "72px",
                        height: "72px",
                        margin: "0 auto 1rem",
                        display: "inline-block",
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
                          background: profilePhoto
                            ? "transparent"
                            : "linear-gradient(135deg, #AC5098 0%, #97247E 100%)",
                          border: "4px solid #e5e7eb",
                          fontSize: "1.5rem",
                          boxShadow: "0 4px 12px rgba(151, 36, 126, 0.3)",
                          overflow: "hidden",
                        }}
                      >
                        {profilePhoto ? (
                          <img
                            src={profilePhoto}
                            alt="Profile"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: "50%",
                            }}
                          />
                        ) : (
                          initials
                        )}
                      </div>
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

      {/* Photo Upload Modal */}
      {showPhotoModal && (
        <ProfilePhotoUploadModal
          onClose={() => setShowPhotoModal(false)}
          onPhotoUpdate={handlePhotoUpdate}
        />
      )}
    </>
  );
};

export default Navbar;
