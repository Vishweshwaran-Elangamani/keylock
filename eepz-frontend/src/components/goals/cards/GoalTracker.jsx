import { useAuth } from "../../../contexts/auth/AuthContext";

const GoalTracker = ({ summary }) => {
  const { user } = useAuth();

  if (!summary) return null;

  const allCards = [
    {
      title: "Completed",
      count: summary.completed || 0,
      icon: "bi-check-circle-fill",
      bgColor: "#28a745",
      iconColor: "#28a745",
      textColor: "#155724",
    },
    {
      title: "Ongoing",
      count: summary.ongoing || 0,
      icon: "bi-arrow-repeat",
      bgColor: "#0d6efd",
      iconColor: "#0d6efd",
      textColor: "#084298",
    },
    {
      title: "Pending",
      count: summary.pending || 0,
      icon: "bi-clock",
      bgColor: "#fcd03eff",
      iconColor: "#ffc107",
      textColor: "#856404",
    },
    {
      title: "Overdue",
      count: summary.overdue || 0,
      icon: "bi-exclamation-triangle-fill",
      bgColor: "#dc3545",
      iconColor: "#dc3545",
      textColor: "#721c24",
    },
    {
      title: "Pending Approvals",
      count: summary.pendingApprovals || 0,
      icon: "bi-hourglass-split",
      bgColor: "#6f42c1",
      iconColor: "#6f42c1",
      textColor: "#432874",
      showForRoles: ["Manager", "Department Head", "Leadership"],
    },
  ];

  // Filter cards based on user role
  const cards = allCards.filter((card) => {
    if (card.showForRoles) {
      return card.showForRoles.includes(user.role);
    }
    return true;
  });

  return (
    <div className="row g-3 mb-4">
      {cards.map((card, index) => (
        <div key={index} className="col-12 col-md-6 col-lg">
          <div
            className="card h-100"
            style={{
              border: "none",
              borderRadius: "0.75rem",
              border: `1px solid ${card.bgColor}`,
              transition: "all 0.2s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div className="card-body" style={{ padding: "1.25rem" }}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p
                    className="mb-1"
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: card.textColor,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {card.title}
                  </p>
                  <h2
                    className="mb-0"
                    style={{
                      fontWeight: 700,
                      color: card.textColor,
                      fontSize: "2rem",
                    }}
                  >
                    {card.count}
                  </h2>
                </div>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(255, 255, 255, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i
                    className={`bi ${card.icon}`}
                    style={{
                      fontSize: "1.5rem",
                      color: card.iconColor,
                    }}
                  ></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GoalTracker;
