import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../../services/performancemanagement/hr/api";
import { Toaster, toast } from "sonner";
import "../../../styles/performancemanagement/manager/TeamLeadPage.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import ReviewModal from "../../../components/performance_management/modals/TeamLeadPage/ReviewModal";

const calculateAverageRating = (items) => {
  if (!items || items.length === 0) return 0;
  const validRatings = items
    .filter((item) => item.employeeRating && item.employeeRating > 0)
    .map((item) => item.employeeRating);
  if (validRatings.length === 0) return 0;
  return (validRatings.reduce((a, b) => a + b, 0) / validRatings.length).toFixed(2);
};

const getExtensionFromContentType = (contentType) => {
  if (!contentType) return null;

  const mimeToExt = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/vnd.ms-powerpoint': '.ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    'text/plain': '.txt',
    'text/csv': '.csv',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'application/zip': '.zip',
    'application/x-zip-compressed': '.zip',
  };

  return mimeToExt[contentType.toLowerCase()] || null;
};

const isL1Complete = (assess) => {
  return (assess.items || []).every(
    (item) =>
      item.approverRating &&
      item.approverComments &&
      item.approverRating >= 1 &&
      item.approverRating <= 5
  );
};

const getL1Categories = (allSubs) => {
  if (!Array.isArray(allSubs)) return { pending: [], submitted: [], rejected: [] };
  const rejected = [];
  const pending = [];
  const submitted = [];
  allSubs.forEach((a) => {
    if (a.l2Decision === "Rejected") {
      rejected.push(a);
      return;
    }
    if (isL1Complete(a)) {
      submitted.push(a);
      return;
    }
    pending.push(a);
  });
  return { pending, submitted, rejected };
};

function TeamLeadPage() {
  const user = JSON.parse(localStorage.getItem("user"));
  const empId = user ? user.empId : null;
  const [userId] = useState(() => empId);
  const [active, setActive] = useState("l1");
  const [activeL1Tab, setActiveL1Tab] = useState("Pending");
  const [allL1, setAllL1] = useState([]);
  const [l2Subs, setL2Subs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [modalRatings, setModalRatings] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [l2ActionLoading, setL2ActionLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId, active]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (active === "l1") {
        const [pendingResp, reworkResp] = await Promise.all([
          api.get(`/approver/${userId}/assessments`, { params: { page: 1, pageSize: 25 } }),
          api
            .get(`/approver/${userId}/rework-forms`, { params: { page: 1, pageSize: 25 } })
            .catch(() => ({ data: [] })),
        ]);

        const extractAssessments = (resp) => {
          const respData = resp?.data;
          return Array.isArray(respData)
            ? respData
            : Array.isArray(respData?.data)
              ? respData.data
              : Array.isArray(respData?.data?.assessments)
                ? respData.data.assessments
                : Array.isArray(respData?.assessments)
                  ? respData.assessments
                  : [];
        };

        const pendingAssessments = extractAssessments(pendingResp);
        const reworkAssessmentsList = extractAssessments(reworkResp);
        const allAssessmentIds = [
          ...pendingAssessments.map((a) => a.assessmentId),
          ...reworkAssessmentsList.map((a) => a.assessmentId),
        ];

        const allWithDetails = await Promise.all(
          allAssessmentIds.map(async (assessmentId) => {
            try {
              const detailResp = await api.get(`/approver/${userId}/assessment/${assessmentId}`);
              return detailResp.data;
            } catch (err) {
              return (
                pendingAssessments.find((a) => a.assessmentId === assessmentId) ||
                reworkAssessmentsList.find((a) => a.assessmentId === assessmentId)
              );
            }
          })
        );

        const withNotes = await Promise.all(
          allWithDetails.map(async (a) => {
            try {
              const decisionResp = await api.get(
                `/approver/${userId}/assessment/${a.assessmentId}/decision`
              );
              return {
                ...a,
                l2DecisionNote: decisionResp.data?.note || "",
                l2Decision: decisionResp.data?.decision || "",
              };
            } catch {
              return a;
            }
          })
        );

        setAllL1(withNotes);
      } else {
        const resp = await api.get(`/reviewer/${userId}/assessments/full`, {
          params: { page: 1, pageSize: 25 },
        });
        const respData = resp?.data;
        const assessments = Array.isArray(respData)
          ? respData
          : Array.isArray(respData?.data)
            ? respData.data
            : Array.isArray(respData?.data?.assessments)
              ? respData.data.assessments
              : Array.isArray(respData?.assessments)
                ? respData.assessments
                : [];
        setL2Subs(assessments);
      }
    } catch (error) {
      toast.error("No submissions found.");
    } finally {
      setLoading(false);
    }
  };

  const openModal = async (assess) => {
    setModalData(assess);
    const ratings = {};
    (assess.items || []).forEach((item) => {
      if (active === "l1") {
        ratings[item.detailId] = {
          rating: item.approverRating ?? "",
          comment: item.approverComments ?? "",
        };
      } else {
        ratings[item.detailId] = {
          rating: item.reviewerRating ?? "",
          comment: item.reviewerComments ?? "",
        };
      }
    });
    setModalRatings(ratings);
    setShowRejectReason(false);
    setRejectionReason("");

    try {
      const endpoint = active === "l1"
        ? `/approver/${userId}/assessment/${assess.assessmentId}/attachments`
        : `/reviewer/${userId}/assessment/${assess.assessmentId}/attachments`;

      const attachmentsResp = await api.get(endpoint);
      const attachments = attachmentsResp.data?.data || attachmentsResp.data || [];

      setModalData(prev => ({
        ...assess,
        attachments: attachments
      }));
    } catch (error) {
      console.error("Error fetching attachments:", error);
      setModalData(prev => ({
        ...assess,
        attachments: []
      }));
    }

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalData(null);
    setModalRatings({});
    setShowRejectReason(false);
    setRejectionReason("");
  };

  const handleL1Submit = async () => {
    setSubmitting(true);
    try {
      const items = (modalData.items || []).map((item) => ({
        detailId: item.detailId,
        rating: Number(modalRatings[item.detailId]?.rating),
        comments: modalRatings[item.detailId]?.comment,
      }));

      if (
        !items.every(
          (it) =>
            it.rating &&
            !isNaN(it.rating) &&
            it.rating >= 1 &&
            it.rating <= 5 &&
            it.comments &&
            it.comments.trim().length > 0
        )
      ) {
        toast.error("Please fill all ratings and comments.");
        setSubmitting(false);
        return;
      }

      await api.post(`/approver/${userId}/reviews`, {
        assessmentId: modalData.assessmentId,
        items,
      });
      toast.success("Assessment submitted successfully!");
      closeModal();
      await fetchData();
    } catch (error) {
      toast.error("Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleL2Approve = async () => {
    setL2ActionLoading(true);
    try {
      const items = (modalData.items || [])
        .map((item) => {
          const fieldData = modalRatings[item.detailId];
          if (fieldData && fieldData.rating && fieldData.comment && fieldData.comment.trim().length > 0) {
            return {
              detailId: item.detailId,
              rating: Number(fieldData.rating),
              comments: fieldData.comment,
            };
          }
          if (item.reviewerRating && item.reviewerRating > 0 && item.reviewerComments) {
            return {
              detailId: item.detailId,
              rating: item.reviewerRating,
              comments: item.reviewerComments,
            };
          }
          return null;
        })
        .filter((item) => item !== null);

      if (items.length !== (modalData.items || []).length) {
        toast.error("Please complete all items.");
        setL2ActionLoading(false);
        return;
      }

      await api.post(`/reviewer/${userId}/reviews`, {
        assessmentId: modalData.assessmentId,
        items,
      });
      await api.post(
        `/reviewer/${userId}/decision?assessmentId=${modalData.assessmentId}&decision=approved`,
        "",
        { headers: { "Content-Type": "application/json" } }
      );
      toast.success("Review approved successfully!");
      closeModal();
      await fetchData();
    } catch (error) {
      toast.error("Failed to approve.");
    } finally {
      setL2ActionLoading(false);
    }
  };

  const handleL2Reject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }
    setL2ActionLoading(true);
    try {
      await api.post(
        `/reviewer/${userId}/decision?assessmentId=${modalData.assessmentId}&decision=rejected`,
        rejectionReason,
        { headers: { "Content-Type": "application/json" } }
      );
      toast.success("Review rejected and returned to L1.");
      closeModal();
      await fetchData();
    } catch (error) {
      toast.error("Failed to reject.");
    } finally {
      setL2ActionLoading(false);
    }
  };

  const handleDownloadAttachment = async (attachmentId) => {
    try {
      console.log(`Downloading attachment ${attachmentId} for ${active} role`);

      const endpoint = active === "l1"
        ? `/approver/${userId}/attachments/${attachmentId}/download`
        : `/reviewer/${userId}/attachments/${attachmentId}/download`;

      console.log(`Download endpoint: ${endpoint}`);

      const response = await api.get(endpoint, {
        responseType: 'blob'
      });

      console.log('Full Response:', response);
      console.log('Response headers object:', response.headers);

      let filename = 'attachment';

      const contentDisposition = response.headers['content-disposition'];
      console.log('Content-Disposition header:', contentDisposition);

      if (contentDisposition) {
        const matches = contentDisposition.match(/filename\s*=\s*(?:"([^"]*)"|([^;,\n]*))/);
        if (matches && (matches[1] || matches[2])) {
          filename = matches[1] || matches[2];
          filename = filename.trim();
          console.log('✅ Extracted filename from header:', filename);
        }
      }

      const contentType = response.headers['content-type'];
      console.log('Content-Type:', contentType);

      if (!filename.includes('.') && contentType) {
        const extension = getExtensionFromContentType(contentType);
        if (extension) {
          filename = `${filename}${extension}`;
          console.log('Added extension based on content-type:', filename);
        }
      }

      console.log('Final filename for download:', filename);

      const blob = new Blob([response.data], { type: contentType || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      toast.success(`Downloaded: ${filename}`);
    } catch (error) {
      console.error("Error downloading attachment:", error);
      console.error("Error response:", error.response);
      toast.error("Failed to download attachment.");
    }
  };

  function renderL1Table() {
    const categories = getL1Categories(allL1);
    const tabs = [
      { key: "Pending", label: "Pending L1 Review", subs: categories.pending },
      { key: "Rejected", label: "Rejected (Rework)", subs: categories.rejected },
    ];
    const currentSubs = tabs.find((t) => t.key === activeL1Tab)?.subs || [];

    return (
      <>
        <div className="tl-tabs-bar">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`tl-tab ${activeL1Tab === tab.key ? "active" : ""}`}
              onClick={() => setActiveL1Tab(tab.key)}
            >
              {tab.label}
              <span className="tl-count">{tab.subs.length}</span>
            </button>
          ))}
        </div>
        {currentSubs.length === 0 ? (
          <div className="tl-empty">
            <i className="bi bi-inbox"></i>
            <p>No submissions</p>
          </div>
        ) : (
          <div 
            style={{
              // backgroundColor: '#27235c',
              border: '2px solid #27235c',
              borderRadius: '12px',
              overflow: 'hidden',
              marginTop: '16px'
            }}
          >
            <table 
              className="cg-employee-table"
              style={{
                // backgroundColor: '#27235c',
                borderCollapse: 'separate',
                borderSpacing: 0,
                width: '100%'
              }}
            >
              <thead style={{ backgroundColor: '#27235c' }}>
                <tr>
                  <th style={{
                    padding: '12px 12px',
                    textAlign: 'left',
                    fontWeight: '700',
                    fontSize: '12px',
                    color: '#ffffff',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    Employee
                  </th>
                  <th style={{
                    padding: '12px 12px',
                    textAlign: 'left',
                    fontWeight: '700',
                    fontSize: '12px',
                    color: '#ffffff',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    Form
                  </th>
                  <th style={{
                    padding: '12px 12px',
                    textAlign: 'left',
                    fontWeight: '700',
                    fontSize: '12px',
                    color: '#ffffff',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    Emp Avg
                  </th>
                  <th style={{
                    padding: '12px 12px',
                    textAlign: 'left',
                    fontWeight: '700',
                    fontSize: '12px',
                    color: '#ffffff',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    Status
                  </th>
                  <th style={{
                    padding: '12px 12px',
                    textAlign: 'left',
                    fontWeight: '700',
                    fontSize: '12px',
                    color: '#ffffff',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    Date
                  </th>
                  <th style={{
                    padding: '12px 12px',
                    textAlign: 'left',
                    fontWeight: '700',
                    fontSize: '12px',
                    color: '#ffffff',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentSubs.map((assess) => {
                  const avgRating = calculateAverageRating(assess.items);
                  const l1Complete = isL1Complete(assess);
                  const showReviewBtn = !l1Complete || assess.l2Decision === "Rejected";
                  return (
                    <tr 
                      key={assess.assessmentId}
                      style={{
                        backgroundColor: '#27235c'
                      }}
                    >
                      <td style={{
                        padding: '12px 12px',
                        fontSize: '13px',
                        color: '#ffffff',
                        borderBottom: '1px solid rgba(255,255,255,0.08)'
                      }}>
                        {assess.employeeName}
                      </td>
                      <td style={{
                        padding: '12px 12px',
                        fontSize: '13px',
                        color: '#ffffff',
                        borderBottom: '1px solid rgba(255,255,255,0.08)'
                      }}>
                        {assess.formName}
                      </td>
                      <td style={{
                        padding: '12px 12px',
                        fontSize: '13px',
                        color: '#ffffff',
                        borderBottom: '1px solid rgba(255,255,255,0.08)'
                      }}>
                        <span 
                          className="cg-days-badge badge-info"
                          style={{
                            background: 'rgba(59,130,246,0.15)',
                            color: '#60a5fa',
                            borderColor: 'rgba(59,130,246,0.3)',
                            fontWeight: '700',
                            padding: '6px 10px',
                            borderRadius: '20px',
                            border: '1px solid',
                            fontSize: '13px'
                          }}
                        >
                          {avgRating}/5
                        </span>
                      </td>
                      <td style={{
                        padding: '12px 12px',
                        fontSize: '13px',
                        color: '#ffffff',
                        borderBottom: '1px solid rgba(255,255,255,0.08)'
                      }}>
                        <span
                          className={`cg-days-badge ${assess.l2Decision === "Rejected"
                              ? "badge-danger"
                              : l1Complete
                                ? "badge-warning"
                                : "badge-info"
                            }`}
                          style={{
                            background: assess.l2Decision === "Rejected" 
                              ? 'rgba(239,68,68,0.15)' 
                              : l1Complete 
                              ? 'rgba(245,158,11,0.15)' 
                              : 'rgba(59,130,246,0.15)',
                            color: assess.l2Decision === "Rejected" 
                              ? '#f87171' 
                              : l1Complete 
                              ? '#f59e2d' 
                              : '#60a5fa',
                            borderColor: assess.l2Decision === "Rejected" 
                              ? 'rgba(239,68,68,0.3)' 
                              : l1Complete 
                              ? 'rgba(245,158,11,0.3)' 
                              : 'rgba(59,130,246,0.3)',
                            fontWeight: '700',
                            padding: '6px 10px',
                            borderRadius: '20px',
                            border: '1px solid',
                            fontSize: '13px'
                          }}
                        >
                          {assess.l2Decision === "Rejected"
                            ? "Rejected"
                            : l1Complete
                              ? "Submitted"
                              : "Pending"}
                        </span>
                      </td>
                      <td style={{
                        padding: '12px 12px',
                        fontSize: '13px',
                        color: '#ffffff',
                        borderBottom: '1px solid rgba(255,255,255,0.08)'
                      }}>
                        {new Date(assess.submittedAt).toLocaleDateString()}
                      </td>
                      <td style={{
                        padding: '12px 12px',
                        fontSize: '13px',
                        color: '#ffffff',
                        borderBottom: '1px solid rgba(255,255,255,0.08)'
                      }}>
                        {showReviewBtn && (
                          <button 
                            className="cg-bulk-btn"
                            onClick={() => openModal(assess)}
                            style={{
                              background: 'linear-gradient(90deg, #97247e 0%, #e01950 100%)',
                              color: '#fff',
                              border: 'none',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              fontWeight: '700',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              boxShadow: '0 4px 12px rgba(151,36,126,0.25)',
                              cursor: 'pointer',
                              fontSize: '13px'
                            }}
                          >
                            <i className="bi bi-pencil-square" style={{ fontSize: '14px' }}></i>
                            Review & Submit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div 
              className="pagination-container"
              style={{
                padding: '12px 12px',
                backgroundColor: '#27235c',
                borderTop: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <div className="pagination-info">
                <span className="pagination-label" style={{ color: '#ffffff', fontSize: '13px' }}>
                  Show
                </span>
                <select 
                  className="pagination-select"
                  style={{
                    height: '32px',
                    backgroundColor: '#ffffff',
                    borderRadius: '6px',
                    border: '1px solid #e0e0e0',
                    padding: '0 8px',
                    color: '#2c3e50',
                    fontSize: '13px'
                  }}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
                <span className="pagination-label" style={{ color: '#ffffff', fontSize: '13px' }}>
                  entries
                </span>
              </div>
              <div className="pagination-status" style={{ color: '#e2e8f0', fontSize: '13px' }}>
                Showing 1 to {currentSubs.length} of {currentSubs.length} entries
              </div>
              <nav className="pagination-nav">
                <ul 
                  className="pagination"
                  style={{
                    display: 'flex',
                    gap: '4px',
                    listStyle: 'none',
                    padding: 0,
                    margin: 0
                  }}
                >
                  <li className="page-item disabled" style={{ margin: 0 }}>
                    <button 
                      className="page-link"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        color: '#ffffff',
                        border: '1px solid rgba(255,255,255,0.2)',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        cursor: 'not-allowed',
                        fontSize: '13px'
                      }}
                    >
                      <i className="bi bi-chevron-left" style={{ fontSize: '14px' }}></i>
                    </button>
                  </li>
                  <li className="page-item active">
                    <button 
                      className="page-link"
                      style={{
                        backgroundColor: '#ffffff',
                        color: '#27235c',
                        border: '1px solid #ffffff',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontWeight: '600',
                        fontSize: '13px'
                      }}
                    >
                      1
                    </button>
                  </li>
                  <li className="page-item disabled">
                    <button 
                      className="page-link"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        color: '#ffffff',
                        border: '1px solid rgba(255,255,255,0.2)',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        cursor: 'not-allowed',
                        fontSize: '13px'
                      }}
                    >
                      <i className="bi bi-chevron-right" style={{ fontSize: '14px' }}></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        )}
      </>
    );
  }

  function renderL2Table() {
    return l2Subs.length === 0 ? (
      <div className="tl-empty">
        <i className="bi bi-inbox"></i>
        <p>No submissions</p>
      </div>
    ) : (
      <div 
        style={{
          backgroundColor: '#27235c',
          border: '2px solid #27235c',
          borderRadius: '12px',
          overflow: 'hidden',
          marginTop: '16px'
        }}
      >
        <table 
          className="cg-employee-table"
          style={{
            backgroundColor: '#27235c',
            borderCollapse: 'separate',
            borderSpacing: 0,
            width: '100%'
          }}
        >
          <thead style={{ backgroundColor: '#27235c' }}>
            <tr>
              <th style={{
                padding: '12px 12px',
                textAlign: 'left',
                fontWeight: '700',
                fontSize: '12px',
                color: '#ffffff',
                textTransform: 'uppercase',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}>
                Employee
              </th>
              <th style={{
                padding: '12px 12px',
                textAlign: 'left',
                fontWeight: '700',
                fontSize: '12px',
                color: '#ffffff',
                textTransform: 'uppercase',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}>
                Form
              </th>
              <th style={{
                padding: '12px 12px',
                textAlign: 'left',
                fontWeight: '700',
                fontSize: '12px',
                color: '#ffffff',
                textTransform: 'uppercase',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}>
                Emp Avg
              </th>
              <th style={{
                padding: '12px 12px',
                textAlign: 'left',
                fontWeight: '700',
                fontSize: '12px',
                color: '#ffffff',
                textTransform: 'uppercase',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}>
                L1 Avg
              </th>
              <th style={{
                padding: '12px 12px',
                textAlign: 'left',
                fontWeight: '700',
                fontSize: '12px',
                color: '#ffffff',
                textTransform: 'uppercase',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}>
                Status
              </th>
              <th style={{
                padding: '12px 12px',
                textAlign: 'left',
                fontWeight: '700',
                fontSize: '12px',
                color: '#ffffff',
                textTransform: 'uppercase',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}>
                Date
              </th>
              <th style={{
                padding: '12px 12px',
                textAlign: 'left',
                fontWeight: '700',
                fontSize: '12px',
                color: '#ffffff',
                textTransform: 'uppercase',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {l2Subs.map((assess) => {
              const empAvg = calculateAverageRating(assess.items);
              const l1AvgRating = (assess.items || [])
                .filter((i) => i.approverRating && i.approverRating > 0)
                .reduce((a, b) => a + b.approverRating, 0);
              const l1Avg =
                assess.items && assess.items.length > 0
                  ? (l1AvgRating /
                    (assess.items || []).filter((i) => i.approverRating && i.approverRating > 0).length
                  ).toFixed(2)
                  : 0;
              return (
                <tr 
                  key={assess.assessmentId}
                  style={{
                    backgroundColor: '#27235c'
                  }}
                >
                  <td style={{
                    padding: '12px 12px',
                    fontSize: '13px',
                    color: '#ffffff',
                    borderBottom: '1px solid rgba(255,255,255,0.08)'
                  }}>
                    {assess.employeeName}
                  </td>
                  <td style={{
                    padding: '12px 12px',
                    fontSize: '13px',
                    color: '#ffffff',
                    borderBottom: '1px solid rgba(255,255,255,0.08)'
                  }}>
                    {assess.formName}
                  </td>
                  <td style={{
                    padding: '12px 12px',
                    fontSize: '13px',
                    color: '#ffffff',
                    borderBottom: '1px solid rgba(255,255,255,0.08)'
                  }}>
                    <span 
                      className="cg-days-badge badge-info"
                      style={{
                        background: 'rgba(59,130,246,0.15)',
                        color: '#60a5fa',
                        borderColor: 'rgba(59,130,246,0.3)',
                        fontWeight: '700',
                        padding: '6px 10px',
                        borderRadius: '20px',
                        border: '1px solid',
                        fontSize: '13px'
                      }}
                    >
                      {empAvg}/5
                    </span>
                  </td>
                  <td style={{
                    padding: '12px 12px',
                    fontSize: '13px',
                    color: '#ffffff',
                    borderBottom: '1px solid rgba(255,255,255,0.08)'
                  }}>
                    <span 
                      className="cg-days-badge badge-warning"
                      style={{
                        background: 'rgba(245,158,11,0.15)',
                        color: '#f59e2d',
                        borderColor: 'rgba(245,158,11,0.3)',
                        fontWeight: '700',
                        padding: '6px 10px',
                        borderRadius: '20px',
                        border: '1px solid',
                        fontSize: '13px'
                      }}
                    >
                      {l1Avg}/5
                    </span>
                  </td>
                  <td style={{
                    padding: '12px 12px',
                    fontSize: '13px',
                    color: '#ffffff',
                    borderBottom: '1px solid rgba(255,255,255,0.08)'
                  }}>
                    <span 
                      className="cg-days-badge badge-info"
                      style={{
                        background: 'rgba(59,130,246,0.15)',
                        color: '#60a5fa',
                        borderColor: 'rgba(59,130,246,0.3)',
                        fontWeight: '700',
                        padding: '6px 10px',
                        borderRadius: '20px',
                        border: '1px solid',
                        fontSize: '13px'
                      }}
                    >
                      Awaiting
                    </span>
                  </td>
                  <td style={{
                    padding: '12px 12px',
                    fontSize: '13px',
                    color: '#ffffff',
                    borderBottom: '1px solid rgba(255,255,255,0.08)'
                  }}>
                    {new Date(assess.submittedAt).toLocaleDateString()}
                  </td>
                  <td style={{
                    padding: '12px 12px',
                    fontSize: '13px',
                    color: '#ffffff',
                    borderBottom: '1px solid rgba(255,255,255,0.08)'
                  }}>
                    <button 
                      className="cg-bulk-btn"
                      onClick={() => openModal(assess)}
                      style={{
                        background: 'linear-gradient(90deg, #97247e 0%, #e01950 100%)',
                        color: '#fff',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontWeight: '700',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(151,36,126,0.25)',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      <i className="bi bi-pencil-square" style={{ fontSize: '14px' }}></i>
                      Review
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div 
          className="pagination-container"
          style={{
            padding: '12px 12px',
            backgroundColor: '#27235c',
            borderTop: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          <div className="pagination-info">
            <span className="pagination-label" style={{ color: '#ffffff', fontSize: '13px' }}>
              Show
            </span>
            <select 
              className="pagination-select"
              style={{
                height: '32px',
                backgroundColor: '#ffffff',
                borderRadius: '6px',
                border: '1px solid #e0e0e0',
                padding: '0 8px',
                color: '#2c3e50',
                fontSize: '13px'
              }}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <span className="pagination-label" style={{ color: '#ffffff', fontSize: '13px' }}>
              entries
            </span>
          </div>
          <div className="pagination-status" style={{ color: '#e2e8f0', fontSize: '13px' }}>
            Showing 1 to {l2Subs.length} of {l2Subs.length} entries
          </div>
          <nav className="pagination-nav">
            <ul 
              className="pagination"
              style={{
                display: 'flex',
                gap: '4px',
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}
            >
              <li className="page-item disabled">
                <button 
                  className="page-link"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.2)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'not-allowed',
                    fontSize: '13px'
                  }}
                >
                  <i className="bi bi-chevron-left" style={{ fontSize: '14px' }}></i>
                </button>
              </li>
              <li className="page-item active">
                <button 
                  className="page-link"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#27235c',
                    border: '1px solid #ffffff',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: '13px'
                  }}
                >
                  1
                </button>
              </li>
              <li className="page-item disabled">
                <button 
                  className="page-link"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.2)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'not-allowed',
                    fontSize: '13px'
                  }}
                >
                  <i className="bi bi-chevron-right" style={{ fontSize: '14px' }}></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    );
  }

  return (
    <div className="tl-page">
      <Toaster position="top-right" richColors />

      <div className="hrfcper-top-bar compact">
        <nav className="hrfcper-breadcrumb-nav" aria-label="breadcrumb">
          <ol
            className="hrfcper-breadcrumb compact"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              listStyle: "none",
              padding: 0,
              margin: 0,
              fontSize: "13px",
              color: "#9B287B",
            }}
          >
            <li
              className="hrfcper-breadcrumb-item"
              style={{ display: "flex", alignItems: "center", gap: "4px" }}
            >
              <Link
                to="/employee/dashboard"
                aria-label="Home"
                style={{ color: "#9B287B", textDecoration: "none", display: "flex", alignItems: "center" }}
              >
                <i className="bi bi-house-door" />
              </Link>
            </li>

            <span style={{ color: "#9B287B" }}>/</span>

            <li className="hrfcper-breadcrumb-item">
              <Link
                to="/employee/dashboard/performance"
                style={{ color: "#9B287B", textDecoration: "none" }}
              >
                Performance
              </Link>
            </li>

            <span style={{ color: "#9B287B" }}>/</span>

            <li
              className="hrfcper-breadcrumb-item active"
              style={{ fontWeight: 600, color: "#9B287B" }}
            >
              Performance Review
            </li>
          </ol>
        </nav>

        <div className="tl-toggle compact">
          <button
            className={`tl-toggle-btn ${active === "l1" ? "active" : ""}`}
            onClick={() => {
              setActive("l1");
              setActiveL1Tab("Pending");
            }}
            aria-pressed={active === "l1"}
          >
            L1 Approver
          </button>
          <button
            className={`tl-toggle-btn ${active === "l2" ? "active" : ""}`}
            onClick={() => setActive("l2")}
            aria-pressed={active === "l2"}
          >
            L2 Approver
          </button>
        </div>
      </div>

      <div className="tl-content">
        {loading ? (
          <div className="tl-loading">
            <div className="tl-spinner"></div>
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {active === "l1" && renderL1Table()}
            {active === "l2" && renderL2Table()}
          </>
        )}
      </div>

      {showModal && modalData && (
        <ReviewModal
          showModal={showModal}
          closeModal={closeModal}
          modalData={modalData}
          modalRatings={modalRatings}
          setModalRatings={setModalRatings}
          handleL1Submit={handleL1Submit}
          handleL2Approve={handleL2Approve}
          handleL2Reject={handleL2Reject}
          setRejectionReason={setRejectionReason}
          rejectionReason={rejectionReason}
          showRejectReason={showRejectReason}
          setShowRejectReason={setShowRejectReason}
          submitting={submitting}
          l2ActionLoading={l2ActionLoading}
          active={active}
          handleDownloadAttachment={handleDownloadAttachment}
        />
      )}
    </div>
  );
}

export default TeamLeadPage;
