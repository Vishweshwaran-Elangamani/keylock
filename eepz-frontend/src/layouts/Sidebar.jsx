import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import icon from "../assets/icon.png";
import logodarkbarred from "../assets/logodarkbarred.png";
import "../styles/layout_styles/Sidebar.css";

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
        label: "Internal Opportunities",
        path: "/internal/opportunities",
      },
      {
        icon: "bi-hand-thumbs-up",
        label: "Nominations",
        path: "/internal/nominations",
      },
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
        label: "Meetings & MoM",
        path: "/hr/dasboard/meetmom",
      },
    ],
    Leadership: [
      {
        icon: "bi-speedometer2",
        label: "Dashboard",
        path: "/leadership/dashboard",
      },
      {
        icon: "bi-cash-coin",
        label: "Budget Management",
        path: "/leadership/budget-management",
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
        icon: "bi bi-file-earmark-text",
        label: "Feedback Management",
        path: "/department-head/dashboard/feedback/allreviews",
      },
      {
        icon: "bi-hand-thumbs-up",
        label: "Nominations",
        path: "/internal/nominations",
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
        label: "Meetings & MoM",
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
        label: "Meetings & MoM",
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

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  return (
    <aside className={`sbd-sidebar ${sidebarExpanded ? "sbd-expanded" : "sbd-collapsed"}`}>
      {/* Logo Section */}
      <div className="sbd-logo-section">
        <img
          src={sidebarExpanded ? logodarkbarred : icon}
          alt="EEPZ Logo"
          className="sbd-logo"
        />
      </div>

      {/* Toggle Button */}
      <button
        className="sbd-toggle-btn"
        onClick={toggleSidebar}
        aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
        title={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        <i className={`bi ${sidebarExpanded ? "bi-chevron-left" : "bi-chevron-right"}`}></i>
      </button>

      {/* Navigation Menu */}
      <nav className="sbd-nav">
        <ul className="sbd-menu-list">
          {menuItems.map((item, index) => {
            const active = isActive(item.path);
            return (
              <li key={index} className="sbd-menu-item">
                <button
                  onClick={() => navigate(item.path)}
                  className={`sbd-menu-btn ${active ? "sbd-active" : ""}`}
                  title={!sidebarExpanded ? item.label : ""}
                >
                  {active && <div className="sbd-active-indicator" />}
                  <i className={`bi ${item.icon} sbd-menu-icon`}></i>
                  {sidebarExpanded && <span className="sbd-menu-label">{item.label}</span>}
                </button>
                {/* Tooltip for collapsed state */}
                {!sidebarExpanded && <div className="sbd-tooltip">{item.label}</div>}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
