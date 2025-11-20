import React, { useState } from "react";
import { Modal, CloseButton } from "react-bootstrap";
import { toast } from "sonner";
import budgetAllocationService from "../../../services/hr_operations/hr/budgetAllocationService";
import { formatCurrency } from "../../../utils/auth/currencyFormatter";

const AllocateFromPeriodModal = ({ period, budget, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    allocationType: "Training",
    amount: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const allocationTypes = [
    "Training",
    "Promotion",
    "Bonus",
    "Recruitment",
    "Equipment",
    "Software",
    "Travel",
    "Other",
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Please enter a valid amount";
    }

    if (parseFloat(formData.amount) > period.remainingAmount) {
      newErrors.amount = `Amount exceeds remaining period allocation`;
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
      const userId = localStorage.getItem("userId");

      const payload = {
        budgetId: budget.budgetId,
        departmentId: budget.departmentId,
        allocationType: formData.allocationType,
        amount: parseFloat(formData.amount),
        notes: formData.notes,
        allocatedByUserId: parseInt(userId),
        period: period.period,
        periodYear: period.periodYear,
      };

      const response =
        await budgetAllocationService.createFundAllocationFromPeriod(payload);

      if (response.success) {
        toast.success("Sub-allocation created successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Failed to create sub-allocation");
      }
    } catch (error) {
      console.error("Error creating sub-allocation:", error);
      toast.error(error.message || "Failed to create sub-allocation");
    } finally {
      setLoading(false);
    }
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
              <i className="bi bi-plus-circle"></i>
              Sub-Allocate from {period.period} {period.periodYear}
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
            {/* Period Summary Card */}
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
                  {budget.departmentName}
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
                    Period
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#334155' }}>
                    {period.period} {period.periodYear}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Period Allocation
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#334155' }}>
                    {formatCurrency(period.allocatedAmount)}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Already Sub-Allocated
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#dc3545' }}>
                    {formatCurrency(
                      period.allocatedAmount - period.remainingAmount
                    )}
                  </span>
                </div>
                <div style={{
                  background: '#dcfce7',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #86efac'
                }}>
                  <span style={{ fontSize: '11px', color: '#166534', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                    Available for Sub-Allocation
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#166534' }}>
                    {formatCurrency(period.remainingAmount)}
                  </span>
                </div>
              </div>

              {/* Progress Section */}
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <small style={{ fontSize: '11px', color: '#64748b' }}>
                    Sub-Allocation Progress
                  </small>
                  <small style={{ fontSize: '11px', color: '#64748b' }}>
                    {period.subAllocationCount || 0} sub-allocations
                  </small>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      width: `${
                        ((period.allocatedAmount - period.remainingAmount) /
                          period.allocatedAmount) *
                        100
                      }%`,
                      height: '100%',
                      backgroundColor: '#0d6efd',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Allocation Type */}
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
                  Allocation Type <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                </label>
                <select
                  name="allocationType"
                  value={formData.allocationType}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '13px',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    backgroundColor: '#ffffff'
                  }}
                >
                  {allocationTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <small style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Select the purpose of this allocation
                </small>
              </div>

              {/* Amount */}
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
                  Amount (₹) <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  step="0.01"
                  min="0"
                  max={period.remainingAmount}
                  required
                  style={{
                    width: '100%',
                    border: errors.amount ? '1px solid #ef4444' : '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '13px',
                    transition: 'all 0.2s ease',
                    backgroundColor: '#ffffff'
                  }}
                />
                {errors.amount && (
                  <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                    {errors.amount}
                  </div>
                )}
                {formData.amount && !errors.amount && (
                  <small style={{ fontSize: '11px', color: '#22c55e', marginTop: '4px', display: 'block' }}>
                    ✓ {formatCurrency(parseFloat(formData.amount))} • Remaining:{" "}
                    {formatCurrency(
                      period.remainingAmount - parseFloat(formData.amount)
                    )}
                  </small>
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
                  placeholder="Add notes about this sub-allocation (optional)"
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

              {/* Info Alert */}
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#d1ecf1',
                  border: '1px solid #bee5eb',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  fontSize: '13px',
                  color: '#0c5460',
                  marginBottom: '16px'
                }}
              >
                <i 
                  className="bi bi-info-circle-fill" 
                  style={{ 
                    fontSize: '16px', 
                    flexShrink: 0,
                    marginTop: '2px'
                  }}
                ></i>
                <div>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>
                    Sub-Allocation from Period
                  </strong>
                  <p style={{ margin: 0 }}>
                    This will create a fund allocation linked to{" "}
                    <strong>
                      {period.period} {period.periodYear}
                    </strong>
                    . The department head can then update utilization for this
                    allocation.
                  </p>
                </div>
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

            {/* Create Button */}
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
                  Creating...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle"></i>
                  Create Sub-Allocation
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

export default AllocateFromPeriodModal;
