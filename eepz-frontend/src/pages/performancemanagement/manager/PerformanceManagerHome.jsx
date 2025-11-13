import React, { useState } from "react";
import { useNavigate } from "react-router-dom";


export default function PerformanceManagerHome() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);

  const cards = [
    {
      title: "Submit Form for Manager",
      description: "Start a new performance review cycle.",
      icon: "bi-journal-plus",
      gradient: "gradient-primary",
      path: "/manager/dashboard/performance/submitform",
    },
    {
      title: "Manager Nomination",
      description: "Design or edit performance review forms.",
      icon: "bi-ui-checks",
      gradient: "gradient-success",
      path: "/manager/dashboard/performance/nomination",
    },
    {
      title: "Performance review ",
      description: "Resume work on your saved drafts.",
      icon: "bi-pencil-square",
      gradient: "gradient-warning",
      path: "/manager/dashboard/performance/teamlead",
    },{
      title: "Manager Acknowledgement",
      description: "Resume work on your saved drafts.",
      icon: "bi-pencil-square",
      gradient: "gradient-warning",
      path: "/manager/dashboard/manager-acknowledgments",
    },{
      title: "Employee Acknowledgement",
      description: "Resume work on your saved drafts.",
      icon: "bi-pencil-square",
      gradient: "gradient-warning",
      path: "/manager/dashboard/employee-acknowledgments",
    }
    
    
  ];

  return (
    <div className="text-center mt-5">
      <h1 className="fw-bold">EEPZ Performance Management - Manager</h1>
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
