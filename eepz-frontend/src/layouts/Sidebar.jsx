import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import icon from "../assets/icon.png";
import logodarkfull from "../assets/logodarkfull.png";
import logodarkbarred from "../assets/logodarkbarred.png";

const Sidebar = ({ allowedRoles = [], currentRole }) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const allMenuItems = {
    Admin: [
      { icon: "bi-speedometer2", label: "Dashboard", path: "/admin/dashboard" },
      { icon: "bi-people", label: "User Management", path: "/admin/users" },
      {
        icon: "bi-shield-lock",
        label: "Role Management",
        path: "/admin/roles",
      },
      { icon: "bi-building", label: "Departments", path: "/admin/departments" },
      {
        icon: "bi-clipboard-check",
        label: "Change Requests",
        path: "/admin/change-requests",
      },
    ],
    HR: [
      { icon: "bi-speedometer2", label: "Dashboard", path: "/hr/dashboard" },
      {
        icon: "bi-briefcase",
        label: "Internal Oppurtunities",
        path: "/internal/opportunities",
      },
      {
        icon: "bi-hand-thumbs-up",
        label: "Nominations",
        path: "/internal/nominations",
      },
      // { icon: "bi-arrow-up-circle", label: "Promotions", path: "/internal/promotions" },
      // { icon: "bi-bar-chart-line", label: "Career Progression", path: "/hr/operations/promotions" },
      {
        icon: "bi-book",
        label: "Learning & Development",
        path: "/hr/lnd/dashboard",
      },
      { icon: "bi-gear", label: "Operations", path: "/hr/operations/policies" },
      {
        icon: "bi-stack",
        label: "Project Management",
        path: "/hr/dashboard/projectmgmt",
      },
      {
        icon: "bi-graph-up",
        label: "Performance Management",
        path: "/hr/dashboard/performance",
      },
      {
        icon: "bi-file-earmark-check",
        label: "SLA Management",
        path: "/hr/dashboard/sla",
      },
      {
        icon: "bi-chat-left-text",
        label: "Feedback Management",
        path: "/hr/dashboard/feedback",
      },
      {
        icon: "bi-journal-bookmark",
        label: "Meethings & Mom",
        path: "/hr/dashboard/meetmom",
      },
    ],
    Leadership: [
      {
        icon: "bi-speedometer2",
        label: "Dashboard",
        path: "/leadership/dashboard",
      },
      {
        icon: "bi-shield-check",
        label: "Company Policies",
        path: "/leadership/policies",
      },
      {
        icon: "bi-bullseye",
        label: "Goals",
        path: "/leadership/dashboard/goals",
      },
      {
        icon: "bi-check2-square",
        label: "Goals Approvals",
        path: "/leadership/goals/approvals",
      },
      {
        icon: "bi-book",
        label: "Learning & Development",
        path: "/leadership/lnd/dashboard",
      },
    ],
    "Department Head": [
      {
        icon: "bi-speedometer2",
        label: "Dashboard",
        path: "/department-head/dashboard",
      },
      {
        icon: "bi-clipboard-check",
        label: "Nominations",
        path: "/internal/nominations",
      },
      {
        icon: "bi-pie-chart",
        label: "Budget Utilization",
        path: "/department-head/budget",
      },
      {
        icon: "bi-shield-check",
        label: "Company Policies",
        path: "/department-head/policies",
      },
      {
        icon: "bi bi-file-earmark-text",
        label: "Department Compliance",
        path: "/department-head/dashboard/sla/compliance",
      },
      {
        icon: "bi-graph-up",
        label: "Performance",
        path: "/department-head/dashboard/performance",
      },
      {
        icon: "bi bi-file-earmark-check",
        label: "SLA Management",
        path: "/department-head/dashboard/sla",
      },
      {
        icon: "bi-bullseye",
        label: "Goals",
        path: "/department-head/dashboard/goals",
      },
      {
        icon: "bi-check2-square",
        label: "Goals Approvals",
        path: "/manager/goals/approvals",
      },
      {
        icon: "bi-book",
        label: "Learning & Development",
        path: "/department-head/lnd/dashboard",
      },
      {
        icon: "bi-trophy",
        label: "Top Performers",
        path: "/department-head/dashboard/performance/top-performers",
      },
      {
        icon: "bi-chat-left-text",
        label: "Feedback Management",
        path: "/department-head/dashboard/feedback",
      },
    ],
    Manager: [
      {
        icon: "bi-speedometer2",
        label: "Dashboard",
        path: "/manager/dashboard",
      },
      {
        icon: "bi-briefcase",
        label: "Internal Opportiunities",
        path: "/internal/opportunities",
      },
      {
        icon: "bi-clipboard-check",
        label: "Nominations",
        path: "/internal/nominations",
      },
      // {
      //   icon: "bi-arrow-up-circle",
      //   label: "Career Progression",
      //   path: "/hr/operations/promotions",
      // },
      {
        icon: "bi-shield-check",
        label: "Company Policies",
        path: "/manager/policies",
      },
      {
        icon: "bi-graph-up",
        label: "Performance",
        path: "/manager/dashboard/performance",
      },
      { icon: "bi-bullseye", label: "Goals", path: "/manager/dashboard/goals" },
      {
        icon: "bi-check2-square",
        label: "Goals Approvals",
        path: "/manager/goals/approvals",
      },
      {
        icon: "bi-book",
        label: "Learning & Development",
        path: "/manager/lnd/dashboard",
      },
      {
        icon: "bi-chat-left-text",
        label: "Feedback Management",
        path: "/manager/dashboard/feedback",
      },
      {
        icon: "bi-file-earmark-check",
        label: "SLA Management",
        path: "/manager/dashboard/sla",
      },
      {
        icon: "bi-journal-bookmark",
        label: "Meethings & Mom",
        path: "/manager/dashboard/meetmom",
      },
    ],
    Employee: [
      {
        icon: "bi-speedometer2",
        label: "Dashboard",
        path: "/employee/dashboard",
      },
      {
        icon: "bi-briefcase",
        label: "Internal Opportiunities",
        path: "/internal/opportunities",
      },
      {
        icon: "bi-clipboard-check",
        label: "My Nominations",
        path: "/internal/nominations",
      },
      {
        icon: "bi-shield-check",
        label: "Company Policies",
        path: "/employee/policies",
      },

      {
        icon: "bi-building-check",
        label: "Employee Acknowledgement",
        path: "/employee/dashboard/employee-acknowledgments",
      },

      {
        icon: "bi-graph-up",
        label: "Performance",
        path: "/employee/dashboard/performance",
      },

      {
        icon: "bi-file-earmark-check",
        label: "SLA Compliance",
        path: "/employee/dashboard/sla",
      },
      {
        icon: "bi-bullseye",
        label: "Goals",
        path: "/employee/dashboard/goals",
      },
      {
        icon: "bi-check2-square",
        label: "Goals Approvals",
        path: "/employee/goals/approvals",
      },
      {
        icon: "bi-book",
        label: "Learning & Development",
        path: "/employee/lnd/dashboard",
      },
      {
        icon: "bi-chat-left-text",
        label: "Feedback Mangement",
        path: "/employee/dashboard/feedback",
      },
      {
        icon: "bi-journal-bookmark",
        label: "Meethings & Mom",
        path: "/employee/dashboard/meetmom",
      },
    ],
  };
  // Get menu items based on current role from allowed roles
  const getMenuItems = () => {
    if (allowedRoles.length === 0) {
      return allMenuItems[currentRole] || [];
    }
    // If current role is in allowed roles, use it
    if (allowedRoles.includes(currentRole)) {
      return allMenuItems[currentRole] || [];
    }
    // Otherwise, use the first allowed role
    return allMenuItems[allowedRoles[0]] || [];
  };
  const menuItems = getMenuItems();
  const isActive = (path) => {
    return location.pathname === path;
  };
  return (
    <aside
      style={{
        width: sidebarExpanded ? "260px" : "80px",
        transition: "width 0.3s ease-in-out",
        height: "100vh",
        background: "#27235c",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        position: "relative",
      }}
    >
      {/* Logo Section */}
      <div
        style={{
          padding: "1.5rem 1.25rem",
          borderBottom: "1px solid rgba(0, 0, 0, 1)",
          background: "rgba(255, 255, 255, 1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          maxHeight: "100px",
        }}
      >
        <img
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          src={sidebarExpanded ? logodarkbarred : icon}
          alt="EEPZ Logo"
          style={{
            width: sidebarExpanded ? "180px" : "50px",
            height: sidebarExpanded ? "auto" : "50px",
            maxHeight: "30px",
            objectFit: "contain",
            cursor: "pointer",
            transition: "all 0.3s ease-in-out",
          }}
        />
      </div>

      {/* Navigation Menu */}
      <nav
        style={{
          flexGrow: 1,
          padding: "1rem 0.75rem",
          overflowY: "auto",
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {menuItems.map((item, index) => {
            const active = isActive(item.path);
            return (
              <li key={index} style={{ marginBottom: "0.375rem" }}>
                <button
                  onClick={() => navigate(item.path)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.875rem",
                    padding: "0.875rem 1rem",
                    textDecoration: "none",
                    color: active ? "#FFFFFF" : "rgba(255, 255, 255, 0.65)",
                    background: active
                      ? "linear-gradient(90deg, rgba(172, 80, 152, 0.25) 0%, rgba(151, 36, 126, 0.15) 100%)"
                      : "transparent",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: active ? 600 : 400,
                    fontSize: "0.9375rem",
                    transition: "all 0.2s ease",
                    position: "relative",
                    overflow: "hidden",
                    justifyContent: sidebarExpanded ? "flex-start" : "center",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background =
                        "rgba(255, 255, 255, 0.05)";
                      e.currentTarget.style.color = "#FFFFFF";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "rgba(255, 255, 255, 0.65)";
                    }
                  }}
                  title={sidebarExpanded ? "" : item.label}
                >
                  {active && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: "4px",
                        background:
                          "linear-gradient(180deg, #AC5098 0%, #97247E 100%)",
                        borderRadius: "0 4px 4px 0",
                      }}
                    />
                  )}
                  <i
                    className={`bi ${item.icon}`}
                    style={{
                      fontSize: "20px",
                      color: active ? "#AC5098" : "rgba(255, 255, 255, 0.65)",
                      transition: "color 0.2s ease",
                      flexShrink: 0,
                    }}
                  ></i>
                  {sidebarExpanded && <span>{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};
export default Sidebar;
