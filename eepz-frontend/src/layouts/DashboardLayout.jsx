import { useAuth } from "../contexts/auth/AuthContext";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import AdminChatbot from "../components/Chatbot/Chatbot"; // add this

const DashboardLayout = ({ children, role, allowedRoles = [] }) => {
  const { user } = useAuth();

  // Determine current role from user object or use the role prop
  const currentRole = user?.role || role;

  const isAdmin =
    currentRole === "Admin" || currentRole === "ADMIN" || currentRole === "admin";

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* SIDEBAR */}
      <Sidebar allowedRoles={allowedRoles} currentRole={currentRole} />

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
        <Navbar />

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

        {/* ADMIN CHATBOT – visible on ALL pages, only for admin */}
        {isAdmin && <AdminChatbot />}
      </div>
    </div>
  );
};

export default DashboardLayout;
