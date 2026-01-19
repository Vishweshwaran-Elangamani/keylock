import { useState } from "react";
import { useAuth } from "../contexts/auth/AuthContext";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const DashboardLayout = ({ children, role, allowedRoles = [] }) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false); // NEW: Shared sidebar state

  const currentRole = user?.role || role;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* SIDEBAR */}
      <Sidebar 
        allowedRoles={allowedRoles} 
        currentRole={currentRole}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onClose={() => setSidebarOpen(false)}
      />

      {/* MAIN CONTENT WRAPPER */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "hidden",
        }}
      >
        {/* NAVBAR */}
        <Navbar 
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />

        {/* MAIN CONTENT */}
        <main
          style={{
            flex: 1,
            overflow: "auto",
            background: "#f8f9fa",
            padding: "1.5rem",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
