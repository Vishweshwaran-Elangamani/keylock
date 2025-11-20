import React, { useState } from "react";
import { Modal, CloseButton } from "react-bootstrap";
import { toast } from "sonner";
import periodAllocationService from "../../../services/hr_operations/hr/periodAllocationService";
import { formatCurrency } from "../../../utils/auth/currencyFormatter";

const CreatePeriodAllocationModal = ({ budget, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    period: "Q1",
    periodYear: new Date().getFullYear(),
    allocatedAmount: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Calculate available budget
  const availableBudget = budget.totalBudget - (budget.allocatedAmount || 0);

  const periods = [
    { value: "Q1", label: "Q1 - Quarter 1" },
    { value: "Q2", label: "Q2 - Quarter 2" },
    { value: "Q3", label: "Q3 - Quarter 3" },
    { value: "Q4", label: "Q4 - Quarter 4" },
    { value: "H1", label: "H1 - Half Year 1" },
    { value: "H2", label: "H2 - Half Year 2" },
  ];

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
        period: formData.period,
        periodYear: parseInt(formData.periodYear),
        allocatedAmount: parseFloat(formData.allocatedAmount),
        allocatedByUserId: parseInt(userId),
        notes: formData.notes,
      };

      const response = await periodAllocationService.createPeriodAllocation(
        payload
      );

      if (response.success) {
        toast.success("Period allocation created successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Failed to create period allocation");
      }
    } catch (error) {
      console.error("Error creating period allocation:", error);
      toast.error(error.message || "Failed to create period allocation");
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
              <i className="bi bi-calendar-plus"></i>
              Create Period Allocation
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
            {/* Budget Summary Card */}
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
                <h5 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                  {budget.departmentName}
                </h5>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '16px'
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Total Budget
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#334155' }}>
                    {formatCurrency(budget.totalBudget)}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Already Allocated
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#dc3545' }}>
                    {formatCurrency(budget.allocatedAmount || 0)}
                  </span>
                </div>
                <div style={{
                  background: '#dcfce7',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #86efac'
                }}>
                  <span style={{ fontSize: '11px', color: '#166534', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                    Available to Allocate
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#166534' }}>
                    {formatCurrency(availableBudget)}
                  </span>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Period and Year Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px',
                  marginBottom: '16px'
                }}
              >
                {/* Period */}
                <div>
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
                    Period <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                  </label>
                  <select
                    name="period"
                    value={formData.period}
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
                    {periods.map((period) => (
                      <option key={period.value} value={period.value}>
                        {period.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year */}
                <div>
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
                    Year <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                  </label>
                  <select
                    name="periodYear"
                    value={formData.periodYear}
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
                    {[2024, 2025, 2026, 2027].map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Allocated Amount */}
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
                  Allocated Amount (₹) <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                </label>
                <input
                  type="number"
                  name="allocatedAmount"
                  value={formData.allocatedAmount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  step="0.01"
                  min="0"
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
                  <small style={{ fontSize: '11px', color: '#22c55e', marginTop: '4px', display: 'block' }}>
                    ✓ {formatCurrency(parseFloat(formData.allocatedAmount))}
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
                  placeholder="Add notes about this allocation (optional)"
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
                  Create Period Allocation
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

export default CreatePeriodAllocationModal;
