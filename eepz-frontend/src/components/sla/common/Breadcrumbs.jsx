import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Home } from "lucide-react";
import "../../../styles/sla/components/Breadcrumbs.css";

const Breadcrumb = ({ items = [], dynamicLabels = {} }) => {
  const navigate = useNavigate();
  const params = useParams();

  const resolveDynamicLabel = (item) => {
    if (item.param && params[item.param]) {
      if (dynamicLabels[item.param]) return dynamicLabels[item.param];
      return `SLA #${params[item.param]}`;
    }
    return item.label;
  };

  return (
    <nav aria-label="breadcrumb" className="sla-bc-scope sla-bc-nav">
      <ol className="sla-bc-ol">
        <li className="sla-bc-item">
          <div className="sla-home-container">
            <a
              href="#"
              className="sla-home-link"
              onClick={(e) => {
                e.preventDefault();
                navigate("/dashboard");
              }}
              aria-label="Dashboard"
              title="Dashboard"
            >
              <Home size={18} className="sla-home-icon" />
            </a>
          </div>
        </li>

        {items?.length > 0 && <span className="sla-bc-separator">/</span>}

        {items.map((item, index) => {
          const resolvedLabel = resolveDynamicLabel(item);
          const isLast = index === items.length - 1;

          return (
            <React.Fragment key={index}>
              <li
                className={`sla-bc-item ${isLast ? "sla-bc-active" : ""}`}
                aria-current={isLast ? "page" : undefined}
              >
                {isLast ? (
                  <span className="sla-bc-active-text">{resolvedLabel}</span>
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

              {!isLast && <span className="sla-bc-separator">/</span>}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
