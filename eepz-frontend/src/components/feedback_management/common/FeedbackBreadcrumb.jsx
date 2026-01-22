import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import "../../../styles/feedback/components/FeedbackBreadcrumb.css";

const FeedbackBreadcrumb = ({ items = [] }) => {
  const navigate = useNavigate();
  const [homeHover, setHomeHover] = useState(false);

  const getHomeRoute = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const roleRoutes = {
        Employee: "/employee/dashboard",
        Manager: "/manager/dashboard",
        DepartmentHead: "/depthead/dashboard",
        HR: "/hr/dashboard",
      };
      return roleRoutes[user.roleName] || "/dashboard";
    } catch {
      return "/dashboard";
    }
  };

  return (
    <nav aria-label="breadcrumb" className="fb-breadcrumb">
      <ol className="fb-breadcrumb-list">
        <li className="fb-breadcrumb-item">
          <a
            href="#"
            className={`fb-breadcrumb-home-link ${homeHover ? "is-hover" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(getHomeRoute());
            }}
            onMouseEnter={() => setHomeHover(true)}
            onMouseLeave={() => setHomeHover(false)}
            aria-label="Home"
            title="Home"
          >
            <Home size={18} className="fb-breadcrumb-home-icon" />
          </a>

          <span className="fb-breadcrumb-slash">/</span>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li
              key={index}
              className="fb-breadcrumb-item"
              aria-current={isLast ? "page" : undefined}
            >
              {item.path && !isLast ? (
                <a
                  href="#"
                  className="fb-breadcrumb-link"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.path);
                  }}
                >
                  {item.label}
                </a>
              ) : (
                <span className="fb-breadcrumb-current">{item.label}</span>
              )}

              {!isLast && <span className="fb-breadcrumb-slash">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default FeedbackBreadcrumb;
