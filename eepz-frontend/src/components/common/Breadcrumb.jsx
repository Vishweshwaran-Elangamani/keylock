import { ChevronRight, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Breadcrumb = ({ items }) => {
  const navigate = useNavigate();

  const handleHomeClick = () => {
    // If there's a previous item in the breadcrumb, go to it
    if (items.length > 1 && items[items.length - 2].path) {
      navigate(items[items.length - 2].path);
    } else {
      navigate(-1);
    }
  };

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        fontSize: '0.875rem',
        color: '#6c757d',
        flexWrap: 'wrap'
      }}
    >
      <Home
        size={16}
        style={{ cursor: 'pointer', color: '#97247E', flexShrink: 0 }}
        onClick={handleHomeClick}
        title="Go Back"
      />
      
      {items.map((item, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          /
          {item.path ? (
            <span
              onClick={() => navigate(item.path)}
              style={{
                cursor: 'pointer',
                color: '#97247E',
                fontWeight: index === items.length - 1 ? '600' : '400',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => (e.target.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.target.style.textDecoration = 'none')}
            >
              {item.label}
            </span>
          ) : (
            <span
              style={{
                fontWeight: '600',
                color: '#212529'
              }}
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumb;
