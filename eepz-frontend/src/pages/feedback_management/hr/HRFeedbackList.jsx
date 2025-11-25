// src/pages/feedback_management/hr/HRFeedbackList.jsx

import React, { useEffect, useState } from "react";
import {
  RefreshCw,
  AlertTriangle,
  Eye,
  Trash2,
  Users,
  Send,
  Clock,
  Lock,
  User,
} from "lucide-react";
import {
  mentorFeedbackApi,
  peerQueueApi,
  employeeApi,
  hrFormApi,
} from "../../../services/feedbackmanagement/feedbackApi";
import ResponseViewModal from "../../../components/feedback_management/modals/ResponseViewModal";
import FeedbackBreadcrumb from "../../../components/feedback_management/common/FeedbackBreadcrumb";

const Badge = ({ text, color = "#525252" }) => (
  <span
    style={{
      display: "inline-block",
      backgroundColor: `${color}15`,
      color,
      padding: "6px 12px",
      fontSize: "0.75rem",
      fontWeight: 600,
      borderRadius: "6px",
      border: `1.5px solid ${color}40`,
    }}
  >
    {text}
  </span>
);

export default function HRFeedbackList() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("Mentor");
  const [hrForms, setHrForms] = useState([]);
  const [mentor, setMentor] = useState([]);
  const [peer, setPeer] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [employeeMap, setEmployeeMap] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  // Fetch employee map using service
  const fetchEmployeeMap = async () => {
    try {
      console.log("Fetching employee map...");
      const response = await employeeApi.getAll();

      if (response?.data) {
        const employees = Array.isArray(response.data)
          ? response.data
          : response.data.data || [];

        const map = {};
        employees.forEach((emp) => {
          map[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
        });
        setEmployeeMap(map);
        console.log("Employee map loaded:", Object.keys(map).length);
      }
    } catch (err) {
      console.error("Error fetching employee map:", err.message);
    }
  };

  // Fetch all feedback data using services
  const fetchData = async () => {
    setRefreshing(true);
    setLoading(true);
    setError("");

    try {
      // Fetch HR Feedback
      try {
        console.log("Fetching HR feedback...");
        const formsRes = await hrFormApi.getActiveForms();
        console.log("Forms response:", formsRes);

        let allHRFeedback = [];

        const forms = formsRes?.data || [];

        if (Array.isArray(forms)) {
          for (const form of forms) {
            try {
              const respRes = await hrFormApi.getResponsesByFormId(form.formId);

              const responses = respRes?.data || [];

              if (Array.isArray(responses)) {
                const mappedHR = responses.map((r) => ({
                  responseId: r.responseId,
                  formId: form.formId,
                  formName: form.formName,
                  employeeId: r.employeeId,
                  employeeName:
                    employeeMap[r.employeeId] || `Employee ${r.employeeId}`,
                  status: r.status || "Submitted",
                  submittedAt:
                    r.submittedDate || r.createdAt || new Date().toISOString(),
                  hrReviewComments: r.hrReviewComments,
                  ...r,
                }));

                allHRFeedback = [...allHRFeedback, ...mappedHR];
                console.log(
                  `${mappedHR.length} HR feedback from form ${form.formId}`
                );
              }
            } catch (err) {
              console.warn(`Error fetching HR responses:`, err.message);
            }
          }
        }

        setHrForms(allHRFeedback);
      } catch (hrErr) {
        console.warn("HR feedback API error:", hrErr.message);
        setHrForms([]);
      }

      // Fetch Mentor Feedback
      try {
        console.log("Fetching mentor feedback...");
        const mentorRes = await mentorFeedbackApi.list(1, 100);
        const mentorData = Array.isArray(mentorRes?.data)
          ? mentorRes.data
          : mentorRes?.data?.data || [];

        const enrichedMentorData = mentorData.map((m) => ({
          ...m,
          mentorNameFull:
            employeeMap[m.mentorEmployeeId] || `Employee ${m.mentorEmployeeId}`,
        }));

        setMentor(enrichedMentorData);
        console.log(`${enrichedMentorData.length} mentor feedback loaded`);
      } catch (mentorErr) {
        console.warn("Mentor feedback API error:", mentorErr.message);
        setMentor([]);
      }

      // Fetch Peer Feedback
      try {
        console.log("Fetching peer feedback...");
        const peerRes = await peerQueueApi.list(1, 100);
        const allPeer = Array.isArray(peerRes?.data)
          ? peerRes.data
          : peerRes?.data?.data || [];

        const enrichedPeerData = allPeer.map((p) => ({
          ...p,
          recipientNameFull:
            employeeMap[p.recipientEmployeeId] ||
            `Employee ${p.recipientEmployeeId}`,
          submitterNameFull:
            employeeMap[p.submittedByEmployeeId] ||
            `Employee ${p.submittedByEmployeeId}`,
        }));

        setPeer(enrichedPeerData);
        console.log(`${enrichedPeerData.length} peer feedback loaded`);
      } catch (peerErr) {
        console.warn("Peer feedback API error:", peerErr.message);
        setPeer([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err?.message || "Failed to fetch feedback");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch employee map on mount
  useEffect(() => {
    fetchEmployeeMap();
  }, []);

  // Fetch data after employee map is loaded
  useEffect(() => {
    if (Object.keys(employeeMap).length > 0) {
      fetchData();
    }
  }, [employeeMap]);

  // Modal handlers
  const handleViewResponse = (data, type) => {
    setSelectedResponse(data);
    setSelectedType(type);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedResponse(null);
    setSelectedType(null);
  };

  // Delete HR Form using service
  const deleteHRForm = async (responseId) => {
    if (
      !window.confirm(
        "Delete this HR form submission? This action cannot be undone."
      )
    )
      return;
    setError("");

    try {
      await hrFormApi.deleteResponse(responseId);
      fetchData();
    } catch (err) {
      console.error("Delete error:", err);
      setError(err?.message || "Failed to delete HR form");
    }
  };

  // Delete Mentor Feedback using service
  const deleteMentor = async (trackingId) => {
    if (!window.confirm("Delete this mentor feedback submission?")) return;
    setError("");

    try {
      await mentorFeedbackApi.remove(trackingId);
      fetchData();
    } catch (err) {
      setError(err?.message || "Failed to delete mentor feedback");
    }
  };

  // Delete Peer Feedback using service
  const deletePeer = async (queueId) => {
    if (!window.confirm("Delete this peer feedback submission?")) return;
    setError("");

    try {
      await peerQueueApi.remove(queueId);
      fetchData();
    } catch (err) {
      setError(err?.message || "Failed to delete peer feedback");
    }
  };

  // Helper functions
  const getMentorName = (m) => {
    return m.mentorNameFull || m.mentorName || `Employee ${m.mentorEmployeeId}`;
  };

  const getRecipientName = (p) => {
    return (
      p.recipientNameFull ||
      p.recipientName ||
      `Employee ${p.recipientEmployeeId}`
    );
  };

  const getSubmitterName = (p) => {
    return (
      p.submitterNameFull ||
      p.submitterName ||
      `Employee ${p.submittedByEmployeeId}`
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8f9fa",
        padding: "2rem 1rem",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* ========== BREADCRUMB ========== */}
        <FeedbackBreadcrumb
          items={[
            { label: "Feedback Management", path: "/hr/dashboard/feedback" },
            { label: "Feedback Forms List" },
          ]}
        />

        {/* Header */}
        <div
          className="d-flex justify-content-between align-items-center mb-4"
          style={{ flexWrap: "wrap", gap: "1rem" }}
        >
          <div>
            <h2
              className="fw-bold mb-1"
              style={{ fontSize: "1.75rem", color: "#212529" }}
            >
              All Feedback Submissions
            </h2>
            <p className="mb-0 text-muted" style={{ fontSize: "0.875rem" }}>
              View and manage all feedback submissions (Mentor & Peer)
            </p>
          </div>
          <button
            className="btn btn-outline-secondary d-flex align-items-center gap-2"
            onClick={() => {
              fetchEmployeeMap();
              fetchData();
            }}
            disabled={refreshing || loading}
            style={{
              borderRadius: "8px",
              padding: "10px 20px",
              fontWeight: 600,
              border: "2px solid #dee2e6",
            }}
          >
            <RefreshCw
              size={18}
              style={{
                animation: refreshing ? "spin 1s linear infinite" : "none",
              }}
            />
            Refresh
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            className="alert alert-danger alert-dismissible fade show d-flex align-items-start gap-2 mb-4"
            role="alert"
            style={{ borderRadius: "8px" }}
          >
            <AlertTriangle size={18} className="mt-1 flex-shrink-0" />
            <div className="flex-grow-1">
              <strong>Error</strong>
              <p className="mb-0 small mt-1">{error}</p>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={() => setError("")}
            />
          </div>
        )}

        {/* PILL-STYLE TOGGLE NAVIGATION - CENTERED */}
        <div className="d-flex justify-content-center mb-4">
          <div
            className="toggle-container"
            style={{
              backgroundColor: "#27235c",
              borderRadius: "55px",
              padding: "7px",
              display: "inline-flex",
              gap: "2px",
              boxShadow: "0 5px 15px rgba(39, 35, 92, 0.22)",
              minHeight: "54px",
            }}
          >
            <button
              type="button"
              onClick={() => setTab("Mentor")}
              style={{
                background: tab === "Mentor" ? "#ffffff" : "transparent",
                color: tab === "Mentor" ? "#27235c" : "#ffffff",
                border: "none",
                borderRadius: "55px",
                padding: "12px 30px",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.3s ease",
                whiteSpace: "nowrap",
                minHeight: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <Send size={15} />
              Mentor
              {mentor.length > 0 && (
                <span
                  style={{
                    backgroundColor:
                      tab === "Mentor" ? "#27235c" : "rgba(255,255,255,0.3)",
                    color: "#ffffff",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    minWidth: "24px",
                    textAlign: "center",
                  }}
                >
                  {mentor.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setTab("Peer")}
              style={{
                background: tab === "Peer" ? "#ffffff" : "transparent",
                color: tab === "Peer" ? "#27235c" : "#ffffff",
                border: "none",
                borderRadius: "55px",
                padding: "12px 30px",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.3s ease",
                whiteSpace: "nowrap",
                minHeight: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <Users size={15} />
              Peer
              {peer.length > 0 && (
                <span
                  style={{
                    backgroundColor:
                      tab === "Peer" ? "#27235c" : "rgba(255,255,255,0.3)",
                    color: "#ffffff",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    minWidth: "24px",
                    textAlign: "center",
                  }}
                >
                  {peer.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="text-center py-5">
            <div
              className="spinner-border"
              style={{
                width: "3rem",
                height: "3rem",
                color: "#27235C",
                borderWidth: "3px",
              }}
              role="status"
            >
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-3 fw-medium">Loading submissions...</p>
          </div>
        ) : (
          <>
            {/* Mentor Tab */}
            {tab === "Mentor" &&
              (mentor.length === 0 ? (
                <div
                  style={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "3rem",
                    textAlign: "center",
                  }}
                >
                  <AlertTriangle
                    size={48}
                    style={{ color: "#cbd5e1", marginBottom: "1rem" }}
                  />
                  <h5 className="fw-bold mb-2" style={{ color: "#6c757d" }}>
                    No Mentor Feedback Yet
                  </h5>
                  <p className="text-muted mb-0">
                    There are no mentor feedback submissions.
                  </p>
                </div>
              ) : (
                <div className="row g-3">
                  {mentor.map((m) => (
                    <div
                      className="col-md-6 col-lg-4"
                      key={m.trackingId || m.id}
                    >
                      <div
                        style={{
                          background: "white",
                          border: "1px solid #e5e7eb",
                          borderLeft: "4px solid #27235C",
                          borderRadius: "10px",
                          padding: "1.25rem",
                          height: "100%",
                          transition: "box-shadow 0.2s",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.boxShadow =
                            "0 4px 12px rgba(39, 35, 92, 0.2)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.boxShadow = "none")
                        }
                      >
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div style={{ textAlign: "left" }}>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "#6c757d",
                                marginBottom: "4px",
                                fontWeight: 600,
                                textAlign: "left",
                              }}
                            >
                              Mentor
                            </div>
                            <div
                              className="d-flex align-items-center gap-1"
                              style={{ textAlign: "left" }}
                            >
                              <User size={14} style={{ color: "#27235C" }} />
                              <h6
                                className="mb-0 fw-bold"
                                style={{
                                  fontSize: "0.938rem",
                                  color: "#212529",
                                  textAlign: "left",
                                }}
                              >
                                {getMentorName(m)}
                              </h6>
                            </div>
                          </div>
                          <Badge text={`${m.rating || 0}/5`} color="#27235C" />
                        </div>

                        <div className="mb-3" style={{ textAlign: "left" }}>
                          <div
                            className="d-flex align-items-center gap-2 text-muted"
                            style={{ fontSize: "0.813rem", textAlign: "left" }}
                          >
                            <Clock size={14} />
                            <span>
                              {m.createdAt
                                ? new Date(m.createdAt).toLocaleDateString()
                                : "—"}
                            </span>
                          </div>
                        </div>

                        <div
                          className="mb-3"
                          style={{
                            background: "#f8f9fa",
                            padding: "0.75rem",
                            borderRadius: "6px",
                            minHeight: "60px",
                            textAlign: "left",
                          }}
                        >
                          <p
                            className="mb-0"
                            style={{
                              fontSize: "0.813rem",
                              color: "#495057",
                              textAlign: "left",
                            }}
                          >
                            {m.feedbackComments
                              ? m.feedbackComments.substring(0, 80) + "..."
                              : "No comments"}
                          </p>
                        </div>

                        <div className="d-flex gap-2">
                          <button
                            className="btn flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                            onClick={() => handleViewResponse(m, "Mentor")}
                            style={{
                              borderRadius: "6px",
                              padding: "8px",
                              fontWeight: 600,
                              background: "#27235C",
                              color: "white",
                              border: "none",
                            }}
                          >
                            <Eye size={16} />
                            View
                          </button>
                          <button
                            className="btn btn-outline-danger d-flex align-items-center justify-content-center"
                            onClick={() => deleteMentor(m.trackingId || m.id)}
                            style={{
                              borderRadius: "6px",
                              padding: "8px",
                              width: "40px",
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

            {/* Peer Tab */}
            {tab === "Peer" &&
              (peer.length === 0 ? (
                <div
                  style={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "3rem",
                    textAlign: "center",
                  }}
                >
                  <AlertTriangle
                    size={48}
                    style={{ color: "#cbd5e1", marginBottom: "1rem" }}
                  />
                  <h5 className="fw-bold mb-2" style={{ color: "#6c757d" }}>
                    No Peer Feedback Yet
                  </h5>
                  <p className="text-muted mb-0">
                    There are no peer feedback submissions.
                  </p>
                </div>
              ) : (
                <div className="row g-3">
                  {peer.map((p) => {
                    const statusColor =
                      p.status === "Approved"
                        ? "#198754"
                        : p.status === "Rejected"
                        ? "#dc3545"
                        : "#27235C";

                    return (
                      <div
                        className="col-md-6 col-lg-4"
                        key={p.queueId || p.id}
                      >
                        <div
                          style={{
                            background: "white",
                            border: "1px solid #e5e7eb",
                            borderLeft: `4px solid ${statusColor}`,
                            borderRadius: "10px",
                            padding: "1.25rem",
                            height: "100%",
                            transition: "box-shadow 0.2s",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.boxShadow =
                              "0 4px 12px rgba(39, 35, 92, 0.2)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.boxShadow = "none")
                          }
                        >
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div style={{ flex: 1, textAlign: "left" }}>
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#6c757d",
                                  marginBottom: "4px",
                                  fontWeight: 600,
                                  textAlign: "left",
                                }}
                              >
                                From
                              </div>
                              <div
                                className="d-flex align-items-center gap-1 mb-2"
                                style={{ textAlign: "left" }}
                              >
                                <User size={14} style={{ color: "#6c757d" }} />
                                <h6
                                  className="mb-0 fw-semibold"
                                  style={{
                                    fontSize: "0.875rem",
                                    color: "#212529",
                                    textAlign: "left",
                                  }}
                                >
                                  {getSubmitterName(p)}
                                </h6>
                              </div>
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#6c757d",
                                  marginBottom: "4px",
                                  fontWeight: 600,
                                  textAlign: "left",
                                }}
                              >
                                To
                              </div>
                              <div
                                className="d-flex align-items-center gap-1"
                                style={{ textAlign: "left" }}
                              >
                                <User size={14} style={{ color: "#27235C" }} />
                                <h6
                                  className="mb-0 fw-bold"
                                  style={{
                                    fontSize: "0.938rem",
                                    color: "#212529",
                                    textAlign: "left",
                                  }}
                                >
                                  {getRecipientName(p)}
                                </h6>
                              </div>
                            </div>
                            <Badge
                              text={p.status || "Pending"}
                              color={statusColor}
                            />
                          </div>

                          <div className="mb-3" style={{ textAlign: "left" }}>
                            <div
                              className="d-flex align-items-center gap-2 text-muted"
                              style={{
                                fontSize: "0.813rem",
                                textAlign: "left",
                              }}
                            >
                              <Clock size={14} />
                              <span>
                                {p.createdAt
                                  ? new Date(p.createdAt).toLocaleDateString()
                                  : "—"}
                              </span>
                            </div>
                          </div>

                          {p.isAnonymous && (
                            <div
                              className="mb-2"
                              style={{
                                fontSize: "0.813rem",
                                color: "#6c757d",
                                textAlign: "left",
                              }}
                            >
                              <Lock
                                size={12}
                                className="me-1"
                                style={{ display: "inline" }}
                              />
                              <span>Anonymous submission</span>
                            </div>
                          )}

                          <div
                            className="mb-3"
                            style={{
                              background: "#f8f9fa",
                              padding: "0.75rem",
                              borderRadius: "6px",
                              minHeight: "60px",
                              textAlign: "left",
                            }}
                          >
                            <p
                              className="mb-0"
                              style={{
                                fontSize: "0.813rem",
                                color: "#495057",
                                textAlign: "left",
                              }}
                            >
                              {p.feedbackContent
                                ? p.feedbackContent.substring(0, 80) + "..."
                                : "No content"}
                            </p>
                          </div>

                          <div className="d-flex gap-2">
                            <button
                              className="btn flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                              onClick={() => handleViewResponse(p, "Peer")}
                              style={{
                                borderRadius: "6px",
                                padding: "8px",
                                fontWeight: 600,
                                background: "#27235C",
                                color: "white",
                                border: "none",
                              }}
                            >
                              <Eye size={16} />
                              View
                            </button>
                            <button
                              className="btn btn-outline-danger d-flex align-items-center justify-content-center"
                              onClick={() => deletePeer(p.queueId || p.id)}
                              style={{
                                borderRadius: "6px",
                                padding: "8px",
                                width: "40px",
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
          </>
        )}
      </div>

      <ResponseViewModal
        show={showModal}
        response={selectedResponse}
        onClose={handleCloseModal}
        type={selectedType}
      />

      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        .toggle-container button:hover {
          opacity: 0.92;
        }
        .toggle-container button:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
}
