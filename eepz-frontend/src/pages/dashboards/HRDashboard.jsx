import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/common/Dashboard.css";
const HRDashboard = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const handleNavigation = (path) => {
    navigate(path);
  };
  const cards = [
    {
      title: "Internal Opportunities",
      description: "Create and manage internal job opportunities",
      icon: "bi-briefcase",
      gradient: "gradient-green",
      path: "/internal/opportunities",
    },
    {
      title: "Nominations",
      description: "View and manage employee nominations",
      icon: "bi-hand-thumbs-up",
      gradient: "gradient-green",
      path: "/internal/nominations",
    },
    {
      title: "Promotions",
      description: "Create and track employee promotions",
      icon: "bi-arrow-up-circle",
      gradient: "gradient-green",
      path: "/internal/promotions",
    },
    {
      title: "Career Progression",
      description: "Update salary details and submit promotions to Leadership",
      icon: "bi bi-bar-chart-line",
      gradient: "gradient-green",
      path: "/hr/operations/promotions",
    },
    {
      title: "HR Operations",
      description: "Manage HR daily operations",
      icon: "bi bi-gear",
      gradient: "gradient-blue",
      path: "/hr/operations/policies",
    },
    {
      title: "Project Management",
      description: "Assign Employees to project",
      icon: "bi bi-stack",
      gradient: "gradient-blue",
      path: "/hr/dashboard/projectmgmt",
    },
    {
      title: "Performance Management",
      description: "Manage Performance of Employees",
      icon: "bi bi-graph-up",
      gradient: "gradient-blue",
      path: "/hr/dashboard/performance",
    },
    {
      title: "SLA Management",
      description: "Manage Service Level Agreement",
      icon: "bi bi-file-earmark-check",
      gradient: "gradient-teal",
      path: "/hr/dashboard/sla",
    },
    {
      title: "Feedback Management",
      description: "Manage Feedback Forms",
      icon: "bi bi-chat-left-text",
      gradient: "gradient-teal",
      path: "/hr/dashboard/feedback",
    }
  ];
  return (
    <div className="dashboard-container">
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
  );
};
export default HRDashboard;
