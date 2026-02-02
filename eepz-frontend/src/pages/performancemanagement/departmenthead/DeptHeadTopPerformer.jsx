import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDeptHeadApprovedNominations } from "../../../services/performancemanagement/api/nominationapi";
import Breadcrumb from "../../../components/common/Breadcrumb";
import "../../../styles/performancemanagement/hr/TopPerformers.css";

const safeText = (...vals) => {
  for (const v of vals) {
    if (v !== undefined && v !== null) {
      const s = typeof v === "string" ? v.trim() : v;
      if (s !== "") return s;
    }
  }
  return "-";
};

const toArray = (v) => (Array.isArray(v) ? v : []);

export default function TopPerformers() {
  const navigate = useNavigate();
  const [nominations, setNominations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNomination, setSelectedNomination] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const deptHeadId = user?.empId ?? null;
  const breadcrumbItems = [{ label: "Top Performers" }];

  useEffect(() => {
    if (!deptHeadId) {
      navigate("/depthead/login");
      return;
    }
    fetchNominations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptHeadId]);

  const fetchNominations = async () => {
    setLoading(true);
    try {
      const response = await getDeptHeadApprovedNominations(deptHeadId);

      // axios response shape: response.data = body
      const body = response?.data;

      if (response?.status !== 200 || !body?.success) {
        setNominations([]);
        return;
      }

      /**
       * ✅ Support multiple backend response shapes:
       * 1) body.data is ARRAY of groups
       * 2) body.data.data is ARRAY of groups
       * 3) body.data.groups is ARRAY of groups
       */
      const groups =
        (Array.isArray(body?.data) && body.data) ||
        (Array.isArray(body?.data?.data) && body.data.data) ||
        (Array.isArray(body?.data?.groups) && body.data.groups) ||
        [];

      // Flatten group.nominations safely
      const allNominations = groups.flatMap((g) => toArray(g?.nominations || g?.Nominations));

      setNominations(allNominations);
    } catch (error) {
      console.error("Error fetching nominations:", error);
      setNominations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (e, nomination) => {
    e.stopPropagation();
    setSelectedNomination(nomination);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedNomination(null);
  };

  const getInitials = (nominee) => {
    if (!nominee) return "NA";
    const first = nominee?.firstName?.[0] || nominee?.FirstName?.[0] || "";
    const last = nominee?.lastName?.[0] || nominee?.LastName?.[0] || "";
    const initials = `${first}${last}`.toUpperCase();
    return initials || "NA";
  };

  const formatParameterValue = (param) => {
    if (!param) return "-";
    if (param.parameterType === "Rating") {
      return `⭐ ${param.parameterValue}/5`;
    }
    return safeText(param.parameterValue);
  };

  const nomineeFullName = (nom) =>
    safeText(nom?.nominee?.fullName, nom?.nominee?.FullName, `${nom?.nominee?.firstName || ""} ${nom?.nominee?.lastName || ""}`);

  const nomineeEmail = (nom) => safeText(nom?.nominee?.email, nom?.nominee?.Email);

  const rewardName = (nom) =>
    safeText(nom?.rewardType?.rewardName, nom?.rewardType?.RewardName, nom?.RewardType?.RewardName);

  const opportunityName = (nom) => safeText(nom?.opportunityName, nom?.OpportunityName);

  const renderDetailsModal = () => {
    if (!showModal || !selectedNomination) return null;

    const nominee = selectedNomination?.nominee;
    const parameters = toArray(selectedNomination?.parameterValues || selectedNomination?.ParameterValues);

    return (
      <div className="dtp-modal-backdrop" onClick={handleCloseModal}>
        <div className="dtp-modal-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="dtp-modal-header">
            <h2 className="dtp-modal-title">Nomination Details</h2>
          </div>

          <div className="dtp-modal-body">
            <div className="dtp-detail-row">
              <div className="dtp-detail-col">
                <label className="dtp-detail-label">NOMINEE NAME</label>
                <p className="dtp-detail-value">{nomineeFullName(selectedNomination)}</p>
              </div>

              <div className="dtp-detail-col">
                <label className="dtp-detail-label">REWARD TYPE</label>
                <p className="dtp-detail-value">{rewardName(selectedNomination)}</p>
              </div>
            </div>

            <div className="dtp-detail-section">
              <label className="dtp-detail-label">JUSTIFICATION</label>
              <div className="dtp-justification-box">{safeText(selectedNomination?.justification, selectedNomination?.Justification)}</div>
            </div>

            {parameters.length > 0 && (
              <div className="dtp-detail-section">
                <label className="dtp-detail-label">NOMINATION PARAMETERS</label>

                {parameters.map((param, idx) => (
                  <div key={idx} className="dtp-parameter-card">
                    <div className="dtp-parameter-info">
                      <p className="dtp-parameter-name">{safeText(param?.parameterName, param?.ParameterName)}</p>
                      <p className="dtp-parameter-type">{safeText(param?.parameterType, param?.ParameterType)}</p>
                    </div>
                    <div className="dtp-parameter-value">{formatParameterValue(param)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dtp-modal-footer">
            <button className="dtp-btn-close" onClick={handleCloseModal}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="dtp-loading-container">
        <div className="dtp-loading-content">
          <div className="spinner-border"></div>
          <p className="dtp-loading-text">Loading nominations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dtp-page">
      <div className="dtp-container">
        <Breadcrumb items={breadcrumbItems} />

        <div className="dtp-header">
          <h1 className="dtp-page-title">Top Performers</h1>
          <p className="dtp-page-description">{nominations.length} Approved Nominations</p>
        </div>

        {nominations.length === 0 ? (
          <div className="dtp-empty-state">
            <h3 className="dtp-empty-title">No Approved Nominations</h3>
            <p className="dtp-empty-description">There are no approved nominations in your department yet.</p>
          </div>
        ) : (
          <div className="dtp-grid">
            {nominations.map((nomination) => (
              <div key={nomination?.nominationId || nomination?.NominationId} className="dtp-nomination-card">
                <div className="dtp-employee-section">
                  <div className="dtp-avatar">{getInitials(nomination?.nominee)}</div>

                  <h3 className="dtp-employee-name">{nomineeFullName(nomination)}</h3>

                  <p className="dtp-employee-email">{nomineeEmail(nomination)}</p>
                </div>

                <div className="dtp-opportunity-box">
                  <p className="dtp-reward-type">{rewardName(nomination)}</p>
                  <p className="dtp-opportunity-name">{opportunityName(nomination)}</p>
                </div>

                <p className="dtp-justification-preview">
                  {safeText(nomination?.justification, nomination?.Justification)}
                </p>

                <button className="dtp-btn-view" onClick={(e) => handleViewDetails(e, nomination)}>
                  View Full Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {renderDetailsModal()}
    </div>
  );
}