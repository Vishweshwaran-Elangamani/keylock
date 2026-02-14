import React, { useState, useEffect } from "react";
import momService from "../../../services/meeting/momService";
import toastr from "toastr";
import MomDetailsView from "./MomDetailsView";
import {
  Share2,
  Inbox,
  Eye,
  Calendar,
  Users,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import "../../../styles/mom/modals/SharedMomsModal.css";

const SharedMomsModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("sharedByMe");
  const [sharedByMeMoms, setSharedByMeMoms] = useState([]);
  const [sharedWithMeMoms, setSharedWithMeMoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMom, setSelectedMom] = useState(null);
  const [error, setError] = useState(null);

  const getProperty = (obj, camelKey, pascalKey) => {
    return obj?.[camelKey] ?? obj?.[pascalKey] ?? null;
  };

  useEffect(() => {
    loadSharedMoms();
  }, [activeTab]);

  const loadSharedMoms = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      setError(null);

      if (activeTab === "sharedByMe") {
        const response = await momService.getMomsSharedByMe();

        let momsData = null;
        if (response?.success && response?.data) {
          momsData = response.data;
        } else if (response?.Success && response?.Data) {
          momsData = response.Data;
        } else if (response?.data) {
          momsData = response.data;
        } else if (response?.Data) {
          momsData = response.Data;
        } else if (Array.isArray(response)) {
          momsData = response;
        }

        const rows = Array.isArray(momsData) ? momsData : [];

        const withDetails = await Promise.all(
          rows.map(async (row) => {
            try {
              const momId =
                getProperty(row, "momId", "MomId") ||
                getProperty(row, "momID", "MOMID");

              if (!momId) {
                console.warn("No momId found for shared row:", row);
                return { ...row, fullMom: null };
              }

              const momRes = await momService.getMomById(momId);

              let fullMom = null;
              if (momRes?.success && momRes?.data) {
                fullMom = momRes.data;
              } else if (momRes?.Success && momRes?.Data) {
                fullMom = momRes.Data;
              } else if (momRes?.data) {
                fullMom = momRes.data;
              } else if (momRes?.Data) {
                fullMom = momRes.Data;
              } else {
                fullMom = momRes;
              }

              return {
                ...row,
                fullMom: fullMom,
              };
            } catch (e) {
              console.error(
                "Failed to load full MOM for sharedByMe row",
                getProperty(row, "momId", "MomId"),
                e,
              );
              return { ...row, fullMom: null };
            }
          }),
        );

        setSharedByMeMoms(withDetails);
      } else {
        const response = await momService.getMomsSharedWithMe();

        let momsData = null;
        if (response?.success && response?.data) {
          momsData = response.data;
        } else if (response?.Success && response?.Data) {
          momsData = response.Data;
        } else if (response?.data) {
          momsData = response.data;
        } else if (response?.Data) {
          momsData = response.Data;
        } else if (Array.isArray(response)) {
          momsData = response;
        }

        const rows = Array.isArray(momsData) ? momsData : [];
        setSharedWithMeMoms(rows);
      }
    } catch (error) {
      console.error("Load shared MOMs error:", error);

      if (error.retryAfter) {
        if (!silent) {
          setError(
            `Rate limit exceeded. Please wait ${error.retryAfter} seconds.`,
          );
          toastr.error(
            `Rate limit exceeded. Please wait ${error.retryAfter} seconds.`,
          );
        }
      } else if (error.message) {
        setError(error.message);
        if (!silent) toastr.error(error.message);
      } else {
        setError("Failed to load shared MOMs");
        if (!silent) toastr.error("Failed to load shared MOMs");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleViewMom = async (momId) => {
    try {
      const response = await momService.getMomById(momId);

      let momData = null;
      if (response?.success && response?.data) {
        momData = response.data;
      } else if (response?.Success && response?.Data) {
        momData = response.Data;
      } else if (response?.data) {
        momData = response.data;
      } else if (response?.Data) {
        momData = response.Data;
      } else {
        momData = response;
      }

      if (!momData) {
        throw new Error("No MOM data received");
      }

      setSelectedMom(momData);
    } catch (error) {
      console.error("Failed to load MOM details:", error);

      if (error.retryAfter) {
        toastr.error(
          `Rate limit exceeded. Please wait ${error.retryAfter} seconds.`,
        );
      } else if (error.message) {
        toastr.error(`Failed to load MOM details: ${error.message}`);
      } else {
        toastr.error("Failed to load MOM details");
      }
    }
  };

  const currentMoms =
    activeTab === "sharedByMe" ? sharedByMeMoms : sharedWithMeMoms;

  const getMeetingTitle = (row) => {
    let title = getProperty(row, "meetingTitle", "MeetingTitle");

    if (!title && row.fullMom) {
      title = getProperty(row.fullMom, "meetingTitle", "MeetingTitle");
    }

    if (!title && row.mom) {
      title = getProperty(row.mom, "meetingTitle", "MeetingTitle");
    }

    if (!title && row.Mom) {
      title = getProperty(row.Mom, "meetingTitle", "MeetingTitle");
    }

    return title || "Untitled Meeting";
  };

  const getMeetingType = (row) => {
    let type = getProperty(row, "meetingType", "MeetingType");

    if (!type && row.fullMom) {
      type = getProperty(row.fullMom, "meetingType", "MeetingType");
    }

    if (!type && row.mom) {
      type = getProperty(row.mom, "meetingType", "MeetingType");
    }

    if (!type && row.Mom) {
      type = getProperty(row.Mom, "meetingType", "MeetingType");
    }

    return type || "Other";
  };

  const getMeetingDate = (row) => {
    let date = getProperty(row, "meetingDate", "MeetingDate");

    if (!date && row.fullMom) {
      date = getProperty(row.fullMom, "meetingDate", "MeetingDate");
    }

    if (!date && row.mom) {
      date = getProperty(row.mom, "meetingDate", "MeetingDate");
    }

    if (!date && row.Mom) {
      date = getProperty(row.Mom, "meetingDate", "MeetingDate");
    }

    return date;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  return (
    <>
      <div
        className="smm-overlay modal fade show d-block smm-modal-open"
        tabIndex="-1"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shared-moms-title"
      >
        <div
          className="smm-dialog modal-dialog modal-dialog-centered modal-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="smm-content modal-content border-0 shadow-lg">
            <div className="smm-header modal-header border-0">
              <div className="w-100 smm-header-left">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5
                    id="shared-moms-title"
                    className="smm-title modal-title fw-bold mb-0"
                  >
                    Shared MOMs
                  </h5>
                </div>

                <ul className="smm-tabs nav nav-pills">
                  <li className="nav-item smm-tabs-item">
                    <button
                      type="button"
                      className={`smm-tab-btn ${
                        activeTab === "sharedByMe" ? "smm-tab-active" : ""
                      }`}
                      onClick={() => setActiveTab("sharedByMe")}
                    >
                      <Share2 size={16} className="me-2" />
                      Shared By Me
                    </button>

                    <button
                      type="button"
                      className={`smm-tab-btn smm-tab-btn-gap ${
                        activeTab === "sharedWithMe" ? "smm-tab-active" : ""
                      }`}
                      onClick={() => setActiveTab("sharedWithMe")}
                    >
                      <Inbox size={16} className="me-2" />
                      Shared With Me
                    </button>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
                aria-label="Close"
              />
            </div>

            <div className="smm-body modal-body p-0">
              {error && (
                <div className="alert alert-danger m-3 d-flex align-items-center gap-2">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-muted mt-3">Loading shared MOMs...</p>
                </div>
              ) : currentMoms.length === 0 ? (
                <div className="text-center py-5">
                  <div className="smm-empty-icon mb-3">
                    {activeTab === "sharedByMe" ? (
                      <Share2 size={48} className="text-muted" />
                    ) : (
                      <Inbox size={48} className="text-muted" />
                    )}
                  </div>
                  <h6 className="fw-semibold text-muted mb-2">
                    No {activeTab === "sharedByMe" ? "shared" : "received"} MOMs
                    found
                  </h6>
                  <p className="text-muted small">
                    {activeTab === "sharedByMe"
                      ? "You haven't shared any MOMs yet"
                      : "No MOMs have been shared with you"}
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0 smm-table">
                    <thead className="smm-thead">
                      <tr className="smm-header-row">
                        <th className="px-4 py-3 fw-semibold smm-th">
                          Meeting Title
                        </th>
                        <th className="px-4 py-3 fw-semibold smm-th">Type</th>
                        <th className="px-4 py-3 fw-semibold smm-th">
                          Meeting Date
                        </th>
                        <th className="px-4 py-3 fw-semibold smm-th">
                          Shared Date
                        </th>
                        <th className="px-4 py-3 fw-semibold smm-th">
                          {activeTab === "sharedByMe"
                            ? "Shared With"
                            : "Shared By"}
                        </th>
                        <th className="px-4 py-3 fw-semibold text-center smm-th">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {currentMoms.map((mom, index) => {
                        const momId =
                          getProperty(mom, "momId", "MomId") ||
                          getProperty(mom, "momID", "MOMID");
                        const meetingTitle = getMeetingTitle(mom);
                        const meetingType = getMeetingType(mom);
                        const meetingDate = getMeetingDate(mom);
                        const sharedAt =
                          getProperty(mom, "sharedAt", "SharedAt") ||
                          getProperty(mom, "sharedDate", "SharedDate") ||
                          getProperty(mom, "createdAt", "CreatedAt") ||
                          getProperty(mom, "createdOn", "CreatedOn") ||
                          getProperty(mom, "sharedOn", "SharedOn");

                        const sharedWithName = getProperty(
                          mom,
                          "sharedWithEmployeeName",
                          "SharedWithEmployeeName",
                        );
                        const sharedByName =
                          getProperty(
                            mom,
                            "sharedByEmployeeName",
                            "SharedByEmployeeName",
                          ) ||
                          getProperty(
                            mom,
                            "submittedByEmployeeName",
                            "SubmittedByEmployeeName",
                          );

                        return (
                          <tr
                            key={`shared-mom-${activeTab}-${momId}-${index}`}
                            className="smm-row"
                          >
                            <td
                              className="px-4 py-3 smm-td smm-td-clickable"
                              onClick={() => handleViewMom(momId)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) =>
                                e.key === "Enter" && handleViewMom(momId)
                              }
                            >
                              <div className="fw-semibold smm-title-cell">
                                {meetingTitle}
                              </div>
                              {meetingDate && (
                                <small className="text-muted smm-subtext d-flex align-items-center gap-1 mt-1">
                                  <Calendar size={12} />
                                  {formatDate(meetingDate)}
                                </small>
                              )}
                            </td>

                            <td className="px-4 py-3 smm-td">
                              <span className="badge bg-primary-subtle text-primary">
                                {meetingType}
                              </span>
                            </td>

                            <td className="px-4 py-3 smm-td">
                              {formatDate(meetingDate)}
                            </td>

                            <td className="px-4 py-3 smm-td">
                              {formatDate(sharedAt)}
                            </td>

                            <td className="px-4 py-3 smm-td">
                              <div className="d-flex align-items-center gap-2">
                                <Users size={16} className="text-muted" />
                                <span className="smm-subtext">
                                  {activeTab === "sharedByMe"
                                    ? sharedWithName || "Unknown"
                                    : sharedByName || "Unknown"}
                                </span>
                              </div>
                            </td>

                            <td className="px-4 py-3 text-center smm-td">
                              <button
                                type="button"
                                className="smm-view-btn btn btn-sm btn-outline-primary d-flex align-items-center gap-1 mx-auto"
                                onClick={() => handleViewMom(momId)}
                                aria-label={`View ${meetingTitle}`}
                              >
                                <Eye size={14} />
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="smm-footer modal-footer border-0">
              <span className="smm-footer-text text-muted small me-auto">
                Showing {currentMoms.length}{" "}
                {activeTab === "sharedByMe" ? "shared" : "received"} MOM
                {currentMoms.length !== 1 ? "s" : ""}
              </span>

              <button
                type="button"
                className="smm-close-btn btn btn-secondary px-4"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedMom && (
        <MomDetailsView
          mom={selectedMom}
          onClose={() => setSelectedMom(null)}
        />
      )}
    </>
  );
};

export default SharedMomsModal;
