import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Confetti from "react-confetti";
import { getEmployeeNominations } from "../../../services/performancemanagement/api/nominationapi";
import "react-toastify/dist/ReactToastify.css";
import "../../../styles/performancemanagement/employee/EmployeeHome.css";

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
        
        // Set the first nomination as selected by default
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

  // Handle nomination card click from navbar
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
      <div
        className="ehp-nomination-card"
        style={{
          marginTop: -200,
          background: "#1e3c72",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        <div className="ehp-nomination-content d-flex align-items-center">
          <span
            className="badge text-dark me-3 position-relative"
            style={{ fontSize: "6.5rem" }}
          >
            <i className="bi bi-award-fill" style={{ color: "#FFD700" }}></i>
            <i
              className="bi bi-star-fill position-absolute top-50 start-50"
              style={{
                color: "white",
                fontSize: "2.5rem",
                transform: "translate(-50%, -75%)",
              }}
            ></i>
          </span>

          <div style={{ paddingLeft: "40px" }}>
            <h3 className="ehp-nomination-title">Congratulations!</h3>
            <p className="ehp-nomination-text">
              You have been nominated for:{" "}
              <strong style={{ textDecoration: "none" }}>
                {selectedNomination.roleType}
              </strong>
            </p>
            <p className="ehp-nomination-subtext" style={{ fontSize: "15px" }}>
              Your hard work and dedication have been recognized!
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (loadingNominations) {
    return (
      <div className="ehp-loading-container">
        <div className="ehp-loading-content">
          <div className="spinner-border" />
          <p className="ehp-loading-text">Loading nominations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ehp-page">
      <ToastContainer />

      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.7}
        />
      )}

      <div className="ehp-container" style={{ padding: 24 }}>
        {renderNominationCard()}

       
      </div>
    </div>
  );
}
