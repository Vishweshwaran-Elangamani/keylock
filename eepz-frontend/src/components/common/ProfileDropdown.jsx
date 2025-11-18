/**
 * ProfileDropdown Component
 *
 * A dropdown menu component for user profile access and logout functionality.
 * Features:
 * - Display user avatar with initials
 * - Show user information (name, email, employee ID)
 * - Navigation to profile and password change pages
 * - Logout functionality with toast notification
 * - Click-outside detection to close dropdown
 * - Responsive design
 *
 * @component
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";
import {
  getUserDisplayName,
  getUserInitials,
  getUserEmail,
  getEmployeeId,
} from "../../utils/auth/helpers";
import "../../styles/components/ProfileDropdown.css";

const ProfileDropdown = () => {
  // ========================
  // STATE MANAGEMENT
  // ========================

  /**
   * Dropdown open state - controls visibility of dropdown menu
   */
  const [isOpen, setIsOpen] = useState(false);

  // ========================
  // REFS
  // ========================

  /**
   * Reference to dropdown container
   * Used for click-outside detection
   */
  const dropdownRef = useRef(null);

  // ========================
  // HOOKS
  // ========================
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // ========================
  // EFFECTS
  // ========================

  /**
   * Effect: Setup click-outside handler for dropdown
   * Closes dropdown when user clicks outside of it
   * Cleans up event listener on component unmount
   */
  useEffect(() => {
    /**
     * Handles click outside dropdown
     * Checks if clicked element is outside dropdown ref
     *
     * @param {Event} event - Click event
     */
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup function - remove event listener
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ========================
  // EVENT HANDLERS
  // ========================

  /**
   * Handles user logout
   * Calls logout function from auth context
   * Shows success toast notification
   * Redirects to login page
   */
  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!");
    navigate("/login");
  };

  /**
   * Handles profile navigation
   * Closes dropdown before navigating
   */
  const handleProfileClick = () => {
    setIsOpen(false);
    navigate("/profile");
  };

  /**
   * Handles change password navigation
   * Closes dropdown before navigating
   * Passes state indicating navigation from settings
   */
  const handleChangePasswordClick = () => {
    setIsOpen(false);
    navigate("/change-password", { state: { fromSettings: true } });
  };

  // ========================
  // DATA EXTRACTION
  // ========================

  /**
   * Extract user display information using helper functions
   * Prevents rendering errors if user data is incomplete
   */
  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(user);
  const displayEmail = getUserEmail(user);
  const displayEmpId = getEmployeeId(user);

  // ========================
  // RENDER LOGIC
  // ========================
  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      {/* ======================== */}
      {/* PROFILE BUTTON - TRIGGER */}
      {/* ======================== */}
      <button
        className="profile-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        title="Open profile menu"
      >
        {/* Avatar with User Initials */}
        <div className="profile-avatar">{initials}</div>
      </button>

      {/* ======================== */}
      {/* DROPDOWN MENU - CONDITIONAL RENDER */}
      {/* ======================== */}
      {isOpen && (
        <div className="profile-dropdown-menu">
          {/* -------- Header Section -------- */}
          {/* Displays user information at top of dropdown */}
          <div className="profile-header">
            {/* Large Avatar */}
            <div className="profile-avatar-large">{initials}</div>

            {/* User Information */}
            <div className="profile-info">
              {/* User Full Name */}
              <div className="profile-name">{displayName}</div>

              {/* User Email */}
              <div className="profile-email">{displayEmail}</div>

              {/* Employee ID */}
              <div className="profile-empid">Emp ID: {displayEmpId}</div>
            </div>
          </div>

          {/* -------- Menu Items Section -------- */}
          {/* Contains navigation and action buttons */}
          <div className="profile-menu-items">
            {/* Profile Navigation Button */}
            <button
              className="profile-menu-item"
              onClick={handleProfileClick}
              title="Go to profile page"
            >
              <i className="bi bi-person"></i>
              Profile
            </button>

            {/* Change Password Navigation Button */}
            <button
              className="profile-menu-item"
              onClick={handleChangePasswordClick}
              title="Change your password"
            >
              <i className="bi bi-key"></i>
              Change Password
            </button>

            {/* Divider */}
            <hr className="profile-divider" />

            {/* Logout Button */}
            {/* Highlighted with logout-item class */}
            <button
              className="profile-menu-item logout-item"
              onClick={handleLogout}
              title="Logout from your account"
            >
              <i className="bi bi-box-arrow-right"></i>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
