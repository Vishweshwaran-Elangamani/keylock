import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import icon from "../assets/icon.png";
import logodarkbarred from "../assets/logodarkbarred.png";
import "../styles/layout_styles/Sidebar.css";

const Sidebar = ({ allowedRoles = [], currentRole, isOpen, onToggle, onClose }) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarExpanded(true); 
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
        label: "SLA Compliance",
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
        icon: "bi-hand-thumbs-up",
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
        icon: "bi bi-file-earmark-text",
        label: "Feedback Management",
        path: "/department-head/dashboard/feedback/allreviews",
      },
      {
        icon: "bi-graph-up",
        label: "Performance",
        path: "/department-head/dashboard/performance",
      },
      {
        icon: "bi bi-file-earmark-check",
        label: "SLA Compliance",
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
        label: "Internal Opportunities",
        path: "/internal/opportunities",
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
        label: "SLA Compliance",
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
        label: "Internal Opportunities",
        path: "/internal/opportunities",
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

  const getMenuItems = () => {
    if (allowedRoles.length === 0) {
      return allMenuItems[currentRole] || [];
    }
    if (allowedRoles.includes(currentRole)) {
      return allMenuItems[currentRole] || [];
    }
    return allMenuItems[allowedRoles[0]] || [];
  };

  const menuItems = getMenuItems();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleSidebar = () => {
    if (isMobile) {
      onToggle();
    } else {
      setSidebarExpanded(!sidebarExpanded);
    }
  };

  const handleMenuClick = (path) => {
    navigate(path);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const showSidebar = isMobile ? isOpen : true;
  const sidebarClass = isMobile 
    ? `sbd-sidebar sbd-mobile ${isOpen ? "sbd-open" : ""}`
    : `sbd-sidebar ${sidebarExpanded ? "sbd-expanded" : "sbd-collapsed"}`;

  return (
    <>
      <aside className={sidebarClass}>
        <div className="sbd-logo-section">
          <img
            src={(isMobile || sidebarExpanded) ? logodarkbarred : icon}
            alt="EEPZ Logo"
            className="sbd-logo"
          />
        </div>

        {!isMobile && (
          <button
            className="sbd-toggle-btn"
            onClick={toggleSidebar}
            aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
            title={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            <i className={`bi ${sidebarExpanded ? "bi-chevron-left" : "bi-chevron-right"}`}></i>
          </button>
        )}

        {/* Navigation Menu */}
        <nav className="sbd-nav">
          <ul className="sbd-menu-list">
            {menuItems.map((item, index) => {
              const active = isActive(item.path);
              return (
                <li key={index} className="sbd-menu-item">
                  <button
                    onClick={() => handleMenuClick(item.path)}
                    className={`sbd-menu-btn ${active ? "sbd-active" : ""}`}
                    title={!sidebarExpanded && !isMobile ? item.label : ""}
                  >
                    {active && <div className="sbd-active-indicator" />}
                    <i className={`bi ${item.icon} sbd-menu-icon`}></i>
                    {(sidebarExpanded || isMobile) && <span className="sbd-menu-label">{item.label}</span>}
                  </button>
                  {/* Tooltip for collapsed state - desktop only */}
                  {!sidebarExpanded && !isMobile && <div className="sbd-tooltip">{item.label}</div>}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Mobile Backdrop */}
      {isMobile && isOpen && (
        <div
          className="sbd-mobile-backdrop"
          onClick={onClose}
        />
      )}
    </>
  );
};

export default Sidebar;
