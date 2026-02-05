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
      description: "Fill out your performance or goal form.",
      icon: "bi-journal-plus",
      color: "#3B82F6",
      bg: "#F0F6FD",
      path: "/manager/dashboard/performance/submitform",
    },
    {
      title: "Manager Nomination",
      description: "Nominate employees for rewards.",
      icon: "bi-ui-checks",
      color: "#10B981",
      bg: "#EBFAF4",
      path: "/manager/dashboard/performance/nomination",
    },
    {
      title: "Performance review",
      description: "Acknowledge and rate employee's appraisal.",
      icon: "bi-pencil-square",
      color: "#F59E0B",
      bg: "#FFF7E6",
      path: "/manager/dashboard/performance/teamlead",
    },
    {
      title: "Manager Acknowledgement",
      description: " Confirm the employee’s final rating.",
      icon: "bi-person-check",
      color: "#A855F7",
      bg: "#F6F1FD",
      path: "/manager/dashboard/manager-acknowledgments",
    },
    {
      title: "My Acknowledgement",
      description: "Confirm your appraisal rating.",
      icon: "bi-person-badge",
      color: "#0EA5E9",
      bg: "#ECF7FB",
      path: "/manager/dashboard/employee-acknowledgments",
    },
  ];


  return (
    <div className="managerperfromancehome-container">
      <header className="managerperfromancehome-header">
        <h1 className="managerperfromancehome-main-title">
          Performance Management
        </h1>
      </header>
      <div className="managerperfromancehome-cards-grid">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`managerperfromancehome-card-admin ${
              hoveredCard === index ? "hovered" : ""
            }`}
            onMouseEnter={(e) => {
              setHoveredCard(index);
              e.currentTarget.style.borderColor = card.color;
            }}
            onMouseLeave={(e) => {
              setHoveredCard(null);
              e.currentTarget.style.borderColor = "#27235c";
            }}
            onClick={() => navigate(card.path)}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate(card.path);
              }
            }}
            aria-label={`Navigate to ${card.title}: ${card.description}`}
          >
            <div className="managerperfromancehome-card-header">
              <div
                className="managerperfromancehome-card-icon"
                style={{
                  background: card.bg,
                  color: card.color,
                  border: `1.5px solid ${card.color}30`,
                }}
              >
                <i className={`bi ${card.icon}`}></i>
              </div>
              <div className="managerperfromancehome-card-content">
                <h3 className="managerperfromancehome-card-title">
                  {card.title}
                </h3>
                <p className="managerperfromancehome-card-description">
                  {card.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
