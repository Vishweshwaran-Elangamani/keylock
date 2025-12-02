import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Users,
  Award,
  CheckCircle,
  Clock,
  TrendingUp,
  FileText,
  ClipboardList,
  Building2,
  Briefcase,
} from "lucide-react";
import Breadcrumb from "../../../components/lnd/common/Breadcrumb";
import { lndService } from "../../../services/lnd/lndService";
import { toast } from "sonner";

const LnDDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    mySkills: 0,
    activeAssignments: 0,
    pendingApprovals: 0,
    isSme: false,
  });
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [rolePrefix, setRolePrefix] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const roleName = user?.role || "";
    setUserRole(roleName);

    const prefix = getRolePrefix(roleName);
    setRolePrefix(prefix);

    fetchDashboardData();
  }, []);

  const getRolePrefix = (role) => {
    const prefixMap = {
      Manager: "/manager",
      "Department Head": "/department-head",
      Leadership: "/leadership",
      Employee: "/employee",
      HR: "/hr",
      Admin: "/admin",
    };
    return prefixMap[role] || "/employee";
  };

  const fetchDashboardData = async () => {
    try {
      const [skillsRes, assignmentsRes, approvalsRes, smeRes] =
        await Promise.all([
          lndService
            .getMySkills(1)
            .catch(() => ({ data: { data: { totalCount: 0 } } })),
          lndService
            .getMyAssignments(1, "IN_PROGRESS")
            .catch(() => ({ data: { data: { totalCount: 0 } } })),
          lndService
            .getMyApprovals(1, "", "PENDING")
            .catch(() => ({ data: { data: { totalCount: 0 } } })),
          lndService.checkIfSme().catch(() => ({ data: { data: false } })),
        ]);

      setStats({
        mySkills: skillsRes.data.data.totalCount,
        activeAssignments: assignmentsRes.data.data.totalCount,
        pendingApprovals: approvalsRes.data.data.totalCount,
        isSme: smeRes.data.data,
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const isManager = ["Manager", "Department Head", "Leadership"].includes(
    userRole
  );
  const isHR = userRole === "HR";

  const navigationCards = [
    {
      title: "My Skills",
      count: stats.mySkills,
      icon: BookOpen,
      backgroundColor: "#97247E",
      path: `${rolePrefix}/lnd/my-skills`,
      description: "View and manage your skills",
      show: true,
    },
    {
      title: "My Assignments",
      icon: TrendingUp,
      backgroundColor: "#0d6efd",
      path: `${rolePrefix}/lnd/my-assignments`,
      description: "Track your learning assignments",
      show: true,
    },
    {
      title: "Pending Approvals",
      count: stats.pendingApprovals,
      icon: Clock,
      backgroundColor: "#ffc107",
      path: `${rolePrefix}/lnd/approvals/pending`,
      description: "Review pending requests",
      show: true,
    },
    {
      title: "SME Status",
      icon: Award,
      backgroundColor: stats.isSme ? "#198754" : "#6c757d",
      path: stats.isSme
        ? `${rolePrefix}/lnd/sme/assignments`
        : `${rolePrefix}/lnd/my-skills`,
      description: stats.isSme
        ? "Manage your SME assignments"
        : "Apply to become SME",
      badge: stats.isSme ? "Active" : "Inactive",
      show: true,
    },
    {
      title: "Approval History",
      icon: FileText,
      backgroundColor: "#6c757d",
      path: `${rolePrefix}/lnd/approvals/history`,
      description: "View all past approvals",
      show: true,
    },
    {
      title: "Team Skills",
      icon: Users,
      backgroundColor: "#20c997",
      path: `${rolePrefix}/lnd/team/skills`,
      description: "Manage team member skills",
      show: isManager,
    },
    {
      title: "Team Assignments",
      icon: ClipboardList,
      backgroundColor: "#17a2b8",
      path: `${rolePrefix}/lnd/assignments/team`,
      description: "Monitor team learning progress",
      show: isManager,
    },
    {
      title: "Organization Skills",
      icon: Building2,
      backgroundColor: "#97247E",
      path: `${rolePrefix}/lnd/organization-skills`,
      description: "View skills across the organization",
      show: isHR,
    },
    {
      title: "Organization Assignments",
      icon: Briefcase,
      backgroundColor: "#0d6efd",
      path: `${rolePrefix}/lnd/organization-assignments`,
      description: "Monitor all learning assignments",
      show: isHR,
    },
    {
      title: "SME Directory",
      icon: Award,
      backgroundColor: "#198754",
      path: `${rolePrefix}/lnd/sme-directory`,
      description: "View all Subject Matter Experts",
      show: isHR,
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "", path: "/dashboard", icon: "house-door" },
          { label: "LnD Dashboard" },
        ]}
      />

      {/* Header Section */}
      <div style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            marginBottom: "0.5rem",
            fontWeight: "700",
            color: "#212529",
          }}
        >
          Learning & Development
        </h2>
        <p style={{ color: "#6c757d", fontSize: "0.9375rem", margin: 0 }}>
          {isHR
            ? "Manage organization-wide learning and development"
            : "Track skills, manage assignments, and grow your expertise"}
        </p>
      </div>

      {/* Navigation Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {navigationCards
          .filter((card) => card.show)
          .map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                onClick={() => navigate(card.path)}
                style={{
                  background: "#fff",
                  borderRadius: "12px",
                  padding: "1.5rem",
                  border: "1px solid rgba(39, 35, 92, 0.56)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 16px rgba(0,0,0,0.12)";
                  e.currentTarget.style.borderColor = card.backgroundColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                  e.currentTarget.style.borderColor = "rgba(39, 35, 92, 0.56)";
                }}
              >
                {/* Card Content */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "1rem",
                  }}
                >
                  {/* Left Section: Icon + Text */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        background: `${card.backgroundColor}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `2px solid ${card.backgroundColor}30`,
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={24} color={card.color} />
                    </div>

                    {/* Title & Description */}
                    <div
                      style={{
                        textAlign: "left",
                      }}
                    >
                      <h5
                        style={{
                          margin: 0,
                          fontWeight: "600",
                          color: "#212529",
                          fontSize: "1rem",
                        }}
                      >
                        {card.title}
                      </h5>
                      <p
                        style={{
                          fontSize: "0.875rem",
                          color: "#6c757d",
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        {card.description}
                      </p>
                    </div>
                  </div>

                  {/* Right Section: Count or Badge */}
                  <div style={{ textAlign: "right" }}>
                    {card.count !== undefined ? (
                      <span
                        style={{
                          fontSize: "2rem",
                          fontWeight: "700",
                          lineHeight: 1,
                        }}
                      >
                        {card.count}
                      </span>
                    ) : card.badge ? (
                      <span
                        style={{
                          padding: "0.375rem 0.75rem",
                          borderRadius: "12px",
                          fontSize: "10px",
                          fontWeight: "600",
                          background: stats.isSme ? "#d1fae5" : "#f3f4f6",
                          color: stats.isSme ? "#065f46" : "#6c757d",
                          border: `1px solid ${
                            stats.isSme ? "#065f46" : "#6c757d"
                          }30`,
                        }}
                      >
                        {card.badge}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default LnDDashboard;
