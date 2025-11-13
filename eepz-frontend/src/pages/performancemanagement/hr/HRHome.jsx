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
      gradient: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
      path: "/hr/dashboard/performance/formslist",
    },
    {
      title: "Create Form",
      description: "Design or edit performance review forms.",
      icon: "bi-ui-checks",
      gradient: "linear-gradient(135deg, #00b09b 0%, #96c93d 100%)",
      path: "/hr/dashboard/performance/create",
    },
    {
      title: "Drafts",
      description: "Resume work on your saved drafts.",
      icon: "bi-pencil-square",
      gradient: "linear-gradient(135deg, #f7971e 0%, #ffd200 100%)",
      path: "/hr/dashboard/performance/draftlists",
    },
    {
      title: "Form Status",
      description: "Check review form submissions and status.",
      icon: "bi-file-earmark-text",
      gradient: "linear-gradient(135deg, #36d1dc 0%, #5b86e5 100%)",
      path: "/hr/dashboard/performance/status",
    },
    {
      title: "Progress Tracker",
      description: "Monitor performance management progress.",
      icon: "bi-bar-chart-steps",
      gradient: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
      path: "/hr/dashboard/performance/progress",
    },
    {
      title: "Reward Setup",
      description: "Configure or update reward programs.",
      icon: "bi-award",
      gradient: "linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)",
      path: "/hr/dashboard/performance/reward",
    },
    {
      title: "Nominations",
      description: "Nominate employees for performance awards.",
      icon: "bi-person-badge",
      gradient: "linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)",
      path: "/hr/dashboard/performance/nominations",
    },
  ];

  const cardStyle = (isHovered) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px",
    margin: "10px",
    borderRadius: "12px",
    backgroundColor: "#fff",
    boxShadow: isHovered
      ? "0 8px 20px rgba(0,0,0,0.2)"
      : "0 4px 10px rgba(0,0,0,0.1)",
    cursor: "pointer",
    transition: "all 0.3s ease",
  });

  const iconWrapperStyle = (gradient) => ({
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: gradient,
    color: "#fff",
    fontSize: "24px",
    flexShrink: 0,
  });

  const cardContentStyle = {
    flex: 1,
    textAlign: "left",
    marginLeft: "15px",
  };

  const cardTitleStyle = {
    margin: 0,
    fontSize: "18px",
    fontWeight: "bold",
  };

  const cardDescriptionStyle = {
    margin: "5px 0 0 0",
    fontSize: "14px",
    color: "#555",
  };

  const cardArrowStyle = {
    fontSize: "20px",
    color: "#888",
    marginLeft: "10px",
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1 style={{ fontWeight: "bold" }}>EEPZ Performance Management</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginTop: "30px",
          padding: "0 20px",
        }}
      >
        {cards.map((card, index) => (
          <div
            key={index}
            style={cardStyle(hoveredCard === index)}
            onMouseEnter={() => setHoveredCard(index)}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => navigate(card.path)}
          >
            <div style={iconWrapperStyle(card.gradient)}>
              <i className={`bi ${card.icon}`}></i>
            </div>
            <div style={cardContentStyle}>
              <h3 style={cardTitleStyle}>{card.title}</h3>
              <p style={cardDescriptionStyle}>{card.description}</p>
            </div>
            <div style={cardArrowStyle}>
              <i className="bi bi-arrow-right"></i>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
