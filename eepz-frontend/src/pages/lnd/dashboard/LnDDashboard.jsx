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
import styles from "../../../styles/lnd/pages/dashboard/LnDDashboard.module.css";

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

  const getBadgeClass = (isSme) => {
    return isSme ? styles.badgeActive : styles.badgeInactive;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
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
      <div className={styles.headerSection}>
        <h2 className={styles.headerTitle}>Learning & Development</h2>
        <p className={styles.headerDescription}>
          {isHR
            ? "Manage organization-wide learning and development"
            : "Track skills, manage assignments, and grow your expertise"}
        </p>
      </div>

      {/* Navigation Cards */}
      <div className={styles.cardsGrid}>
        {navigationCards
          .filter((card) => card.show)
          .map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                onClick={() => navigate(card.path)}
                className={styles.navCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = card.backgroundColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(39, 35, 92, 0.56)";
                }}
              >
                {/* Card Content */}
                <div className={styles.cardContent}>
                  {/* Left Section: Icon + Text */}
                  <div className={styles.leftSection}>
                    {/* Icon */}
                    <div
                      className={styles.iconContainer}
                      style={{
                        background: `${card.backgroundColor}15`,
                        border: `2px solid ${card.backgroundColor}30`,
                      }}
                    >
                      <Icon size={24} color={card.backgroundColor} />
                    </div>

                    {/* Title & Description */}
                    <div className={styles.textContainer}>
                      <h5 className={styles.cardTitle}>{card.title}</h5>
                      <p className={styles.cardDescription}>
                        {card.description}
                      </p>
                    </div>
                  </div>

                  {/* Right Section: Count or Badge */}
                  <div className={styles.rightSection}>
                    {card.count !== undefined ? (
                      <span className={styles.countDisplay}>
                        {card.count}
                      </span>
                    ) : card.badge ? (
                      <span className={`${styles.badge} ${getBadgeClass(stats.isSme)}`}>
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