// TeamLeadPage.jsx
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // L2 data must call the reviewer endpoints (backend exposes reviewer routes)
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
      // be explicit so the UI can show a friendly message
      toast.error("No submissions found.");
    } finally {
      setLoading(false);
    }
  };
 
  const openModal = (assess) => {
    setModalData(assess);
    const ratings = {};
    (assess.items || []).forEach((item) => {
      if (active === "l1") {
        ratings[item.detailId] = {
          rating: item.approverRating ?? "",
          comment: item.approverComments ?? "",
        };
      } else {
        // reviewer fields for L2
        ratings[item.detailId] = {
          rating: item.reviewerRating ?? "",
          comment: item.reviewerComments ?? "",
        };
      }
    });
    setModalRatings(ratings);
    setShowRejectReason(false);
    setRejectionReason("");
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
 
      // Use reviewer endpoints for L2 approve (backend expects reviewer routes)
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
      // Use reviewer endpoint for rejection as backend exposes reviewer routes for L2 actions
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
 
  function renderL1Table() {
    const categories = getL1Categories(allL1);
    // Only Pending & Rejected tabs (Awaiting removed)
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
          <>
            <table className="cg-employee-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Form</th>
                  <th>Emp Avg</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentSubs.map((assess) => {
                  const avgRating = calculateAverageRating(assess.items);
                  const l1Complete = isL1Complete(assess);
                  const showReviewBtn = !l1Complete || assess.l2Decision === "Rejected";
                  return (
                    <tr key={assess.assessmentId}>
                      <td>{assess.employeeName}</td>
                      <td>{assess.formName}</td>
                      <td>
                        <span className="cg-days-badge badge-info">{avgRating}/5</span>
                      </td>
                      <td>
                        <span
                          className={`cg-days-badge ${
                            assess.l2Decision === "Rejected"
                              ? "badge-danger"
                              : l1Complete
                              ? "badge-warning"
                              : "badge-info"
                          }`}
                        >
                          {assess.l2Decision === "Rejected"
                            ? "Rejected"
                            : l1Complete
                            ? "Submitted"
                            : "Pending"}
                        </span>
                      </td>
                      <td>{new Date(assess.submittedAt).toLocaleDateString()}</td>
                      <td>
                        {showReviewBtn && (
                          <button className="cg-bulk-btn" onClick={() => openModal(assess)}>
                            <i className="bi bi-pencil-square"></i> Review & Submit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="pagination-container">
              <div className="pagination-info">
                <span className="pagination-label">Show</span>
                <select className="pagination-select">
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
                <span className="pagination-label">entries</span>
              </div>
              <div className="pagination-status">
                Showing 1 to {currentSubs.length} of {currentSubs.length} entries
              </div>
              <nav className="pagination-nav">
                <ul className="pagination">
                  <li className="page-item disabled">
                    <button className="page-link">
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>
                  <li className="page-item active">
                    <button className="page-link">1</button>
                  </li>
                  <li className="page-item disabled">
                    <button className="page-link">
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </>
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
      <>
        <table className="cg-employee-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Form</th>
              <th>Emp Avg</th>
              <th>L1 Avg</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
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
                <tr key={assess.assessmentId}>
                  <td>{assess.employeeName}</td>
                  <td>{assess.formName}</td>
                  <td>
                    <span className="cg-days-badge badge-info">{empAvg}/5</span>
                  </td>
                  <td>
                    <span className="cg-days-badge badge-warning">{l1Avg}/5</span>
                  </td>
                  <td>
                    <span className="cg-days-badge badge-info">Awaiting</span>
                  </td>
                  <td>{new Date(assess.submittedAt).toLocaleDateString()}</td>
                  <td>
                    <button className="cg-bulk-btn" onClick={() => openModal(assess)}>
                      <i className="bi bi-pencil-square"></i> Review
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="pagination-container">
          <div className="pagination-info">
            <span className="pagination-label">Show</span>
            <select className="pagination-select">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <span className="pagination-label">entries</span>
          </div>
          <div className="pagination-status">
            Showing 1 to {l2Subs.length} of {l2Subs.length} entries
          </div>
          <nav className="pagination-nav">
            <ul className="pagination">
              <li className="page-item disabled">
                <button className="page-link">
                  <i className="bi bi-chevron-left"></i>
                </button>
              </li>
              <li className="page-item active">
                <button className="page-link">1</button>
              </li>
              <li className="page-item disabled">
                <button className="page-link">
                  <i className="bi bi-chevron-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </>
    );
  }
 
  return (
    <div className="tl-page">
      <Toaster position="top-right" richColors />
 
      {/* compact breadcrumb + toggle row */}
      <div className="hrfcper-top-bar compact">
        <nav className="hrfcper-breadcrumb-nav">
          <ul className="hrfcper-breadcrumb compact">
            <li className="hrfcper-breadcrumb-item">
              <Link to="/employee/dashboard" aria-label="Home">
                <i className="bi bi-house-fill" />{" "}
              </Link>
            </li>
            <li className="hrfcper-breadcrumb-item">
              <Link to="/employee/dashboard/performance">Performance</Link>
            </li>
            <li className="hrfcper-breadcrumb-item active">Performance Review</li>
          </ul>
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
            <i className="bi bi-person-check"></i>
            L1 Approver
          </button>
          <button
            className={`tl-toggle-btn ${active === "l2" ? "active" : ""}`}
            onClick={() => setActive("l2")}
            aria-pressed={active === "l2"}
          >
            <i className="bi bi-person-check-fill"></i>
            L2 Approver
          </button>
        </div>
      </div>
 
      {/* main content (filters removed as requested) */}
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
        />
      )}
    </div>
  );
}
 
export default TeamLeadPage;
 
 