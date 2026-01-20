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
import "../../../styles/sla/components/ComplianceCard.css";

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
      <div className="sla-compliance-card">
        <div className="sla-compliance-empty">No compliance data available</div>
      </div>
    );
  }

  const rating = getComplianceRating(
    calculatedCompliance.compliancePercentage || 0
  );

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "N/A";

  return (
    <div
      className="sla-compliance-card"
      onClick={onClick}
    >
      <div
        className="sla-compliance-top-bar"
        style={{ backgroundColor: rating.color }}
      />

      <div className="sla-compliance-body">
        <div className="sla-compliance-header">
          <div>
            <h3 className="sla-compliance-title">
              {calculatedCompliance.departmentName}
            </h3>
            <div className="sla-compliance-date">
              <Calendar size={14} />
              {formatDate(calculatedCompliance.periodStartDate)} –{" "}
              {formatDate(calculatedCompliance.periodEndDate)}
            </div>
          </div>

          <span
            className="sla-compliance-badge"
            style={{
              color: rating.color,
              borderColor: rating.color,
              backgroundColor: `${rating.color}15`,
            }}
          >
            <Award size={14} />
            {rating.label}
          </span>
        </div>

        <div className="sla-compliance-rate">
          <span>Compliance Rate</span>
          <strong style={{ color: rating.color }}>
            {calculatedCompliance.compliancePercentage.toFixed(1)}%
          </strong>
        </div>

        <div className="sla-compliance-progress">
          <div
            className="sla-compliance-progress-fill"
            style={{
              width: `${calculatedCompliance.compliancePercentage}%`,
              backgroundColor: rating.color,
            }}
          />
        </div>

        <div className="sla-compliance-stats">
          <div className="sla-stat green">
            <CheckCircle />
            <span>On Time</span>
            <strong>{calculatedCompliance.onTimeSlas}</strong>
          </div>

          <div className="sla-stat red">
            <AlertCircle />
            <span>Breached</span>
            <strong>{calculatedCompliance.breachedSlas}</strong>
          </div>

          <div className="sla-stat amber">
            <Clock />
            <span>Extended</span>
            <strong>{calculatedCompliance.extendedSlas}</strong>
          </div>

          <div className="sla-stat blue">
            <TrendingUp />
            <span>Total</span>
            <strong>{calculatedCompliance.closedSlas}</strong>
          </div>
        </div>

        {calculatedCompliance.openSlas > 0 && (
          <div className="sla-compliance-open">
            <Clock size={14} />
            {calculatedCompliance.openSlas} SLA(s) currently open (not included
            in compliance %)
          </div>
        )}

        <div className="sla-compliance-updated">
          <Clock size={12} />
          Last Updated:{" "}
          {formatDate(
            calculatedCompliance.calculatedAt ||
              calculatedCompliance.updatedAt
          )}
        </div>
      </div>

      {showActions && onClick && (
        <div className="sla-compliance-footer">
          <button className="sla-compliance-action">
            <Eye size={14} /> View Details
          </button>
        </div>
      )}
    </div>
  );
};

export default ComplianceCard;
