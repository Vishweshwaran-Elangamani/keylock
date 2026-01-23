import React from "react";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import "../../../styles/projectmanagement/components/Breadcrumb.css";

const Breadcrumb = ({ items = [] }) => {
  const navigate = useNavigate();

  return (
    <nav aria-label="breadcrumb" className="pm-bc">
      <ol className="pm-bc__list breadcrumb">
        <li className="pm-bc__item breadcrumb-item">
          <a
            href="#"
            className="pm-bc__link pm-bc__link--home"
            onClick={(e) => {
              e.preventDefault();
              navigate("/project-management/dashboard");
            }}
          >
            <Home size={18} className="pm-bc__home-icon" />
            Dashboard
          </a>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li
              key={index}
              className={`pm-bc__item breadcrumb-item ${
                isLast ? "active" : ""
              }`}
              aria-current={isLast ? "page" : undefined}
            >
              {isLast ? (
                <span className="pm-bc__current">{item.label}</span>
              ) : (
                <a
                  href="#"
                  className="pm-bc__link"
                  onClick={(e) => {
                    e.preventDefault();
                    if (item.path) navigate(item.path);
                  }}
                >
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
