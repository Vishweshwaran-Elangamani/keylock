import { useAuth } from "../../../contexts/auth/AuthContext";
import styles from "../../../styles/goals/components/GoalTracker.module.css";

const GoalTracker = ({ summary }) => {
  const { user } = useAuth();

  if (!summary) return null;

  const allCards = [
    {
      key: "completed",
      title: "Completed",
      count: summary.completed || 0,
      icon: "bi-check-circle-fill",
      variant: "completed",
    },
    {
      key: "ongoing",
      title: "Ongoing",
      count: summary.ongoing || 0,
      icon: "bi-arrow-repeat",
      variant: "ongoing",
    },
    {
      key: "pending",
      title: "Pending",
      count: summary.pending || 0,
      icon: "bi-clock",
      variant: "pending",
    },
    {
      key: "overdue",
      title: "Overdue",
      count: summary.overdue || 0,
      icon: "bi-exclamation-triangle-fill",
      variant: "overdue",
    },
    {
      key: "pendingApprovals",
      title: "Pending Approvals",
      count: summary.pendingApprovals || 0,
      icon: "bi-hourglass-split",
      variant: "approvals",
      showForRoles: ["Manager", "Department Head", "Leadership"],
    },
  ];

  const cards = allCards.filter((card) => {
    if (card.showForRoles) {
      return card.showForRoles.includes(user.role);
    }
    return true;
  });

  return (
    <div className="row g-3 mb-4">
      {cards.map((card) => (
        <div key={card.key} className="col-12 col-md-6 col-lg">
          <div className={`card h-100 ${styles.card} ${styles[card.variant]}`}>
            <div className={`card-body ${styles.cardBody}`}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className={styles.title}>{card.title}</p>
                  <h2 className={styles.count}>{card.count}</h2>
                </div>
                <div className={styles.iconWrapper}>
                  <i className={`bi ${card.icon} ${styles.icon}`}></i>
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
