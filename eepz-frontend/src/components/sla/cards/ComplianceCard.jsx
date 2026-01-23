import React, { useMemo } from "react";
import {
  Award,
  Calendar,
  CheckCircle,
  FileText,
  Lock,
  Unlock,
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
    if (!slaData?.length) return compliance;

    const summary = getComplianceSummary?.(slaData);

    return {
      ...(compliance ?? {}),
      totalSlas: summary?.totalSLAs ?? 0,
      closedSlas: summary?.closedSLAs ?? 0,
      openSlas: summary?.openSLAs ?? 0,
      onTimeSlas: summary?.onTimeSLAs ?? 0,
      breachedSlas: summary?.breachedSLAs ?? 0,
      compliancePercentage: summary?.compliancePercentage ?? 0,
      ratingLabel: summary?.rating ?? "",
    };
  }, [slaData, compliance]);

  if (!calculatedCompliance) {
    return (
      <div className="cc-card cc-rating-critical">
        <div className="cc-body">
          <div className="cc-empty">No compliance data available</div>
        </div>
      </div>
    );
  }

  const compliancePercentage = Number(
    calculatedCompliance?.compliancePercentage ?? 0
  );
  const rating = getComplianceRating?.(compliancePercentage);

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "N/A";

  const ratingClass = (() => {
    const label = String(rating?.label ?? rating?.rating ?? "").toLowerCase();

    if (label.includes("excellent")) return "cc-rating-excellent";
    if (label.includes("good")) return "cc-rating-good";
    if (label.includes("fair")) return "cc-rating-fair";
    if (label.includes("poor")) return "cc-rating-critical";
    if (label.includes("critical")) return "cc-rating-critical";

    if (compliancePercentage >= 90) return "cc-rating-excellent";
    if (compliancePercentage >= 75) return "cc-rating-good";
    if (compliancePercentage >= 50) return "cc-rating-fair";
    return "cc-rating-critical";
  })();

  return (
    <div className={`cc-card ${ratingClass}`} onClick={onClick}>
      <div className="cc-top" />

      <div className="cc-body">
        <div className="cc-header">
          <div>
            <h3 className="cc-title">
              {calculatedCompliance?.departmentName ?? "N/A"}
            </h3>

            <div className="cc-dates">
              <Calendar size={14} />
              <span>
                {formatDate(calculatedCompliance?.periodStartDate)} –{" "}
                {formatDate(calculatedCompliance?.periodEndDate)}
              </span>
            </div>
          </div>

          <div className="cc-badge">
            <Award size={14} />
            <span>{rating?.label ?? rating?.rating ?? "N/A"}</span>
          </div>
        </div>

        <div className="cc-rate">
          <span>Compliance Rate</span>
          <strong className="cc-rate-value">
            {Number(compliancePercentage ?? 0).toFixed(1)}%
          </strong>
        </div>

        <div className="cc-progress">
          <div
            className="cc-progress-fill"
            data-progress={Math.max(
              0,
              Math.min(100, compliancePercentage)
            ).toFixed(0)}
          />
        </div>

        <div className="cc-stats cc-stats--v2">
          <div className="cc-stat cc-stat--total">
            <div className="cc-stat-icon">
              <FileText size={18} />
            </div>
            <span>Total</span>
            <strong>{calculatedCompliance?.totalSlas ?? 0}</strong>
          </div>

          <div className="cc-stat cc-stat--closed">
            <div className="cc-stat-icon">
              <Lock size={18} />
            </div>
            <span>Closed</span>
            <strong>{calculatedCompliance?.closedSlas ?? 0}</strong>
          </div>

          <div className="cc-stat cc-stat--open">
            <div className="cc-stat-icon">
              <Unlock size={18} />
            </div>
            <span>Open</span>
            <strong>{calculatedCompliance?.openSlas ?? 0}</strong>
          </div>

          <div className="cc-stat cc-stat--ontime">
            <div className="cc-stat-icon">
              <CheckCircle size={18} />
            </div>
            <span>On-Time</span>
            <strong>{calculatedCompliance?.onTimeSlas ?? 0}</strong>
          </div>
        </div>

        {(calculatedCompliance?.openSlas ?? 0) > 0 && (
          <div className="cc-open">
            {calculatedCompliance?.openSlas ?? 0} SLA(s) currently open (not
            included in compliance %)
          </div>
        )}

        <div className="cc-updated">
          Last Updated:{" "}
          {formatDate(
            calculatedCompliance?.calculatedAt ??
              calculatedCompliance?.updatedAt
          )}
        </div>
      </div>

      {showActions && typeof onClick === "function" && (
        <div className="cc-footer">
          <button className="cc-action" type="button">
            View Details
          </button>
        </div>
      )}
    </div>
  );
};

export default ComplianceCard;
