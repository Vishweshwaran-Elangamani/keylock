import React from "react";
import { useNavigate } from "react-router-dom";

const ManagerAcknowledgmentModal = ({ ackList, error, loading }) => {
  const navigate = useNavigate();

  const breadcrumbItems = [
    { label: "Performance", path: "/hr/dashboard/performance" },
    { label: "Employee Acknowledgments", path: null }
  ];

  return (
    <div style={{ padding: '2rem', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Breadcrumb Navigation */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          color: '#6c757d',
          flexWrap: 'wrap'
        }}
      >
        <i 
          className="bi bi-house-door"
          style={{ 
            cursor: 'pointer', 
            color: '#97247E', 
            fontSize: '1rem',
            flexShrink: 0 
          }}
          onClick={() => navigate("/hr/dashboard")}
          title="Go Back"
        />
        
        {breadcrumbItems.map((item, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>/</span>
            {item.path ? (
              <span
                onClick={() => navigate(item.path)}
                style={{
                  cursor: 'pointer',
                  color: '#97247E',
                  fontWeight: index === breadcrumbItems.length - 1 ? '600' : '400',
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

      {/* Page Title */}
      <h2 style={{ 
        fontSize: '1.75rem', 
        fontWeight: '600', 
        color: '#27235c', 
        marginBottom: '1.5rem' 
      }}>
        Employee Acknowledgments
      </h2>

      {/* Content Area */}
      {loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem', 
          fontSize: '1.1rem', 
          color: '#6c757d' 
        }}>
          Loading...
        </div>
      ) : error ? (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          border: '1px solid #f5c6cb', 
          borderRadius: '0.375rem' 
        }}>
          {error}
        </div>
      ) : ackList.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem', 
          backgroundColor: '#fff', 
          border: '1px solid #dee2e6', 
          borderRadius: '0.5rem', 
          color: '#6c757d' 
        }}>
          No employee acknowledgments found.
        </div>
      ) : (
        <div style={{ 
          backgroundColor: '#fff', 
          borderRadius: '0.5rem', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}>
          {/* Table Container */}
          <div style={{ 
            border: '1px solid #27235c', 
            borderRadius: '0.5rem',
            overflow: 'hidden'
          }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '1rem'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#27235c' }}>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left', 
                    color: '#fff', 
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    borderBottom: '2px solid #27235c'
                  }}>
                    Employee
                  </th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left', 
                    color: '#fff', 
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    borderBottom: '2px solid #27235c'
                  }}>
                    Employee Comment
                  </th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left', 
                    color: '#fff', 
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    borderBottom: '2px solid #27235c'
                  }}>
                    Date Acknowledged
                  </th>
                </tr>
              </thead>
              <tbody>
                {ackList.map((row, idx) => (
                  <tr 
                    key={idx}
                    style={{ 
                      backgroundColor: idx % 2 === 0 ? '#fff' : '#f8f9fa',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#fff' : '#f8f9fa'}
                  >
                    <td style={{ 
                      padding: '1rem',
                      textAlign: 'left',
                      borderBottom: '1px solid #dee2e6',
                      color: '#212529',
                      fontSize: '1rem'
                    }}>
                      {row.employeeName}
                    </td>
                    <td style={{ 
                      padding: '1rem',
                      textAlign: 'left',
                      borderBottom: '1px solid #dee2e6',
                      color: '#495057',
                      fontSize: '1rem'
                    }}>
                      {row.employeeComments}
                    </td>
                    <td style={{ 
                      padding: '1rem',
                      textAlign: 'left',
                      borderBottom: '1px solid #dee2e6',
                      color: '#495057',
                      fontSize: '1rem'
                    }}>
                      {row.acknowledgedAt
                        ? new Date(row.acknowledgedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric"
                        })
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Section */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '1.25rem 1.5rem',
            backgroundColor: '#fff',
            borderTop: '1px solid #dee2e6',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            {/* Entries Selector */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontSize: '1rem',
              color: '#495057'
            }}>
              <span>Show</span>
              <select style={{ 
                padding: '0.375rem 0.75rem',
                border: '1px solid #ced4da',
                borderRadius: '0.375rem',
                backgroundColor: '#fff',
                cursor: 'pointer',
                fontSize: '1rem',
                color: '#495057',
                outline: 'none'
              }}>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span>entries</span>
            </div>

            {/* Pagination Status */}
            <div style={{ 
              fontSize: '1rem', 
              color: '#495057' 
            }}>
              Showing 1 to {ackList.length} of {ackList.length} entries
            </div>

            {/* Pagination Controls */}
            <nav>
              <ul style={{ 
                display: 'flex', 
                listStyle: 'none', 
                padding: 0, 
                margin: 0, 
                gap: '0.25rem' 
              }}>
                <li>
                  <button style={{ 
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #dee2e6',
                    backgroundColor: '#f8f9fa',
                    color: '#6c757d',
                    borderRadius: '0.375rem',
                    cursor: 'not-allowed',
                    fontSize: '1rem'
                  }}
                  disabled>
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>
                <li>
                  <button style={{ 
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #27235c',
                    backgroundColor: '#27235c',
                    color: '#fff',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1rem'
                  }}>
                    1
                  </button>
                </li>
                <li>
                  <button style={{ 
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #dee2e6',
                    backgroundColor: '#f8f9fa',
                    color: '#6c757d',
                    borderRadius: '0.375rem',
                    cursor: 'not-allowed',
                    fontSize: '1rem'
                  }}
                  disabled>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerAcknowledgmentModal;
