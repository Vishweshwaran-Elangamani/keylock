import React from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";

function ViewFormDetailsModal({ formDetails, onClose }) {
  const navigate = useNavigate();

  if (!formDetails) return null;

  return (
    <>
      {/* Custom Backdrop with Blur Effect - Matching AddPolicyModal */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(39, 35, 92, 0.4)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 1040,
          transition: 'all 0.3s ease'
        }}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1050,
          width: '90%',
          maxWidth: '900px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '0.5rem',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          border: 'none',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER - Matching AddPolicyModal */}
        <div
          style={{
            background: '#27235C',
            color: '#ffffff',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative'
          }}
        >
          <div
            style={{
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#ffffff'
            }}
          >
            <i className="bi bi-file-earmark-text-fill"></i>
            Form Details
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'background 0.2s ease',
              lineHeight: 1,
              fontWeight: '400'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            ×
          </button>
        </div>

        {/* BODY - Matching AddPolicyModal */}
        <div
          style={{
            padding: '20px',
            background: '#ffffff',
            overflowY: 'auto',
            maxHeight: 'calc(90vh - 140px)',
            border: 'none',
            flex: 1
          }}
        >
          {/* Form Basic Info Section */}
          <div style={{ marginBottom: '24px' }}>
            <h4
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#334155',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingBottom: '8px',
                borderBottom: '1px solid #e5e7eb'
              }}
            >
              <i className="bi bi-info-circle-fill" style={{ fontSize: '14px' }}></i>
              Basic Information
            </h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px'
              }}
            >
              <div
                style={{
                  padding: '16px',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(90deg, #97247E 0%, #E01950 100%)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <i className="bi bi-file-text" style={{ color: '#ffffff', fontSize: '18px' }}></i>
                </div>
                <div style={{ flex: 1 }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      marginBottom: '4px'
                    }}
                  >
                    Form Name
                  </span>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#334155',
                      display: 'block'
                    }}
                  >
                    {formDetails.name}
                  </span>
                </div>
              </div>

              <div
                style={{
                  padding: '16px',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(90deg, #97247E 0%, #E01950 100%)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <i className="bi bi-tag-fill" style={{ color: '#ffffff', fontSize: '18px' }}></i>
                </div>
                <div style={{ flex: 1 }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      marginBottom: '4px'
                    }}
                  >
                    Type
                  </span>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      background: 'linear-gradient(90deg, #97247E 0%, #E01950 100%)',
                      color: '#ffffff',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    {formDetails.type}
                  </span>
                </div>
              </div>

              <div
                style={{
                  padding: '16px',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(90deg, #97247E 0%, #E01950 100%)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <i className="bi bi-briefcase-fill" style={{ color: '#ffffff', fontSize: '18px' }}></i>
                </div>
                <div style={{ flex: 1 }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      marginBottom: '4px'
                    }}
                  >
                    Category
                  </span>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#334155',
                      display: 'block'
                    }}
                  >
                    {formDetails.deliveryEnablement || "N/A"}
                  </span>
                </div>
              </div>

              <div
                style={{
                  padding: '16px',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(90deg, #97247E 0%, #E01950 100%)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <i className="bi bi-list-check" style={{ color: '#ffffff', fontSize: '18px' }}></i>
                </div>
                <div style={{ flex: 1 }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      marginBottom: '4px'
                    }}
                  >
                    Total Competencies
                  </span>
                  <span
                    style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#97247E',
                      display: 'block'
                    }}
                  >
                    {formDetails.competencies?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Competencies Table Section */}
         {/* Competencies Table Section */}
{formDetails.competencies && formDetails.competencies.length > 0 && (
  <div style={{ marginBottom: '20px' }}>
    <h4
      style={{
        fontSize: '14px',
        fontWeight: '600',
        color: '#334155',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        paddingBottom: '8px',
        borderBottom: '1px solid #e5e7eb',
        textAlign: 'left'
      }}
    >
      <i className="bi bi-grid-3x3-gap-fill" style={{ fontSize: '14px' }}></i>
      Competencies Breakdown
    </h4>
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
        background: '#ffffff'
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#27235C' }}>
            <th
              style={{
                padding: '12px 16px',
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: '600',
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                width: '80px'
              }}
            >
              #
            </th>
            <th
              style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: '600',
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                width: '35%'
              }}
            >
              Competency Name
            </th>
            <th
              style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: '600',
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {formDetails.competencies.map((comp, index) => (
            <tr
              key={index}
              style={{
                borderBottom: '1px solid #e5e7eb',
                transition: 'background 0.2s',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
            >
              <td
                style={{
                  padding: '14px 16px',
                  textAlign: 'center',
                  fontSize: '13px',
                  color: '#334155'
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(90deg, #97247E 0%, #E01950 100%)',
                    color: '#ffffff',
                    fontWeight: '600',
                    fontSize: '13px'
                  }}
                >
                  {comp.displayOrder || index + 1}
                </span>
              </td>
              <td
                style={{
                  padding: '14px 16px',
                  fontSize: '13px',
                  color: '#334155',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className="bi bi-award-fill" style={{ color: '#97247E', fontSize: '16px' }}></i>
                  <strong style={{ fontWeight: '600', color: '#334155' }}>{comp.name}</strong>
                </div>
              </td>
              <td
                style={{
                  padding: '14px 16px',
                  fontSize: '13px',
                  color: '#64748b',
                  textAlign: 'left'
                }}
              >
                {comp.description || (
                  <span style={{ color: '#9ca3af', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="bi bi-dash-circle"></i>
                    No description provided
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}


          {/* No Competencies Message */}
          {(!formDetails.competencies || formDetails.competencies.length === 0) && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                background: '#f9fafb',
                border: '1px dashed #cbd5e1',
                borderRadius: '8px',
                textAlign: 'center'
              }}
            >
              <i className="bi bi-inbox" style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '12px' }}></i>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px', fontWeight: '500' }}>
                No competencies defined for this form
              </p>
            </div>
          )}
        </div>

        {/* FOOTER - Matching AddPolicyModal */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #e2e8f0',
            background: '#ffffff',
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            borderBottomLeftRadius: '12px',
            borderBottomRightRadius: '12px'
          }}
        >
          {/* CANCEL BUTTON */}
          <button
            onClick={onClose}
            style={{
              background: '#6c757d',
              borderColor: '#6c757d',
              color: '#ffffff',
              fontWeight: '600',
              padding: '8px 16px',
              fontSize: '13px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#5a6268'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#6c757d'}
          >
            
            Close
          </button>

          {/* CREATE/EDIT BUTTON */}
          <button
            onClick={() => {
              onClose();
              navigate(`/hr/dashboard/performance/create/${formDetails.formId}`);
            }}
            style={{
              background: 'linear-gradient(90deg, #97247E 0%, #E01950 100%)',
              border: 'none',
              color: '#ffffff',
              padding: '8px 16px',
              fontWeight: '600',
              fontSize: '13px',
              borderRadius: '6px',
              transition: 'all 0.12s ease',
              boxShadow: '0 2px 8px rgba(151, 36, 126, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <i className="bi bi-pencil-square"></i>
            Edit Form
          </button>
        </div>
      </div>
    </>
  );
}

export default ViewFormDetailsModal;
