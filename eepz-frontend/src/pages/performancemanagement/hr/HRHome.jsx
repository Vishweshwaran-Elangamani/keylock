import React, { useState } from "react";
import { useNavigate } from "react-router-dom";


export default function HRHome() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);

  const cards = [
    {
      title: "Initiate Form",
      description: "Start a new performance review cycle.",
      icon: "bi-journal-plus",
      gradient: "gradient-primary",
      path: "/hr/dashboard/performance/formslist",
    },
    {
      title: "Create Form",
      description: "Design or edit performance review forms.",
      icon: "bi-ui-checks",
      gradient: "gradient-success",
      path: "/hr/dashboard/performance/create",
    },
    {
      title: "Drafts",
      description: "Resume work on your saved drafts.",
      icon: "bi-pencil-square",
      gradient: "gradient-warning",
      path: "/hr/dashboard/performance/draftlists",
    },
    {
      title: "Form Status",
      description: "Check review form submissions and status.",
      icon: "bi-file-earmark-text",
      gradient: "gradient-info",
      path: "/hr/dashboard/performance/status",
    },
    {
      title: "Progress Tracker",
      description: "Monitor performance management progress.",
      icon: "bi-bar-chart-steps",
      gradient: "gradient-blue",
      path: "/hr/dashboard/performance/progress",
    },
    {
      title: "Reward Setup",
      description: "Configure or update reward programs.",
      icon: "bi-award",
      gradient: "gradient-purple",
      path: "/hr/dashboard/performance/reward",
    },
    {
      title: "Nominations",
      description: "Nominate employees for performance awards.",
      icon: "bi-person-badge",
      gradient: "gradient-red",
      path: "/hr/dashboard/performance/nominations",
    },
  ];

  return (
    <div className="text-center mt-5">
      <h1 className="fw-bold">EEPZ Performance Management</h1>
      <div className="management-cards-grid mt-4">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`management-card-admin ${hoveredCard === index ? "hovered" : ""}`}
            onMouseEnter={() => setHoveredCard(index)}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => navigate(card.path)}
          >
            <div className={`card-icon-wrapper-admin ${card.gradient}`}>
              <i className={`bi ${card.icon}`}></i>
            </div>
            <div className="card-content-admin">
              <h3 className="card-title-admin">{card.title}</h3>
              <p className="card-description-admin">{card.description}</p>
            </div>
            <div className="card-arrow-admin">
              <i className="bi bi-arrow-right"></i>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
