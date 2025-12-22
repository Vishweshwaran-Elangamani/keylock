import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/auth/AuthContext";
import styles from "../../../styles/goals/components/Breadcrumb.module.css";

const Breadcrumb = ({ items }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleNavigate = (path) => {
    if (path) {
      navigate(path);
    }
  };

  const getRoleBasePath = () => {
    const role = user?.role;
    if (role === "Admin") return "/admin";
    if (role === "HR") return "/HR";
    if (role === "Employee") return "/employee";
    if (role === "Leadership" || role === "Leadership") return "/leadership";
    if (role === "Department Head") return "/department-head";
    return "/manager";
  };

  const basePath = getRoleBasePath();

  return (
    <nav aria-label="breadcrumb" className={styles.nav}>
      <ol className={`breadcrumb ${styles.breadcrumb}`}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const fullPath = basePath + item.path;

          return (
            <li
              key={index}
              className={`breadcrumb-item ${isLast ? "active" : ""} ${
                styles.item
              }`}
              aria-current={isLast ? "page" : undefined}
            >
              {!isLast && fullPath ? (
                <button
                  onClick={() => handleNavigate(fullPath)}
                  className={styles.linkButton}
                >
                  {item.icon && <i className={`bi bi-${item.icon}`}></i>}
                  {item.label}
                </button>
              ) : (
                <span
                  className={`${styles.label} ${
                    isLast ? styles.labelActive : ""
                  }`}
                >
                  {item.icon && <i className={`bi bi-${item.icon}`}></i>}
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
