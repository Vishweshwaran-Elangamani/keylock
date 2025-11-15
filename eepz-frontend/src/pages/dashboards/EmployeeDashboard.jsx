import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/common/Dashboard.css";
const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);
  const handleNavigation = (path) => {
    navigate(path);
  };
  const cards = [
    {
      title: "Internal Opportunities",
      description: "View and apply for internal job openings",
      icon: "bi-briefcase",
      gradient: "gradient-green",
      path: "/internal/opportunities",
    },
    {
      title: "My Nominations",
      description: "Track your nominations and status",
      icon: "bi-hand-thumbs-up",
      gradient: "gradient-green",
      path: "/internal/nominations",
    },
    {
      title: "Company Policies",
      description: "View organizational policies",
      icon: "bi bi-shield-check",
      gradient: "gradient-orange",
      path: "/employee/policies",
    },
    {
      title: "Employee Acknowledgement",
      description: "Performance Management",
      icon: "bi bi-building-check",
      gradient: "gradient-orange",
      path: "/employee/dashboard/employee-acknowledgments",
    },

    {
      title: "Performance",
      description: "Performance Management",
      icon: "bi bi-graph-up",
      gradient: "gradient-blue",
      path: "/employee/dashboard/performance",
    },
    {
      title: "SLA Compliance",
      description: "Service Level Agreement",
      icon: "bi bi-file-earmark-check",
      gradient: "gradient-teal",
      path: "/employee/dashboard/sla",
    },
    {
      title: "Goals",
      description: "Goal Management",
      icon: "bi bi-bullseye",
      gradient: "gradient-pink",
      path: "/employee/dashboard/goals",
    },
    {
      title: "Learning and Development",
      description: "Time For An Upgrade",
      icon: "bi bi-book",
      gradient: "gradient-pink",
      path: "/employee/lnd/dashboard",
    },
    {
      title: "Feedback Management",
      description: "Submit Feedback Forms",
      icon: "bi bi-chat-left-text",
      gradient: "gradient-teal",
      path: "/employee/dashboard/feedback",
    }
  ];
  return (
    <div className="dashboard-container">
      {/* Main Content Grid */}
      <div className="main-content-grid">
        {/* Left Column - Management Cards */}
        <div className="left-column">
          <div className="section-header"></div>
          <div className="management-cards-grid">
            {cards.map((card, index) => (
              <div
                key={index}
                className={`management-card ${hoveredCard === index ? "hovered" : ""
                  }`}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleNavigation(card.path)}
              >
                <div className={`card-icon-wrapper ${card.gradient}`}>
                  <i className={`bi ${card.icon}`}></i>
                </div>
                <div className="card-content">
                  <h3 className="card-title">{card.title}</h3>
                  <p className="card-description">{card.description}</p>
                </div>
                <div className="card-arrow">
                  <i className="bi bi-arrow-right"></i>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default EmployeeDashboard;
