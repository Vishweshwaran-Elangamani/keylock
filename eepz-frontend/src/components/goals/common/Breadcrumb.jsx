import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/auth/AuthContext";

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
    if (role === "Employee") return "/employee";
    if (role === "Leadership" || role === "Leadership") return "/leadership";
    if (role === "Department Head") return "/manager";
    return "/manager";
  };

  const basePath = getRoleBasePath();

  return (
    <nav aria-label="breadcrumb" style={{ marginBottom: "1rem" }}>
      <ol
        className="breadcrumb"
        style={{
          backgroundColor: "#f8f9fa",
          color: "#97247E",
          padding: "0.75rem 1rem",
          borderRadius: "0.5rem",
          marginBottom: 0,
        }}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          // Build full path correctly
          const fullPath = basePath + item.path;

          return (
            <li
              key={index}
              className={`breadcrumb-item ${isLast ? "active" : ""}`}
              aria-current={isLast ? "page" : undefined}
              style={{ fontSize: "0.95rem" }}
            >
              {!isLast && fullPath ? (
                <button
                  onClick={() => handleNavigate(fullPath)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#97247E",
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.textDecoration = "underline")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.textDecoration = "none")
                  }
                >
                  {item.icon && <i className={`bi bi-${item.icon}`}></i>}
                  {item.label}
                </button>
              ) : (
                <span
                  style={{
                    color: isLast ? "#97247E" : "#212529",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontWeight: isLast ? 500 : 400,
                  }}
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
