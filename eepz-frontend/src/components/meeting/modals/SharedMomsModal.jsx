import React, { useState, useEffect } from "react";
import momService from "../../../services/meeting/momService";
import toastr from "toastr";
import MomDetailsView from "./MomDetailsView";
import "../../../styles/mom/modals/SharedMomsModal.css";

const PRIMARY = "#27235C";

const SharedMomsModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("sharedByMe");
  const [sharedByMeMoms, setSharedByMeMoms] = useState([]);
  const [sharedWithMeMoms, setSharedWithMeMoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMom, setSelectedMom] = useState(null);

  useEffect(() => {
    loadSharedMoms();
  }, [activeTab]);

  const loadSharedMoms = async () => {
    setLoading(true);
    try {
      if (activeTab === "sharedByMe") {
        const response = await momService.getMomsSharedByMe();
        const rows = response.data || [];

        const withDetails = await Promise.all(
          rows.map(async (row) => {
            try {
              const momRes = await momService.getMomById(row.momId);
              return {
                ...row,
                fullMom: momRes.data || null,
              };
            } catch (e) {
              console.error(
                "Failed to load full MOM for sharedByMe row",
                row.momId,
                e
              );
              return { ...row, fullMom: null };
            }
          })
        );

        setSharedByMeMoms(withDetails);
      } else {
        const response = await momService.getMomsSharedWithMe();
        setSharedWithMeMoms(response.data || []);
      }
    } catch (error) {
      toastr.error("Failed to load shared MOMs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMom = async (momId) => {
    try {
      const response = await momService.getMomById(momId);
      setSelectedMom(response.data);
    } catch (error) {
      toastr.error("Failed to load MOM details");
      console.error(error);
    }
  };

  const currentMoms =
    activeTab === "sharedByMe" ? sharedByMeMoms : sharedWithMeMoms;

  const getMeetingType = (row) => {
    const src = activeTab === "sharedByMe" ? row.fullMom || row : row;

    return (
      src.meetingType ||
      src.MeetingType ||
      src.mom?.meetingType ||
      src.mom?.MeetingType ||
      src.Mom?.meetingType ||
      src.Mom?.MeetingType ||
      ""
    );
  };

  return (
    <>
      <div
        className="smm-overlay modal fade show d-block"
        tabIndex="-1"
        onClick={onClose}
      >
        <div
          className="smm-dialog modal-dialog modal-dialog-centered"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="smm-content modal-content border-0 shadow-lg">
            <div className="smm-header modal-header border-0">
              <div className="w-100 smm-header-left">
                <h5 className="smm-title modal-title fw-bold mb-3">
                  Shared MOMs
                </h5>

                <ul className="smm-tabs nav nav-pills">
                  <li className="nav-item">
                    <button
                      className="smm-tab-btn"
                      style={{
                        backgroundColor:
                          activeTab === "sharedByMe"
                            ? "#D84796"
                            : "rgba(255,255,255,0.2)",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "9999px",
                        paddingInline: "1.4rem",
                        paddingBlock: "0.55rem",
                        fontWeight: activeTab === "sharedByMe" ? 600 : 500,
                        transition: "all 0.2s ease",
                      }}
                      onClick={() => setActiveTab("sharedByMe")}
                    >
                      <i className="bi bi-share me-2" />
                      Shared By Me
                    </button>

                    <button
                      className="smm-tab-btn"
                      style={{
                        backgroundColor:
                          activeTab === "sharedWithMe"
                            ? "#D84796"
                            : "rgba(255,255,255,0.2)",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "9999px",
                        paddingInline: "1.4rem",
                        paddingBlock: "0.55rem",
                        fontWeight: activeTab === "sharedWithMe" ? 600 : 500,
                        transition: "all 0.2s ease",
                        marginLeft: "0.5rem",
                      }}
                      onClick={() => setActiveTab("sharedWithMe")}
                    >
                      <i className="bi bi-inbox me-2" />
                      Shared With Me
                    </button>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => {
                  onClose();
                }}
                aria-label="Close"
              />
            </div>

            <div className="smm-body modal-body p-0">
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
                    <i className="bi bi-inbox" />
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
                        <th className="px-4 py-3 fw-semibold smm-th">Date</th>
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
                        const meetingType = getMeetingType(mom);
                        return (
                          <tr
                            key={`shared-mom-${activeTab}-${mom.momId}-${index}`}
                            className="smm-row"
                          >
                            <td
                              className="px-4 py-3 smm-td smm-td-clickable"
                              onClick={() => handleViewMom(mom.momId)}
                            >
                              <div className="fw-semibold smm-title-cell">
                                {mom.meetingTitle}
                              </div>
                              {mom.meetingDate && (
                                <small className="text-muted smm-subtext">
                                  <i className="bi bi-calendar3 me-1" />
                                  {new Date(
                                    mom.meetingDate
                                  ).toLocaleDateString()}
                                </small>
                              )}
                            </td>
                            <td className="px-4 py-3 smm-td">
                              <span className="badge bg-primary-subtle text-primary">
                                {meetingType || "N/A"}
                              </span>
                            </td>
                            <td className="px-4 py-3 smm-td">
                              {activeTab === "sharedByMe"
                                ? mom.sharedAt
                                  ? new Date(mom.sharedAt).toLocaleDateString()
                                  : "N/A"
                                : mom.meetingDate
                                ? new Date(mom.meetingDate).toLocaleDateString()
                                : mom.sharedAt
                                ? new Date(mom.sharedAt).toLocaleDateString()
                                : "N/A"}
                            </td>
                            <td className="px-4 py-3 smm-td">
                              <div className="d-flex align-items-center gap-2">
                                <i className="bi bi-person-circle text-muted" />
                                <span className="smm-subtext">
                                  {activeTab === "sharedByMe"
                                    ? mom.sharedWithEmployeeName || "Unknown"
                                    : mom.sharedByEmployeeName ||
                                      mom.submittedByEmployeeName ||
                                      "Unknown"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center smm-td">
                              <button
                                className="smm-view-btn btn btn-sm d-flex align-items-center gap-1 mx-auto"
                                onClick={() => handleViewMom(mom.momId)}
                              >
                                <i className="bi bi-eye" />
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
                className="smm-close-btn btn btn-secondary px-4"
                onClick={() => {
                  onClose();
                }}
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

      <style>{`
        .modal.show.d-block {
          display: flex !important;
        }
      `}</style>
    </>
  );
};

export default SharedMomsModal;
