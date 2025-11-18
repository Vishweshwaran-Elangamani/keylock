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
  //  Calculate compliance from real SLA data if provided
  const calculatedCompliance = useMemo(() => {
    if (!slaData || slaData.length === 0) return compliance;

    const summary = getComplianceSummary(slaData);

    // Merge with original compliance data
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

  //  Handle null/undefined compliance
  if (!calculatedCompliance) {
    return (
      <div
        className="card h-100 border-0 shadow-sm"
        style={{ borderRadius: "12px" }}
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

  //  Use calculated values
  const openSlas = calculatedCompliance.openSlas || 0;
  const closedSlas = calculatedCompliance.closedSlas || 0;
  const onTimeSlas = calculatedCompliance.onTimeSlas || 0;
  const breachedSlas = calculatedCompliance.breachedSlas || 0;
  const extendedSlas = calculatedCompliance.extendedSlas || 0;

  return (
    <div
      className="card h-100 border-0 shadow-sm"
      style={{
        borderRadius: "12px",
        transition: "all 0.3s ease",
        cursor: onClick ? "pointer" : "default",
        border: `2px solid ${rating.color}15`,
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
        }
      }}
    >
      {/* Colored Top Border */}
      <div
        style={{
          height: "4px",
          background: `linear-gradient(90deg, ${rating.color}, ${rating.color}CC)`,
        }}
      />

      <div className="card-body p-4">
        {/* Header Section */}
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
            <div className="d-flex align-items-center gap-2"></div>
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

        {/* Compliance Rate Section */}
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

        {/* Stats Grid - Closed SLAs Breakdown */}
        <div className="row g-3 mb-3">
          <div className="col-6">
            <div
              className="d-flex align-items-center gap-2 p-3 rounded"
              style={{ backgroundColor: "#24A14808" }}
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: "36px",
                  height: "36px",
                  backgroundColor: "#24A14815",
                }}
              >
                <CheckCircle size={18} color="#24A148" strokeWidth={2.5} />
              </div>
              <div className="flex-grow-1">
                <small
                  className="text-muted d-block"
                  style={{ fontSize: "0.7rem" }}
                >
                  On Time
                </small>
                <strong
                  className="d-block"
                  style={{ fontSize: "1rem", color: "#24A148" }}
                >
                  {onTimeSlas}
                </strong>
              </div>
            </div>
          </div>

          <div className="col-6">
            <div
              className="d-flex align-items-center gap-2 p-3 rounded"
              style={{ backgroundColor: "#E0195008" }}
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: "36px",
                  height: "36px",
                  backgroundColor: "#E0195015",
                }}
              >
                <AlertCircle size={18} color="#E01950" strokeWidth={2.5} />
              </div>
              <div className="flex-grow-1">
                <small
                  className="text-muted d-block"
                  style={{ fontSize: "0.7rem" }}
                >
                  Breached
                </small>
                <strong
                  className="d-block"
                  style={{ fontSize: "1rem", color: "#E01950" }}
                >
                  {breachedSlas}
                </strong>
              </div>
            </div>
          </div>

          <div className="col-6">
            <div
              className="d-flex align-items-center gap-2 p-3 rounded"
              style={{ backgroundColor: "#E2B93B08" }}
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: "36px",
                  height: "36px",
                  backgroundColor: "#E2B93B15",
                }}
              >
                <Clock size={18} color="#E2B93B" strokeWidth={2.5} />
              </div>
              <div className="flex-grow-1">
                <small
                  className="text-muted d-block"
                  style={{ fontSize: "0.7rem" }}
                >
                  Extended
                </small>
                <strong
                  className="d-block"
                  style={{ fontSize: "1rem", color: "#E2B93B" }}
                >
                  {extendedSlas}
                </strong>
              </div>
            </div>
          </div>

          <div className="col-6">
            <div
              className="d-flex align-items-center gap-2 p-3 rounded"
              style={{ backgroundColor: "#0F62FE08" }}
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: "36px",
                  height: "36px",
                  backgroundColor: "#0F62FE15",
                }}
              >
                <TrendingUp size={18} color="#0F62FE" strokeWidth={2.5} />
              </div>
              <div className="flex-grow-1">
                <small
                  className="text-muted d-block"
                  style={{ fontSize: "0.7rem" }}
                >
                  Total
                </small>
                <strong
                  className="d-block"
                  style={{ fontSize: "1rem", color: "#0F62FE" }}
                >
                  {closedSlas}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Open SLAs Info */}
        {openSlas > 0 && (
          <div
            className="alert alert-info py-2 px-3 mb-3 d-flex align-items-center gap-2"
            style={{
              fontSize: "0.813rem",
              borderRadius: "8px",
              backgroundColor: "#0F62FE08",
              border: "1px solid #0F62FE30",
            }}
          >
            <Clock size={16} color="#0F62FE" />
            <span>
              <strong>{openSlas}</strong> SLA(s) currently open (not included in
              compliance %)
            </span>
          </div>
        )}

        {/* Last Updated */}
        <div className="text-muted small mb-0" style={{ fontSize: "0.75rem" }}>
          <Clock size={12} className="me-1" />
          Last Updated:{" "}
          {formatDate(
            calculatedCompliance.calculatedAt || calculatedCompliance.updatedAt
          )}
        </div>
      </div>

      {/* Action Button Footer */}
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

      {/* Hover Footer (when no actions) */}
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
