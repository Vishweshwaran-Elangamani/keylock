import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import styles from "../../../styles/performancemanagement/hr/HRHome.module.css";


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
      path: "/hr/dashboard/performance/formslist",
    },
    {
      title: "Create Form",
      description: "Design or edit performance review forms.",
      icon: "bi-ui-checks",
      accent: "#10B981",
      chipBg: "#ECFDF5",
      path: "/hr/dashboard/performance/create",
    },
    {
      title: "Form Details",
      description: "Check review form submissions and status.",
      icon: "bi-file-earmark-text",
      accent: "#36D1DC",
      chipBg: "#E6F4FA",
      path: "/hr/dashboard/performance/status",
    },
    {
      title: "Progress Tracker",
      description: "Monitor performance management progress.",
      icon: "bi-bar-chart-steps",
      accent: "#3B82F6",
      chipBg: "#EEF2FF",
      path: "/hr/dashboard/performance/progress",
    },
    {
      title: "Reward Setup",
      description: "Configure or update reward programs.",
      icon: "bi-award",
      accent: "#8E2DE2",
      chipBg: "#F4F1FB",
      path: "/hr/dashboard/performance/reward",
    },
    {
      title: "Nominations",
      description: "Nominate employees for performance awards.",
      icon: "bi-person-badge",
      accent: "#FF416C",
      chipBg: "#FFF3F8",
      path: "/hr/dashboard/performance/nominations",
    },
  ];


  return (
    <div className={styles.hrHomeBackground}>
      <div className={styles.hrHomeContainer}>
        {/* Page Title */}
        <h1 className={styles.hrHomePageTitle}>
          Performance &amp; Nomination Management
        </h1>
        <p className={styles.hrHomeSubtitle}>
          Initiate, Review, Track the form and nominations
        </p>


        <div className={styles.hrHomeCardGrid}>
          {cards.map((card, idx) => (
            <div
              key={card.title}
              className={`${styles.hrHomeCard} ${
                hoveredCard === idx ? styles.hrHomeCardHovered : ""
              }`}
              onMouseEnter={(e) => {
                setHoveredCard(idx);
                e.currentTarget.style.borderColor = card.accent;
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
              <div className={styles.hrHomeCardHeader}>
                <div
                  className={styles.hrHomeIconChip}
                  style={{ 
                    background: card.chipBg, 
                    color: card.accent,
                    border: `2px solid ${card.accent}30`
                  }}
                >
                  <i className={`bi ${card.icon}`} />
                </div>


                <div className={styles.hrHomeTitleDesc}>
                  <div className={styles.hrHomeCardTitle}>{card.title}</div>
                  <div className={styles.hrHomeCardDescription}>
                    {card.description}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
