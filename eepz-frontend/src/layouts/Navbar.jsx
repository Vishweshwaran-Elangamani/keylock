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
import { getEmployeeNominations } from "../services/performancemanagement/api/nominationapi";
import "../styles/layout_styles/Navbar.css";

const Navbar = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [nominations, setNominations] = useState([]);
  const [hasNominations, setHasNominations] = useState(false);
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

      if (
        response?.data?.success &&
        response?.data?.data &&
        response.data.data.length > 0
      ) {
        setNominations(response.data.data);
        setHasNominations(true);
      } else {
        setNominations([]);
        setHasNominations(false);
      }
    } catch (error) {
      console.error("Error fetching nominations:", error);
      setNominations([]);
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

  const handleNavigateToNominations = (nomination) => {
    navigate("/employee/dashboard/performance/nominations", {
      state: { selectedNomination: nomination },
    });
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
      <header className="nbd-navbar">
        <div className="nbd-navbar-container">
          {/* Left Section */}
          <div className="nbd-navbar-left">
            <div className="nbd-welcome-section">
              <div className="nbd-welcome-header">
                <i className="bi bi-person-circle nbd-welcome-icon" />
                <h6 className="nbd-welcome-text">Welcome, {displayName}</h6>
              </div>
              <small className="nbd-welcome-date">{formattedDate}</small>
            </div>
          </div>

          {/* Right Section */}
          <div className="nbd-navbar-right">
            {/* Individual Nomination Cards */}
            {hasNominations &&
              nominations.length > 0 &&
              nominations.map((nomination, index) => (
                <div
                  key={nomination.nominationId || index}
                  className="nbd-congrats-card"
                  onClick={() => handleNavigateToNominations(nomination)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") &&
                    handleNavigateToNominations(nomination)
                  }
                  aria-label="View Nominations"
                >
                  <div className="nbd-congrats-icon">
                    <div className="nbd-star-icon">★</div>
                  </div>

                  <div className="nbd-congrats-content">
                    <div className="nbd-congrats-title">Congratulations!</div>
                    <div className="nbd-congrats-subtitle">
                      {nomination.roleType}
                    </div>
                  </div>
                </div>
              ))}

            {/* User Profile Dropdown */}
            <div className="nbd-profile-wrapper">
              <button
                className="nbd-profile-avatar"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                aria-label="User profile menu"
              >
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt="Profile"
                    className="nbd-profile-photo"
                  />
                ) : (
                  <span className="nbd-profile-initials">{initials}</span>
                )}
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="nbd-dropdown-menu">
                  {/* Profile Header */}
                  <div className="nbd-dropdown-header">
                    <div className="nbd-dropdown-avatar-wrapper">
                      <div className="nbd-dropdown-avatar">
                        {profilePhoto ? (
                          <img
                            src={profilePhoto}
                            alt="Profile"
                            className="nbd-dropdown-photo"
                          />
                        ) : (
                          <span className="nbd-dropdown-initials">
                            {initials}
                          </span>
                        )}
                      </div>
                    </div>

                    <h5 className="nbd-dropdown-name">{displayName}</h5>
                    <p className="nbd-dropdown-email">{displayEmail}</p>
                  </div>

                  {/* Profile Actions */}
                  <div className="nbd-dropdown-actions">
                    <button
                      onClick={handleProfile}
                      className="nbd-action-btn nbd-action-btn-primary"
                    >
                      <i className="bi bi-person"></i>
                      Profile
                    </button>

                    <button
                      onClick={handleChangePassword}
                      className="nbd-action-btn nbd-action-btn-primary"
                    >
                      <i className="bi bi-key"></i>
                      Change Password
                    </button>

                    <button
                      onClick={handleLogout}
                      className="nbd-action-btn nbd-action-btn-danger"
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
          className="nbd-backdrop"
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
