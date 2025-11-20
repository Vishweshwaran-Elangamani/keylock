import React, { useState, useEffect } from "react";
import { Modal, CloseButton } from "react-bootstrap";
import { toast } from "sonner";
import budgetAllocationService from "../../../services/hr_operations/hr/budgetAllocationService";
import { formatCurrency } from "../../../utils/auth/currencyFormatter";

const ViewPeriodDetailsModal = ({ period, onClose }) => {
  const [subAllocations, setSubAllocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubAllocations();
  }, []);

  const fetchSubAllocations = async () => {
    try {
      setLoading(true);
      const response =
        await budgetAllocationService.getFundAllocationsByDepartment(
          period.departmentId
        );

      if (response.success) {
        const periodAllocations = response.data.filter(
          (alloc) =>
            alloc.period === period.period &&
            alloc.periodYear === period.periodYear
        );
        setSubAllocations(periodAllocations);
      }
    } catch (error) {
      console.error("Error fetching sub-allocations:", error);
      toast.error("Failed to load sub-allocations");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (utilizationPercentage) => {
    if (utilizationPercentage >= 90) return "#dc3545";
    if (utilizationPercentage >= 75) return "#ffc107";
    if (utilizationPercentage >= 50) return "#0dcaf0";
    return "#198754";
  };

  const getStatusBgColor = (utilizationPercentage) => {
    if (utilizationPercentage >= 90) return "#dc3545";
    if (utilizationPercentage >= 75) return "#ffc107";
    if (utilizationPercentage >= 50) return "#0dcaf0";
    return "#198754";
  };

  const getStatusText = (utilizationPercentage) => {
    if (utilizationPercentage >= 90) return "Critical";
    if (utilizationPercentage >= 75) return "High";
    if (utilizationPercentage >= 50) return "Medium";
    return "Low";
  };

  return (
    <>
      {/* Custom Backdrop with Blur Effect */}
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

      <Modal
        show={true}
        onHide={onClose}
        centered
        size="xl"
        backdrop={false}
        style={{ zIndex: 1050 }}
      >
        <div style={{
          borderRadius: '0.5rem',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          border: 'none',
        }}>
          {/* HEADER with White Close Button */}
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
              <i className="bi bi-eye"></i>
              {period.period} {period.periodYear} - Detailed View
            </div>
            <CloseButton
              onClick={onClose}
              variant="white"
              style={{
                filter: 'brightness(0) invert(1)',
                opacity: 1
              }}
            />
          </div>

          {/* BODY */}
          <Modal.Body
            style={{
              padding: '20px',
              background: '#ffffff',
              overflowY: 'auto',
              maxHeight: 'calc(90vh - 140px)',
              border: 'none'
            }}
          >
            {/* Period Summary */}
            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                background: '#f9fafb',
                padding: '1rem',
                marginBottom: '20px'
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <h6 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                  {period.departmentName}
                </h6>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '16px',
                  marginTop: '12px'
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Period
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#334155' }}>
                    {period.period} {period.periodYear}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Allocated Amount
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#0d6efd' }}>
                    {formatCurrency(period.allocatedAmount)}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Utilized
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#dc3545' }}>
                    {formatCurrency(period.utilizedAmount || 0)}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Remaining
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#198754' }}>
                    {formatCurrency(period.remainingAmount || 0)}
                  </span>
                </div>
              </div>

              {period.notes && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '12px 16px',
                    backgroundColor: '#d1ecf1',
                    border: '1px solid #bee5eb',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#0c5460',
                    marginBottom: 0
                  }}
                >
                  <strong>Notes:</strong> {period.notes}
                </div>
              )}
            </div>

            {/* Sub-Allocations */}
            <h6 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
              <i className="bi bi-list-task" style={{ marginRight: '8px' }}></i>
              Sub-Allocations ({subAllocations.length})
            </h6>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #e5e7eb',
                    borderTopColor: '#0d6efd',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    display: 'inline-block',
                    marginBottom: '12px'
                  }}
                />
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>
                  Loading sub-allocations...
                </p>
              </div>
            ) : subAllocations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <i
                  className="bi bi-inbox"
                  style={{ fontSize: '48px', color: '#cbd5e1' }}
                ></i>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '16px' }}>
                  No sub-allocations created yet for this period
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#334155' }}>Type</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#334155' }}>Amount</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#334155' }}>Utilized</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#334155' }}>Remaining</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#334155' }}>Utilization %</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#334155' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#334155' }}>Allocated Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subAllocations.map((alloc) => {
                      const remaining = alloc.amount - (alloc.utilizedAmount || 0);
                      const utilization = alloc.utilizationPercentage || 0;
                      const statusColor = getStatusColor(utilization);
                      const statusBg = getStatusBgColor(utilization);
                      const statusText = getStatusText(utilization);

                      return (
                        <tr key={alloc.allocationId} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '12px' }}>
                            <span
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '600',
                                backgroundColor: '#e0e7ff',
                                color: '#3730a3'
                              }}
                            >
                              {alloc.allocationType}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontWeight: '600' }}>
                            {formatCurrency(alloc.amount)}
                          </td>
                          <td style={{ padding: '12px', color: '#dc3545' }}>
                            {formatCurrency(alloc.utilizedAmount || 0)}
                          </td>
                          <td style={{ padding: '12px', color: '#198754' }}>
                            {formatCurrency(remaining)}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div
                                style={{
                                  width: '80px',
                                  height: '8px',
                                  backgroundColor: '#e5e7eb',
                                  borderRadius: '4px',
                                  overflow: 'hidden'
                                }}
                              >
                                <div
                                  style={{
                                    width: `${utilization}%`,
                                    height: '100%',
                                    backgroundColor: statusColor,
                                    borderRadius: '4px',
                                    transition: 'width 0.3s ease'
                                  }}
                                ></div>
                              </div>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>
                                {Math.round(utilization)}%
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '600',
                                backgroundColor: statusBg,
                                color: '#ffffff'
                              }}
                            >
                              {statusText}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontSize: '11px', color: '#64748b' }}>
                            {new Date(alloc.allocatedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: '#f9fafb', borderTop: '2px solid #e5e7eb' }}>
                      <td style={{ padding: '12px', fontWeight: '700' }}>
                        Total
                      </td>
                      <td style={{ padding: '12px', fontWeight: '700' }}>
                        {formatCurrency(
                          subAllocations.reduce((sum, a) => sum + a.amount, 0)
                        )}
                      </td>
                      <td style={{ padding: '12px', fontWeight: '700', color: '#dc3545' }}>
                        {formatCurrency(
                          subAllocations.reduce(
                            (sum, a) => sum + (a.utilizedAmount || 0),
                            0
                          )
                        )}
                      </td>
                      <td style={{ padding: '12px', fontWeight: '700', color: '#198754' }}>
                        {formatCurrency(
                          subAllocations.reduce(
                            (sum, a) => sum + (a.amount - (a.utilizedAmount || 0)),
                            0
                          )
                        )}
                      </td>
                      <td colSpan="3" style={{ padding: '12px' }}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Modal.Body>

          {/* FOOTER */}
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
            {/* Close Button */}
            <button
              type="button"
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
              onMouseEnter={(e) => {
                e.target.style.background = '#5a6268';
                e.target.style.borderColor = '#5a6268';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#6c757d';
                e.target.style.borderColor = '#6c757d';
              }}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Keyframe Animation for Spinner */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
};

export default ViewPeriodDetailsModal;
