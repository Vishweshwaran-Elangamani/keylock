import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function HRHome() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);

  const cards = [
    {
      title: "Initiate Form",
      description: "Start a new performance review cycle.",
      icon: "bi-journal-plus",
      color: "#3B82F6",
      bg: "#F0F6FD",
      path: "/hr/dashboard/performance/formslist"
    },
    {
      title: "Create Form",
      description: "Design or edit performance review forms.",
      icon: "bi-ui-checks",
      color: "#10B981",
      bg: "#EBFAF4",
      path: "/hr/dashboard/performance/create"
    },
    {
      title: "Form Status",
      description: "Check review form submissions and status.",
      icon: "bi-file-earmark-text",
      color: "#36d1dc",
      bg: "#e6f4fa",
      path: "/hr/dashboard/performance/status"
    },
    {
      title: "Progress Tracker",
      description: "Monitor performance management progress.",
      icon: "bi-bar-chart-steps",
      color: "#1e3c72",
      bg: "#edeffd",
      path: "/hr/dashboard/performance/progress"
    },
    {
      title: "Reward Setup",
      description: "Configure or update reward programs.",
      icon: "bi-award",
      color: "#8e2de2",
      bg: "#f4f1fb",
      path: "/hr/dashboard/performance/reward"
    },
    {
      title: "Nominations",
      description: "Nominate employees for performance awards.",
      icon: "bi-person-badge",
      color: "#ff416c",
      bg: "#fff3f8",
      path: "/hr/dashboard/performance/nominations"
    }
  ];

  return (
    <div className="eepz-hrhome-bg">
      <div className="eepz-hrhome-container">
        
        <div className="eepz-hrhome-card-grid">
          {cards.map((card, idx) => (
            <div
              key={card.title}
              className={`eepz-hrhome-card${hoveredCard === idx ? " hovered" : ""}`}
              style={{
                borderColor: hoveredCard === idx ? "#ac5098" : "#eee",
                transition: "border-color 0.2s, box-shadow 0.18s, transform 0.18s"
              }}
              onMouseEnter={() => setHoveredCard(idx)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => navigate(card.path)}
              tabIndex={0}
              role="button"
            >
              <div
                className="hrhome-icon"
                style={{
                  background: card.bg,
                  color: card.color
                }}
              >
                <i className={`bi ${card.icon}`} />
              </div>
              <div className="hrhome-card-content">
                <h3 className="hrhome-card-title">{card.title}</h3>
                <p className="hrhome-card-desc">{card.description}</p>
              </div>
              <div className="hrhome-card-arrow">
                <i className="bi bi-arrow-right" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Inline style for self-containment, you can move to a CSS file. */}
      <style>{`
.eepz-hrhome-bg {
  min-height: 100vh;
  background: #faf9fc;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
.eepz-hrhome-container {
  width: 100%;
  max-width: 1450px;
  margin: 38px auto 0 auto;
  padding: 0 18px 50px 18px;
}
.eepz-hrhome-title {
  font-size: 1.7rem;
  font-weight: 800;
  color: #2c1345;
  margin-bottom: 28px;
  letter-spacing: 0.5px;
  text-align: left;
}
.eepz-hrhome-card-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 34px 36px;
  justify-items: stretch;
}
.eepz-hrhome-card {
  background: #fff;
  border: 2px solid #eee;
  border-radius: 18px;
  height: 170px;
  min-width: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  align-items: flex-start;
  cursor: pointer;
  transition: box-shadow 0.18s, border 0.2s, transform 0.18s;
  padding: 28px 20px 22px 20px;
  box-shadow: 0 2px 10px rgba(40,37,92,0.05);
  outline: none;
}
.eepz-hrhome-card.hovered,
.eepz-hrhome-card:focus {
  border-color: #ac5098;
  box-shadow: 0 6px 32px rgba(51,18,82,0.09), 0 2px 6px rgba(39,35,92,0.08);
  transform: translateY(-1px) scale(1.018);
}
.hrhome-icon {
  height: 48px;
  width: 48px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin-bottom: 13px;
  box-shadow: 0 1px 3px rgba(39, 35, 92, 0.03);
}
.hrhome-card-content {
  flex: 1;
}
.hrhome-card-title {
  font-size: 1.13rem;
  font-weight: 700;
  color: #252657;
  margin: 0 0 4px 0;
  letter-spacing: 0.006em;
}
.hrhome-card-desc {
  color: #666a87;
  font-size: 0.97rem;
  font-weight: 500;
  margin: 0;
  letter-spacing: 0.001em;
}
.hrhome-card-arrow {
  position: absolute;
  bottom: 16px;
  right: 20px;
  color: #ac5098;
  font-size: 1.18rem;
  transition: transform 0.15s;
}
.eepz-hrhome-card:hover .hrhome-card-arrow,
.eepz-hrhome-card:focus .hrhome-card-arrow {
  transform: translateX(4px) scale(1.12);
  color: #7c2562;
}
@media (max-width: 1200px) {
  .eepz-hrhome-card-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 700px) {
  .eepz-hrhome-card-grid { grid-template-columns: 1fr; }
  .eepz-hrhome-card { min-width: 0; width: 99vw; height: auto; }
}
      `}</style>
    </div>
  );
}
