/**
 * EmployeeHome Component
 * 
 * Employee Dashboard Home Page - Minimal Version
 * Features:
 * - Nomination celebration card (if nominated)
 * - Single "My Assessments" action card
 * - Smooth animations and modern design
 * 
 * @component
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { getEmployeeNominations } from "../../../services/performancemanagement/hr/api";
import "react-toastify/dist/ReactToastify.css";
import "../../../styles/performancemanagement/employee/EmployeeHome.css";

export default function EmployeeHome() {
  const navigate = useNavigate();
  const [nominations, setNominations] = useState([]);
  const [loadingNominations, setLoadingNominations] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));
  const empId = user ? user.empId : null;
  const [employeeId] = useState(() => empId);

  // ========================
  // EFFECTS
  // ========================

  /**
   * Effect: Initialize data on mount
   * Redirects to login if employeeId not found
   */
  useEffect(() => {
    if (!employeeId) {
      navigate("/employee/login");
      return;
    }
    fetchNominations();
  }, [employeeId, navigate]);

  // ========================
  // API FUNCTIONS
  // ========================

  /**
   * Fetches employee nominations
   */
  const fetchNominations = async () => {
    try {
      const response = await getEmployeeNominations(employeeId);
      if (response.status === 200 && response.data.success && response.data.count > 0) {
        setNominations(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching nominations:", error);
    } finally {
      setLoadingNominations(false);
    }
  };

  // ========================
  // HANDLER FUNCTIONS
  // ========================

  /**
   * Navigates to assessments page
   */
  const handleNavigateToAssessments = () => {
    navigate("/employee/dashboard/performance/my-assessments");
  };

  // ========================
  // RENDER FUNCTIONS
  // ========================

  /**
   * Renders the nomination celebration card
   */
  const renderNominationCard = () => {
    if (loadingNominations || nominations.length === 0) return null;

    return (
      <div className="ehp-nomination-card">
        <div className="ehp-nomination-icon">🎉</div>
        <div className="ehp-nomination-content">
          <h3 className="ehp-nomination-title">Congratulations!</h3>
          <p className="ehp-nomination-text">
            You have been nominated for: <strong>{nominations.map(n => n.roleType).join(", ")}</strong>
          </p>
          <p className="ehp-nomination-subtext">
            Your hard work and dedication have been recognized!
          </p>
        </div>
      </div>
    );
  };

  // ========================
  // MAIN RENDER - LOADING STATE
  // ========================

  if (loadingNominations) {
    return (
      <div className="ehp-loading-container">
        <div className="ehp-loading-content">
          <div className="spinner-border"></div>
          <p className="ehp-loading-text">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // ========================
  // MAIN RENDER - PAGE CONTENT
  // ========================

  return (
    <div className="ehp-page">
      <ToastContainer />

      <div className="ehp-container">
        {/* Nomination Celebration Card */}
        {renderNominationCard()}

        {/* My Assessments Card - Single Centered Card */}
        <div className="ehp-assessment-section">
          <div 
            className="ehp-assessment-card"
            onClick={handleNavigateToAssessments}
          >
            <div className="ehp-assessment-icon">
              <i className="bi bi-clipboard-check"></i>
            </div>
            <div className="ehp-assessment-content">
              <h3 className="ehp-assessment-title">My Assessments</h3>
              <p className="ehp-assessment-description">
                Complete your performance assessments and track your progress across all assigned evaluations
              </p>
              <div className="ehp-assessment-link">
                View Details
                <i className="bi bi-arrow-right"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
