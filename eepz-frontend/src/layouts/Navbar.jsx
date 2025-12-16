import { useState, useEffect, useCallback } from "react";
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
import { getEmployeeNominations } from "../services/performancemanagement/hr/api";

const Navbar = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [hasNominations, setHasNominations] = useState(false);
  const [awardName, setAwardName] = useState("");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const employeeId = user?.empId || null;

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

  // Fetch nominations
  const fetchNominations = useCallback(async () => {
    if (!employeeId) return;
    
    try {
      const response = await getEmployeeNominations(employeeId);
      console.log("Fetched Nominations Response: ", response);
      console.log("Response Data: ", response.data);
      
      if (response?.data?.success && response?.data?.data && response.data.data.length > 0) {
        console.log("Setting hasNominations to TRUE");
        setHasNominations(true);
        setAwardName(response.data.data[0].roleType);
      } else {
        console.log("No nominations found");
        setHasNominations(false);
      }
    } catch (error) {
      console.error("Error fetching nominations:", error);
      setHasNominations(false);
    }
  }, [employeeId]);

  useEffect(() => {
    if (employeeId) {
      fetchNominations();
    }
  }, [employeeId, fetchNominations]);

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

  const handleNavigateToNominations = () => {
    navigate("/employee/dashboard/performance/nominations");
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
          height:"69.5px"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1.5rem", // Reduced from 1.15rem
            height: "60px", // Fixed compact height
          }}
        >
          {/* Left Section */}
          <div
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.5rem",
              flexShrink: 0
            }}
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
                  style={{ fontSize: "0.875rem", color: "#97247E" }}
                />
                <h6 style={{ 
                  margin: 0, 
                  fontSize: "0.875rem",
                  fontWeight: "bold", 
                  color: "#97247E" 
                }}>
                  Welcome, {displayName}
                </h6>
              </div>
              <small style={{ 
                color: "#6c757d", 
                fontSize: "0.75rem"
              }}>
                {formattedDate}
              </small>
            </div>
          </div>

          {/* Right Section */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {/* Congratulations Card - Compact version */}
            {hasNominations && (
              <div
                onClick={handleNavigateToNominations}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  (e.key === "Enter" || e.key === " ") && handleNavigateToNominations()
                }
                aria-label="View Nominations"
                style={{
                  position: "relative",
                  width: "220px", // Reduced width
                  height: "46px", // Fixed compact height
                  backgroundColor: "#f5f5f7",
                  borderRadius: 12,
                  padding: "0 12px",
                  // boxShadow: "0 4px 16px rgba(249, 202, 36, 0.3)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  border: "1px solid rgb(139, 17, 125)",
                  overflow: "hidden",
                  marginRight:"30px",
                  marginTop:"11px",
                  boxShadow : "0 4px 1px rgb(139, 17, 125)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 7px 1px rgb(139, 17, 125)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 1px rgb(139, 17, 125)";
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #f9ca24 0%, #f39c12 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    // boxShadow: "0 2px 8px rgba(243, 156, 18, 0.4)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#fff",
                      filter: "drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2))",
                    }}
                  >
                    ★
                  </div>
                </div>

                <div style={{ flex: 1, textAlign: "left", overflow: "hidden" }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#1a1a1a",
                      lineHeight: 1.2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      marginLeft:"25px"
                    }}
                  >
                    Congratulations!
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      fontWeight: 500,
                      lineHeight: 1.6,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      marginLeft:"20px"

                    }}
                  >
                    {awardName || "Recognition earned"}
                  </div>
                </div>
              </div>
            )}

            {/* User Profile Dropdown */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={{
                  width: "36px",
                  height: "36px",
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
                  border: profilePhoto ? "2px solid #97247E" : "none",
                  boxShadow: "0 2px 8px rgba(151, 36, 126, 0.3)",
                  fontSize: "0.75rem",
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
                    top: "46px",
                    right: 0,
                    minWidth: "280px",
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
                      padding: "1.25rem",
                      textAlign: "center",
                      borderBottom: "1px solid #e5e7eb",
                      
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "64px",
                        height: "64px",
                        margin: "0 auto 0.75rem",
                        display: "inline-block",
                      }}
                    >
                      <div
                        style={{
                          width: "64px",
                          height: "64px",
                          borderRadius: "50%",
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "bold",
                          background: profilePhoto
                            ? "transparent"
                            : "linear-gradient(135deg, #AC5098 0%, #97247E 100%)",
                          border: "3px solid #e5e7eb",
                          fontSize: "1.25rem",
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
                        fontSize: "16px",
                        color: "#97247E",
                      }}
                    >
                      {displayName}
                    </h5>
                    <p
                      style={{
                        color: "#6c757d",
                        marginBottom: "0",
                        fontSize: "13px",
                      }}
                    >
                      {displayEmail}
                    </p>
                  </div>

                  {/* Profile Actions */}
                  <div style={{ padding: "0.75rem" }}>
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
