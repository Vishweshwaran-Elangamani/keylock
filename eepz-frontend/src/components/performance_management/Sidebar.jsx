import React, { useState, useEffect } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import { useRole } from "../context/RoleContext";

import Caplogo2 from "/src/assets/image.jpg";
 
// Icons

const ChevronLeftIcon = () => (
<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
<polyline points="15 18 9 12 15 6" />
</svg>

);
 
const MenuIcon = () => (
<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
<line x1="3" y1="12" x2="21" y2="12"></line>
<line x1="3" y1="6" x2="21" y2="6"></line>
<line x1="3" y1="18" x2="21" y2="18"></line>
</svg>

);
 
const BriefcaseIcon = () => (
<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7">
<rect x="2" y="7" width="18" height="13" rx="2.5" />
<path d="M14 20V6a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v14" />
</svg>

);
 
const DocumentAddIcon = () => (
<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7">
<rect x="5" y="3" width="12" height="16" rx="2" />
<line x1="11" y1="7" x2="11" y2="15" />
<line x1="7" y1="11" x2="15" y2="11" />
</svg>

);
 
const EditIcon = () => (
<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7">
<path d="M12 20h9" />
<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L8 18.5l-4 1 1-4L16.5 3.5z" />
</svg>

);
 
const EyeIcon = () => (
<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7">
<circle cx="12" cy="12" r="3" />
<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
</svg>

);
 
const ClockIcon = () => (
<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7">
<circle cx="12" cy="12" r="10" />
<polyline points="12 6 12 12 16 14" />
</svg>

);
 
const CheckCircleIcon = () => (
<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7">
<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
<polyline points="22 4 12 14.01 9 11.01" />
</svg>

);
 
const UsersIcon = () => (
<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7">
<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
<circle cx="9" cy="7" r="4" />
<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
<path d="M16 3.13a4 4 0 0 1 0 7.75" />
</svg>

);

const SettingsIcon = () => (
  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
    <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

 
export default function Sidebar() {

  const { role } = useRole();

  const location = useLocation();

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const navigate = useNavigate();
 
  useEffect(() => {

    if (!role) navigate("/");

  }, [role, navigate]);
 
  const navLinks =

    role === "HR"

      ? [

          { path: "/forms", label: "Initiate Form", icon: <BriefcaseIcon /> },

          { path: "/forms/new", label: "Create Form", icon: <DocumentAddIcon /> },

          { path: "/drafts", label: "Draft", icon: <EditIcon /> },

          { path: "/hr/view-appraisals", label: "Form Status", icon: <EyeIcon /> },

          { path: "/hr/form-progress", label: "Form Progress Tracker", icon: <EyeIcon /> },

          { path: "/hr/reward-config", label: "Reward Setup", icon: <SettingsIcon /> },
          
          { path: "/hr/nominations", label: "Nominations", icon: <UsersIcon /> }

        ]

      : role === "Employee"

      ? [{ path: "/me/assessments", label: "Submit Form", icon: <DocumentAddIcon /> }]



      : role === "Manager"

      ? [

          { path: "/manager/dashboard?section=pending", label: "Assessments", icon: <ClockIcon /> },

          { path: "/manager/dashboard?section=completed", label: "Compeleted Assessments", icon: <CheckCircleIcon /> },


           { path: "/teamlead/submissions", label: "Team Submissions", icon: <EyeIcon /> },

              { path: "/manager/nominations", label: "Nominate Team", icon: <UsersIcon /> },

        ]

      : [];
 
  useEffect(() => {

    const el = document.querySelector("main")?.parentElement;

    if (el) el.style.marginLeft = isSidebarExpanded ? "230px" : "72px";

  }, [isSidebarExpanded]);
 
  const toggleSidebar = () => setIsSidebarExpanded((exp) => !exp);
 
  if (!role) return null;
 
  return (
<aside

      style={{

        width: isSidebarExpanded ? 230 : 72,

        background: "#27235C",

        color: "#fff",

        height: "100vh",

        position: "fixed",

        top: 0,

        left: 0,

        overflow: "hidden",

        display: "flex",

        flexDirection: "column",

        justifyContent: "space-between",

        transition: "width 0.2s",

        zIndex: 1050

      }}
>

      {/* Logo Section */}
<div

        style={{

          padding: "18px 18px 10px 18px",

          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",

          background: "rgba(0, 0, 0, 0.15)",

          display: "flex",

          alignItems: "center",

          gap: 10,

          justifyContent: isSidebarExpanded ? "flex-start" : "center"

        }}
>
<img

          src={Caplogo2}

          alt="EEPZ Logo"

          style={{

            height: 40,

            width: 40,

            borderRadius: 6,

            objectFit: "contain",

            transition: "all 0.2s",

            cursor: "pointer"

          }}

          onClick={toggleSidebar}

        />

        {isSidebarExpanded && (
<span

            style={{

              fontSize: 17,

              fontWeight: 600,

              color: "#fff",

              letterSpacing: 1,

              marginLeft: 4

            }}
>

            EEPZ
</span>

        )}
</div>
 
      {/* Navigation Links */}
<nav style={{ flex: 1, padding: "1.25rem 0.5rem 0.5rem" }}>
<ul style={{ listStyle: "none", margin: 0, padding: 0 }}>

          {navLinks.map(({ path, label, icon }) => {

            const isActive =

              location.pathname + location.search === path ||

              (path.includes("?section=") && location.pathname === path.split("?")[0] && location.search.includes(path.split("?section=")[1]));
 
            return (
<li key={path} style={{ marginBottom: 7 }}>
<Link

                  to={path}

                  tabIndex={0}

                  style={{

                    display: "flex",

                    alignItems: "center",

                    gap: isSidebarExpanded ? 16 : 0,

                    justifyContent: isSidebarExpanded ? "flex-start" : "center",

                    padding: isSidebarExpanded ? "0.85rem 1rem" : "0.85rem",

                    textDecoration: "none",

                    color: isActive ? "#FFFFFF" : "rgba(255, 255, 255, 0.65)",

                    background: isActive

                      ? "linear-gradient(90deg, rgba(172, 80, 152, 0.25) 0%, rgba(151, 36, 126, 0.2) 100%)"

                      : "transparent",

                    borderRadius: 10,

                    fontWeight: isActive ? 600 : 400,

                    fontSize: "0.98rem",

                    transition: "all 0.2s",

                    position: "relative",

                    overflow: "hidden"

                  }}

                  onMouseEnter={(e) => {

                    if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)";

                  }}

                  onMouseLeave={(e) => {

                    if (!isActive) e.currentTarget.style.background = "transparent";

                  }}

                  title={isSidebarExpanded ? undefined : label}
>

                  {isActive && (
<div

                      style={{

                        position: "absolute",

                        left: 0,

                        top: 0,

                        bottom: 0,

                        width: "4px",

                        background: "linear-gradient(180deg,#AC5098 0%,#97247E 100%)",

                        borderRadius: "0 4px 4px 0"

                      }}

                    />

                  )}
<span style={{ display: "flex", alignItems: "center" }}>{icon}</span>

                  {isSidebarExpanded && <span>{label}</span>}
</Link>
</li>

            );

          })}
</ul>
</nav>
 
      {/* Collapse Button */}
<div style={{ padding: "13px 8px 17px 8px", borderTop: "1px solid #363568" }}>
<button

          onClick={toggleSidebar}

          style={{

            width: "100%",

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            borderRadius: "8px",

            padding: "10px",

            fontSize: "15px",

            fontWeight: 500,

            backgroundColor: "rgba(151,36,126,0.12)",

            border: "none",

            color: "#fff",

            cursor: "pointer",

            gap: 9,

          }}
>

          {isSidebarExpanded ? (
<>
<ChevronLeftIcon />
<span style={{ color: "#fff" }}>Collapse</span>
</>

          ) : (
<MenuIcon />

          )}
</button>
</div>
</aside>

  );

}

 