import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Confetti from "react-confetti";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { getEmployeeNominations } from "../../../services/performancemanagement/api/nominationapi";
import "react-toastify/dist/ReactToastify.css";
import "../../../styles/performancemanagement/employee/Nominations.css";

export default function Nominations() {
  const navigate = useNavigate();
  const location = useLocation();
  const [nominations, setNominations] = useState([]);
  const [loadingNominations, setLoadingNominations] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedNomination, setSelectedNomination] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const empId = user ? user.empId : null;
  const [employeeId] = useState(() => empId);

  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Breadcrumb items
  const breadcrumbItems = [
    {
      label: "Performance",
      path: "/employee/dashboard/performance",
    },
    {
      label: "Nominations",
      path: null,
    },
  ];

  useEffect(() => {
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!employeeId) {
      navigate("/employee/login");
      return;
    }
    fetchNominations();
  }, [employeeId, navigate]);

  const fetchNominations = async () => {
    try {
      const response = await getEmployeeNominations(employeeId);
      if (
        response.status === 200 &&
        response.data &&
        response.data.success &&
        response.data.count > 0
      ) {
        setNominations(response.data.data || []);
        setShowConfetti(true);

        if (response.data.data && response.data.data.length > 0) {
          setSelectedNomination(response.data.data[0]);
        }
      } else {
        setNominations([]);
        setSelectedNomination(null);
      }
    } catch (error) {
      console.error("Error fetching nominations:", error);
      setNominations([]);
      setSelectedNomination(null);
    } finally {
      setLoadingNominations(false);
    }
  };

  useEffect(() => {
    if (location.state?.selectedNomination) {
      setSelectedNomination(location.state.selectedNomination);
    }
  }, [location.state]);

  const handleNominationClick = (nomination) => {
    setSelectedNomination(nomination);
  };

  const renderNominationCard = () => {
    if (loadingNominations || !selectedNomination) return null;

    return (
      <div className="nom-card-wrapper">
        <div className="nom-decorative-bg-1" />

        <div className="nom-main-card">
          <div className="nom-card-grid">
            <div className="nom-icon-section">
              <div className="nom-glow-bg" />

              <div className="nom-icon-container">
                <i className="bi bi-award-fill" />
              </div>
            </div>

            <div className="nom-content-section">
              <h1 className="nom-title">Congratulations!</h1>

              <p className="nom-subtitle">
                You have been recognized for your outstanding contribution and
                excellence
              </p>

              <div className="nom-award-box">
                <p className="nom-award-label">
                  <i className="bi bi-badge-check" />
                  Award
                </p>
                <h2 className="nom-award-name">
                  {selectedNomination.roleType}
                </h2>
              </div>

              {/* Message */}
              <p className="nom-message">
                {/* <i className="bi bi-info-circle" /> */}
                <span>
                  Your hard work, dedication, and exceptional performance have
                  been recognized and appreciated by your organization and
                  peers.
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loadingNominations) {
    return (
      <div className="nom-page">
        <Breadcrumb items={breadcrumbItems} />
        <div className="nom-loading-container">
          <div className="nom-loading-content">
            <div className="spinner-border" />
            <p className="nom-loading-text">Loading your achievements...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nom-page">
      <Breadcrumb items={breadcrumbItems} />

      <ToastContainer />

      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={true}
          numberOfPieces={100}
          gravity={0.7}
        />
      )}

      <div className="nom-container">
        {/* Page Header */}
        <div className="nom-page-header">
          <div className="nom-header-title">
            <i className="bi bi-trophy-fill" />
            <h1>Your Achievements</h1>
          </div>

          <div className="nom-header-badge">
            <i className="bi bi-star-fill" />
            <p>
              {nominations.length} recognition
              {nominations.length !== 1 ? "s" : ""} received
            </p>
          </div>
        </div>

        {renderNominationCard()}
      </div>
    </div>
  );
}
