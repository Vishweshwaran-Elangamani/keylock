import React, { useMemo } from "react";
import {
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Award,
  Eye,
  Calendar,
} from "lucide-react";
import {
  getComplianceRating,
  getComplianceSummary,
} from "../../../utils/sla/slaCalculations";

const ComplianceCard = ({
  compliance,
  slaData,
  onClick,
  showActions = false,
}) => {
  const calculatedCompliance = useMemo(() => {
    if (!slaData || slaData.length === 0) return compliance;

    const summary = getComplianceSummary(slaData);

    return {
      ...compliance,
      totalSlas: summary.totalSLAs,
      closedSlas: summary.closedSLAs,
      openSlas: summary.openSLAs,
      onTimeSlas: summary.onTimeSLAs,
      breachedSlas: summary.breachedSLAs,
      extendedSlas: slaData.filter(
        (s) => s.status === "Closed" && s.complianceStatus === "Extended"
      ).length,
      compliancePercentage: summary.compliancePercentage,
      ratingLabel: summary.rating,
    };
  }, [slaData, compliance]);

  if (!calculatedCompliance) {
    return (
      <div
        className="card h-100"
        style={{
          borderRadius: "12px",
          border: "1.5px solid #27235C",
        }}
      >
        <div className="card-body text-center py-5">
          <p className="text-muted">No compliance data available</p>
        </div>
      </div>
    );
  }

  const rating = getComplianceRating(
    calculatedCompliance.compliancePercentage || 0
  );

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const openSlas = calculatedCompliance.openSlas || 0;
  const closedSlas = calculatedCompliance.closedSlas || 0;
  const onTimeSlas = calculatedCompliance.onTimeSlas || 0;
  const breachedSlas = calculatedCompliance.breachedSlas || 0;
  const extendedSlas = calculatedCompliance.extendedSlas || 0;

  return (
    <div
      className="card h-100"
      style={{
        borderRadius: "12px",
        border: "1.5px solid #27235C",
        backgroundColor: "#FFFFFF",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        transition: "all 0.2s ease",
        cursor: onClick ? "pointer" : "default",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.borderColor = "#0F62FE";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(39, 35, 92, 0.1)";
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.borderColor = "#27235C";
          e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
        }
      }}
    >
      <div
        style={{
          height: "4px",
          background: `linear-gradient(90deg, ${rating.color}, ${rating.color}CC)`,
        }}
      />

      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div className="flex-grow-1">
            <h5
              className="card-title mb-1 fw-bold"
              style={{
                color: "var(--color-primary-1)",
                fontSize: "1.1rem",
              }}
            >
              {calculatedCompliance.departmentName || "Department"}
            </h5>
            <div className="d-flex align-items-center gap-2 mt-1">
              <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                <Calendar size={12} className="me-1" />
                {formatDate(calculatedCompliance.periodStartDate)} -{" "}
                {formatDate(calculatedCompliance.periodEndDate)}
              </small>
            </div>
          </div>
          <div
            className="badge d-flex align-items-center gap-1"
            style={{
              backgroundColor: `${rating.color}15`,
              color: rating.color,
              padding: "0.5rem 0.875rem",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "0.813rem",
              border: `1px solid ${rating.color}30`,
            }}
          >
            <Award size={14} />
            {rating.label}
          </div>
        </div>

        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-end mb-2">
            <span className="text-muted small">Compliance Rate</span>
            <div className="d-flex align-items-baseline gap-1">
              <span
                className="fw-bold"
                style={{
                  fontSize: "2rem",
                  color: rating.color,
                  lineHeight: 1,
                }}
              >
                {(calculatedCompliance.compliancePercentage || 0).toFixed(1)}
              </span>
              <span className="text-muted small">%</span>
            </div>
          </div>
          <div
            className="progress"
            style={{
              height: "10px",
              borderRadius: "10px",
              backgroundColor: "#f0f0f0",
            }}
          >
            <div
              className="progress-bar"
              role="progressbar"
              style={{
                width: `${calculatedCompliance.compliancePercentage || 0}%`,
                background: `linear-gradient(90deg, ${rating.color}, ${rating.color}DD)`,
                borderRadius: "10px",
                transition: "width 0.6s ease",
              }}
              aria-valuenow={calculatedCompliance.compliancePercentage || 0}
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-6">
            <div
              className="d-flex align-items-center gap-3 p-3 rounded-3"
              style={{ backgroundColor: "#D1FAE5" }}
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: "#10B981",
                  flexShrink: 0,
                }}
              >
                <CheckCircle size={20} color="#FFFFFF" />
              </div>
              <div>
                <p className="mb-0" style={{ fontSize: "0.75rem", color: "#047857", fontWeight: 500 }}>
                  On Time
                </p>
                <h4 className="mb-0 fw-bold" style={{ fontSize: "1.5rem", color: "#10B981" }}>
                  {onTimeSlas}
                </h4>
              </div>
            </div>
          </div>

          <div className="col-6">
            <div
              className="d-flex align-items-center gap-3 p-3 rounded-3"
              style={{ backgroundColor: "#FEE2E2" }}
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: "#EF4444",
                  flexShrink: 0,
                }}
              >
                <AlertCircle size={20} color="#FFFFFF" />
              </div>
              <div>
                <p className="mb-0" style={{ fontSize: "0.75rem", color: "#991B1B", fontWeight: 500 }}>
                  Breached
                </p>
                <h4 className="mb-0 fw-bold" style={{ fontSize: "1.5rem", color: "#EF4444" }}>
                  {breachedSlas}
                </h4>
              </div>
            </div>
          </div>

          <div className="col-6">
            <div
              className="d-flex align-items-center gap-3 p-3 rounded-3"
              style={{ backgroundColor: "#FEF3C7" }}
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: "#F59E0B",
                  flexShrink: 0,
                }}
              >
                <Clock size={20} color="#FFFFFF" />
              </div>
              <div>
                <p className="mb-0" style={{ fontSize: "0.75rem", color: "#92400E", fontWeight: 500 }}>
                  Extended
                </p>
                <h4 className="mb-0 fw-bold" style={{ fontSize: "1.5rem", color: "#F59E0B" }}>
                  {extendedSlas}
                </h4>
              </div>
            </div>
          </div>

          <div className="col-6">
            <div
              className="d-flex align-items-center gap-3 p-3 rounded-3"
              style={{ backgroundColor: "#E8F1FF" }}
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: "#5B93FF",
                  flexShrink: 0,
                }}
              >
                <TrendingUp size={20} color="#FFFFFF" />
              </div>
              <div>
                <p className="mb-0" style={{ fontSize: "0.75rem", color: "#1E40AF", fontWeight: 500 }}>
                  Total
                </p>
                <h4 className="mb-0 fw-bold" style={{ fontSize: "1.5rem", color: "#5B93FF" }}>
                  {closedSlas}
                </h4>
              </div>
            </div>
          </div>
        </div>

        {openSlas > 0 && (
          <div
            className="alert mb-3 d-flex align-items-center gap-2"
            style={{
              fontSize: "0.813rem",
              borderRadius: "8px",
              backgroundColor: "#EFF6FF",
              border: "1px solid #DBEAFE",
              padding: "0.75rem 1rem",
              color: "#1E40AF",
            }}
          >
            <Clock size={16} />
            <span>
              <strong>{openSlas}</strong> SLA(s) currently open (not included in
              compliance %)
            </span>
          </div>
        )}

        <div className="text-muted small mb-0 text-center" style={{ fontSize: "0.75rem" }}>
          <Clock size={12} className="me-1" />
          Last Updated:{" "}
          {formatDate(
            calculatedCompliance.calculatedAt || calculatedCompliance.updatedAt
          )}
        </div>
      </div>

      {showActions && onClick && (
        <div
          className="card-footer bg-white border-top pt-3 pb-3 px-4"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="btn btn-outline-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            style={{ borderRadius: "8px" }}
          >
            <Eye size={14} />
            View Details
          </button>
        </div>
      )}

      {!showActions && onClick && (
        <div
          className="card-footer bg-transparent border-top-0 text-center py-2"
          style={{
            fontSize: "0.813rem",
            color: "var(--color-primary-3)",
            fontWeight: 500,
          }}
        >
          Click to view details →
        </div>
      )}
    </div>
  );
};

export default ComplianceCard;
