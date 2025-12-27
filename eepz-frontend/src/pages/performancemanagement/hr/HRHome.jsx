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
      accent: "#7C3AED",
      chipBg: "#F3E8FF",
      path: "/hr/dashboard/performance/formslist"
    },
    {
      title: "Create Form",
      description: "Design or edit performance review forms.",
      icon: "bi-ui-checks",
      accent: "#10B981",
      chipBg: "#ECFDF5",
      path: "/hr/dashboard/performance/create"
    },
    {
      title: "Form Details",
      description: "Check review form submissions and status.",
      icon: "bi-file-earmark-text",
      accent: "#36D1DC",
      chipBg: "#E6F4FA",
      path: "/hr/dashboard/performance/status"
    },
    {
      title: "Progress Tracker",
      description: "Monitor performance management progress.",
      icon: "bi-bar-chart-steps",
      accent: "#3B82F6",
      chipBg: "#EEF2FF",
      path: "/hr/dashboard/performance/progress"
    },
    {
      title: "Reward Setup",
      description: "Configure or update reward programs.",
      icon: "bi-award",
      accent: "#8E2DE2",
      chipBg: "#F4F1FB",
      path: "/hr/dashboard/performance/reward"
    },
    {
      title: "Nominations",
      description: "Nominate employees for performance awards.",
      icon: "bi-person-badge",
      accent: "#FF416C",
      chipBg: "#FFF3F8",
      path: "/hr/dashboard/performance/nominations"
    }
  ];

  return (
    <div className="eepz-hrhome-bg">
      <div className="eepz-hrhome-container">
        <h1 className="eepz-hrhome-title">Performance &amp; Nomination Management</h1>
        <p className="eepz-hrhome-subtitle">
          Initiate , Review , Track the form and nominations
        </p>

        <div className="eepz-hrhome-card-grid">
          {cards.map((card, idx) => (
            <div
              key={card.title}
              className={`eepz-hrhome-card${hoveredCard === idx ? " hovered" : ""}`}
              onMouseEnter={() => setHoveredCard(idx)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => navigate(card.path)}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(card.path);
                }
              }}
            >
              <div className="hrhome-card-header">
                <div
                  className="hrhome-icon-chip"
                  style={{ background: card.chipBg, color: card.accent }}
                >
                  <i className={`bi ${card.icon}`} />
                </div>

                <div className="hrhome-title-desc">
                  <div className="hrhome-card-title">{card.title}</div>
                  <div className="hrhome-card-desc">{card.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
.eepz-hrhome-bg {
  min-height: 100vh;
  background: #F7F8FC;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
.eepz-hrhome-container {
  width: 100%;
  max-width: 1400px;
  margin: 28px auto 48px auto;
  padding: 0 20px;
}
.eepz-hrhome-title {
  font-size: 2rem;
  font-weight: 800;
  color: #1F2354;
  text-align: center;
  margin: 0;
}
.eepz-hrhome-subtitle {
  color: #6B7280;
  font-size: 0.95rem;
  text-align: center;
  margin: 8px 0 18px 0;
}
.eepz-hrhome-card-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px 18px;
}
@media (max-width: 1200px) {
  .eepz-hrhome-card-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 680px) {
  .eepz-hrhome-card-grid { grid-template-columns: 1fr; }
}
.eepz-hrhome-card {
  background: #FFFFFF;
  border: 1px solid black; /* Updated to match the image */
  border-radius: 16px;
  padding: 16px 18px;
  cursor: pointer;
  transition: box-shadow 0.18s ease, transform 0.18s ease, border-color 0.18s ease;
  box-shadow: 0 1px 1px rgba(17, 24, 39, 0.03);
}

.eepz-hrhome-card:hover,
.eepz-hrhome-card.hovered,
.eepz-hrhome-card:focus-visible {
  transform: translateY(-2px);
  border-color: #94A3B8; /* Slightly darker slate tone for hover */
  box-shadow: 0 6px 16px rgba(17, 24, 39, 0.08);
}

.hrhome-card-header {
  display: flex;
  align-items: center;
  gap: 14px;
}
.hrhome-icon-chip {
  height: 42px;
  width: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}
.hrhome-title-desc {
  display: flex;
  flex-direction: column;
}
.hrhome-card-title {
  font-size: 0.98rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}
.hrhome-card-desc {
  color: #6B7280;
  font-size: 0.88rem;
  font-weight: 500;
  line-height: 1.35;
  white-space: normal;
}
      `}</style>
    </div>
  );
}
