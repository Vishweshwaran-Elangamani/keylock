import { Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../../styles/common/Breadcrumb.css";
const Breadcrumb = ({ items = [] }) => {
  const navigate = useNavigate();
  const handleHomeClick = () => {
    navigate("/dashboard");
  };
  const handleItemClick = (path) => {
    if (path) {
      navigate(path);
    }
  };
  return (
    <nav className="breadcrumb-nav" aria-label="Breadcrumb">
      <div className="breadcrumb-content">
        <button
          className="breadcrumb-home-btn"
          onClick={handleHomeClick}
          title="Go to Dashboard"
          aria-label="Home"
        >
          <Home size={18} />
        </button>
        {items.length > 0 && (
          <>
            <span className="breadcrumb-separator">/</span>
            {items.map((item, index) => {
              const isLast = index === items.length - 1;
              const hasPath = !!item.path;
              return (
                <div key={index} className="breadcrumb-segment">
                  {index > 0 && <span className="breadcrumb-separator">/</span>}
                  {isLast ? (
                    <span className="breadcrumb-current">{item.label}</span>
                  ) : hasPath ? (
                    <button
                      className="breadcrumb-link-btn"
                      onClick={() => handleItemClick(item.path)}
                    >
                      {item.label}
                    </button>
                  ) : (
                    <span className="breadcrumb-text">{item.label}</span>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </nav>
  );
};
export default Breadcrumb;
