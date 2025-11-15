import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/common/Dashboard.css";
const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);
  const handleNavigation = (path) => {
    navigate(path);
  };
  const cards = [
    {
      title: "Internal Opportunities",
      description: "View opportunities and nominate yourself or team members",
      icon: "bi-briefcase",
      gradient: "gradient-green",
      path: "/internal/opportunities",
    },
    {
      title: "Nomination Reviews",
      description: "Review and approve nominations from your team",
      icon: "bi-clipboard-check",
      gradient: "gradient-green",
      path: "/internal/nominations",
    },
    {
      title: "Career Progression",
      description: "Create and manage employee promotion proposals",
      icon: "bi bi-arrow-up-circle",
      gradient: "gradient-green",
      path: "/hr/operations/promotions",
    },
    {
      title: "Company Policies",
      description: "View organizational policies",
      icon: "bi bi-shield-check",
      gradient: "gradient-orange",
      path: "/manager/policies",
    },
    {
      title: "Performance",
      description: "Employee Performance Management",
      icon: "bi bi-graph-up",
      gradient: "gradient-blue",
      path: "/manager/dashboard/performance",
    },
    {
      title: "Goals",
      description: "Goal Management",
      icon: "bi bi-bullseye",
      gradient: "gradient-pink",
      path: "/manager/dashboard/goals",
    },
    {
      title: "Learning and Development",
      description: "Time For An Upgrade",
      icon: "bi bi-book",
      gradient: "gradient-pink",
      path: "/manager/lnd/dashboard",
    },
    {
      title: "Feedback Management",
      description: "Submit feedback",
      icon: "bi bi-chat-left-text",
      gradient: "gradient-teal",
      path: "/manager/dashboard/feedback",
    },
    {
      title: "SLA Management",
      description: "Manage Service Level Agreement",
      icon: "bi bi-file-earmark-check",
      gradient: "gradient-teal",
      path: "/manager/dashboard/sla",
    },
    {
     title: "Meeting & MOM Management",
     description: "Manage Meetings & MOMs",
     icon: "bi bi-book",
     gradient: "gradient-pink",
     path: "/manager/dashboard/meetmom",
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
export default ManagerDashboard;
