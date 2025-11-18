import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../../../styles/performancemanagement/manager/PerformanceManagerHome.css";

export default function PerformanceManagerHome() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);

  const cards = [
    {
      title: "Submit Form for Manager",
      description: "Start a new performance review cycle.",
      icon: "bi-journal-plus",
      color: "#3B82F6",
      bg: "#F0F6FD",
      path: "/manager/dashboard/performance/submitform",
    },
    {
      title: "Manager Nomination",
      description: "Design or edit performance review forms.",
      icon: "bi-ui-checks",
      color: "#10B981",
      bg: "#EBFAF4",
      path: "/manager/dashboard/performance/nomination",
    },
    {
      title: "Performance review",
      description: "Resume work on your saved drafts.",
      icon: "bi-pencil-square",
      color: "#F59E0B",
      bg: "#FFF7E6",
      path: "/manager/dashboard/performance/teamlead",
    },
    {
      title: "Manager Acknowledgement",
      description: "Resume work on your saved drafts.",
      icon: "bi-person-check",
      color: "#A855F7",
      bg: "#F6F1FD",
      path: "/manager/dashboard/manager-acknowledgments",
    },
    {
      title: "Employee Acknowledgement",
      description: "Resume work on your saved drafts.",
      icon: "bi-person-badge",
      color: "#0EA5E9",
      bg: "#ECF7FB",
      path: "/manager/dashboard/employee-acknowledgments",
    },
  ];

  return (
    <div className="managerperfromancehome-container">
      <h1 className="managerperfromancehome-main-title">
        EEPZ Performance Management - Manager
      </h1>
      <div className="managerperfromancehome-cards-grid">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`managerperfromancehome-card-admin ${hoveredCard === index ? "hovered" : ""}`}
            onMouseEnter={() => setHoveredCard(index)}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => navigate(card.path)}
            style={{
              borderColor: card.color,
            }}
            tabIndex={0}
          >
            <div
              className="managerperfromancehome-card-icon"
              style={{
                background: card.bg,
                color: card.color,
              }}
            >
              <i className={`bi ${card.icon}`}></i>
            </div>
            <div className="managerperfromancehome-card-content">
              <h3 className="managerperfromancehome-card-title">{card.title}</h3>
              <p className="managerperfromancehome-card-description">{card.description}</p>
            </div>
            <div className="managerperfromancehome-card-arrow">
              <i className="bi bi-arrow-right"></i>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
