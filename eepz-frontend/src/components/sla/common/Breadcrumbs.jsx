import React, { useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Home } from "lucide-react";

const Breadcrumb = ({ items, dynamicLabels = {} }) => {
  const navigate = useNavigate();
  const params = useParams();
  useLocation();

  const [homeHover, setHomeHover] = useState(false);

  const accent = "var(--color-accent-1)";

  const css = useMemo(
    () => `
    
      .sla-bc-scope .sla-home-container {
        position: relative;
        z-index: 2;
       bottom: -3px;

      }

      .sla-bc-scope .sla-home-container:hover::before {
        content: '';
        position: absolute;
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        background: rgba(151, 36, 126, 0.08);
        border-radius: 8px;
        z-index: -1;
        animation: sla-icon-hover 0.15s ease-out;
      }
      @keyframes sla-icon-hover {
        0% { transform: scale(0.9); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
      
    
      .sla-bc-scope .sla-breadcrumb-link {
        position: relative;
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.5rem;
        border-radius: 6px;
        transition: background-color 0.2s ease;
        color: ${accent} !important;
        text-decoration: none !important;
        font-weight: 500;
         font-size: 1rem; 
      }

      
.sla-bc-scope .breadcrumb-item.active span {
  font-size: 1rem;
  font-weight: 600;
}


      .sla-bc-scope .sla-breadcrumb-link:hover {
        background: rgba(151, 36, 126, 0.08) !important;
        color: ${accent} !important;
      }
      
      .sla-bc-scope .sla-home-link,
      .sla-bc-scope .sla-home-link:hover,
      .sla-bc-scope .sla-home-link:focus {
        color: ${accent} !important;
        text-decoration: none !important;
      }
      .sla-bc-scope .sla-home-link:hover svg {
        stroke: ${accent} !important;
      }
      .sla-bc-scope a,
      .sla-bc-scope a:link,
      .sla-bc-scope a:visited,
      .sla-bc-scope a:focus,
      .sla-bc-scope a:active {
        color: ${accent} !important;
        text-decoration: none !important;
      }
      .sla-bc-scope a:focus {
        outline: none !important;
        box-shadow: none !important;
      }
    `,
    [accent]
  );

  const resolveDynamicLabel = (item) => {
    if (item.param && params[item.param]) {
      if (dynamicLabels[item.param]) return dynamicLabels[item.param];
      return `SLA #${params[item.param]}`;
    }
    return item.label;
  };

  return (
    <nav aria-label="breadcrumb" className="mb-3 sla-bc-scope">
      <style>{css}</style>

      <ol
        className="breadcrumb mb-0 p-3 rounded"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          fontSize: "0.875rem",
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
        }}
      >
        <li className="breadcrumb-item d-flex align-items-center">
          <div className="sla-home-container">
            <a
              href="#"
              className="sla-home-link"
              onClick={(e) => {
                e.preventDefault();
                navigate("/dashboard");
              }}
              onMouseEnter={() => setHomeHover(true)}
              onMouseLeave={() => setHomeHover(false)}
              style={{
                color: accent,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
              aria-label="Dashboard"
              title="Dashboard"
            >
              <Home size={18} color={accent} />
            </a>
          </div>
        </li>

       {items?.length > 0 && <span style={{ color: "#97247e", userSelect: "none" }}>/ </span>}


        {items.map((item, index) => {
          const resolvedLabel = resolveDynamicLabel(item);
          const isLast = index === items.length - 1;

          return (
            <React.Fragment key={index}>
              <li
                className={`breadcrumb-item ${isLast ? "active" : ""}`}
                aria-current={isLast ? "page" : undefined}
              >
                {isLast ? (
                  <span style={{ color: "#000", fontWeight: 500 }}>{resolvedLabel}</span>
                ) : (
                  <a
                    href="#"
                    className="sla-breadcrumb-link"
                    onClick={(e) => {
                      e.preventDefault();
                      if (item.path) navigate(item.path);
                    }}
                  >
                    {resolvedLabel}
                  </a>
                )}
              </li>

{!isLast && <span style={{ color: "#97247e", userSelect: "none" }}>/</span>}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
