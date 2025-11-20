import React, { useState } from "react";
import { Modal, CloseButton } from "react-bootstrap";
import { toast } from "sonner";
import periodAllocationService from "../../../services/hr_operations/hr/periodAllocationService";
import { formatCurrency } from "../../../utils/auth/currencyFormatter";

const UpdatePeriodAllocationModal = ({
  period,
  budget,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    allocatedAmount: period.allocatedAmount,
    notes: period.notes || "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const otherPeriodsTotal = budget.allocatedAmount - period.allocatedAmount;
  const availableBudget = budget.totalBudget - otherPeriodsTotal;

  const validateForm = () => {
    const newErrors = {};

    if (
      !formData.allocatedAmount ||
      parseFloat(formData.allocatedAmount) <= 0
    ) {
      newErrors.allocatedAmount = "Please enter a valid amount";
    }

    if (parseFloat(formData.allocatedAmount) > availableBudget) {
      newErrors.allocatedAmount = `Amount exceeds available budget`;
    }

    if (parseFloat(formData.allocatedAmount) < period.utilizedAmount) {
      newErrors.allocatedAmount = `Cannot reduce below utilized amount`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        periodAllocationId: period.periodAllocationId,
        allocatedAmount: parseFloat(formData.allocatedAmount),
        notes: formData.notes,
      };

      const response = await periodAllocationService.updatePeriodAllocation(
        payload
      );

      if (response.success) {
        toast.success("Period allocation updated successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Failed to update period allocation");
      }
    } catch (error) {
      console.error("Error updating period allocation:", error);
      toast.error(error.message || "Failed to update period allocation");
    } finally {
      setLoading(false);
    }
  };

  const amountChange =
    parseFloat(formData.allocatedAmount) - period.allocatedAmount;

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
        size="lg"
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
              <i className="bi bi-pencil-square"></i>
              Update {period.period} {period.periodYear} Allocation
            </div>
            <CloseButton
              onClick={onClose}
              disabled={loading}
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
            {/* Current Status Card */}
            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                background: '#f9fafb',
                padding: '1rem',
                marginBottom: '16px'
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <h6 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                  Current Status
                </h6>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '16px'
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Current Allocation
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#334155' }}>
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
                    Sub-Allocations
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#334155' }}>
                    {period.subAllocationCount || 0}
                  </span>
                </div>
                <div style={{
                  background: '#dcfce7',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #86efac'
                }}>
                  <span style={{ fontSize: '11px', color: '#166534', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                    Available Budget
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#166534' }}>
                    {formatCurrency(availableBudget)}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning Box */}
            {period.subAllocationCount > 0 && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffecb5',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  fontSize: '13px',
                  color: '#664d03',
                  marginBottom: '16px'
                }}
              >
                <i 
                  className="bi bi-exclamation-triangle-fill" 
                  style={{ 
                    fontSize: '16px', 
                    flexShrink: 0,
                    marginTop: '2px'
                  }}
                ></i>
                <div>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>Warning</strong>
                  <p style={{ margin: 0 }}>
                    This period has {period.subAllocationCount} sub-allocations.
                    Ensure the new amount is sufficient to cover existing
                    sub-allocations.
                  </p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* New Allocated Amount */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    fontWeight: '600',
                    fontSize: '13px',
                    color: '#334155',
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  New Allocated Amount (₹) <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                </label>
                <input
                  type="number"
                  name="allocatedAmount"
                  value={formData.allocatedAmount}
                  onChange={handleChange}
                  placeholder="Enter new amount"
                  step="0.01"
                  min={period.utilizedAmount}
                  max={availableBudget}
                  required
                  style={{
                    width: '100%',
                    border: errors.allocatedAmount ? '1px solid #ef4444' : '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '13px',
                    transition: 'all 0.2s ease',
                    backgroundColor: '#ffffff'
                  }}
                />
                {errors.allocatedAmount && (
                  <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                    {errors.allocatedAmount}
                  </div>
                )}
                {formData.allocatedAmount && !errors.allocatedAmount && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <small style={{ fontSize: '11px', color: '#22c55e' }}>
                      ✓ {formatCurrency(parseFloat(formData.allocatedAmount))}
                    </small>
                    {amountChange !== 0 && (
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: amountChange > 0 ? '#198754' : '#dc3545',
                          color: '#ffffff'
                        }}
                      >
                        {amountChange > 0 ? "+" : ""}
                        {formatCurrency(amountChange)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    fontWeight: '600',
                    fontSize: '13px',
                    color: '#334155',
                    marginBottom: '6px',
                    display: 'block'
                  }}
                >
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Update notes (optional)"
                  rows={3}
                  style={{
                    width: '100%',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '13px',
                    transition: 'all 0.2s ease',
                    resize: 'vertical',
                    minHeight: '80px',
                    maxHeight: '120px',
                    fontFamily: 'inherit',
                    lineHeight: '1.4',
                    backgroundColor: '#ffffff'
                  }}
                />
              </div>
            </form>
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
            {/* Cancel Button */}
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                background: '#6c757d',
                borderColor: '#6c757d',
                color: '#ffffff',
                fontWeight: '600',
                padding: '8px 16px',
                fontSize: '13px',
                borderRadius: '6px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.65 : 1,
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.background = '#5a6268';
                  e.target.style.borderColor = '#5a6268';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.background = '#6c757d';
                  e.target.style.borderColor = '#6c757d';
                }
              }}
            >
              Cancel
            </button>

            {/* Update Button */}
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
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
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.65 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: '14px',
                      height: '14px',
                      border: '2px solid #ffffff',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite',
                      display: 'inline-block'
                    }}
                  />
                  Updating...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle"></i>
                  Update Allocation
                </>
              )}
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

export default UpdatePeriodAllocationModal;
