import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/auth/AuthContext";
import styles from "../../../styles/lnd/components/Breadcrumb.module.css";

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
    if (role === "Leadership") return "/leadership";
    if (role === "Department Head") return "/department-head";
    return "/manager";
  };

  const basePath = getRoleBasePath();

  return (
    <nav aria-label="breadcrumb" className={styles.container}>
      <ol className={`breadcrumb ${styles.breadcrumbList}`}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const fullPath = basePath + item.path;

          return (
            <li
              key={index}
              className={`breadcrumb-item ${isLast ? "active" : ""} ${styles.breadcrumbItem}`}
              aria-current={isLast ? "page" : undefined}
            >
              {!isLast && fullPath ? (
                <button
                  className={styles.breadcrumbLink}
                  onClick={() => handleNavigate(fullPath)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = "underline";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = "none";
                  }}
                >
                  {item.icon && <i className={`bi bi-${item.icon} ${styles.breadcrumbIcon}`}></i>}
                  {item.label}
                </button>
              ) : (
                <span className={styles.breadcrumbCurrent}>
                  {item.icon && <i className={`bi bi-${item.icon} ${styles.breadcrumbIcon}`}></i>}
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
