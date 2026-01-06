import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  getApproverAssessments,
  getApproverReworkForms,
  getApproverSubmittedL1Ratings,
  getApproverAssessmentDetail,
  getApproverAssessmentDecision,
  getApproverAssessmentAttachments,
  submitApproverReviews,
  downloadApproverAttachment,
  getReviewerAssessments,
  getReviewerSubmittedRatings,
  getReviewerAssessmentDetail,
  getReviewerAssessmentAttachments,
  submitReviewerReviews,
  submitReviewerDecision,
  downloadReviewerAttachment
} from "../../../services/performancemanagement/api/rolesapi";

import { Toaster, toast } from "sonner";
import "../../../styles/performancemanagement/manager/TeamLeadPage.module.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import ReviewModal from "../../../components/performance_management/modals/TeamLeadPage/ReviewModal";
import Breadcrumb from "../../../components/common/Breadcrumb";

const calculateAverageRating = (items) => {
  if (!items || items.length === 0) return 0;
  const validRatings = items
    .filter((item) => item.employeeRating && item.employeeRating > 0)
    .map((item) => item.employeeRating);
  if (validRatings.length === 0) return 0;
  return (
    validRatings.reduce((a, b) => a + b, 0) / validRatings.length
  ).toFixed(2);
};

const getExtensionFromContentType = (contentType) => {
  if (!contentType) return null;

  const mimeToExt = {
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      ".docx",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      ".xlsx",
    "application/vnd.ms-powerpoint": ".ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      ".pptx",
    "text/plain": ".txt",
    "text/csv": ".csv",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "application/zip": ".zip",
    "application/x-zip-compressed": ".zip",
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
  if (!Array.isArray(allSubs))
    return { pending: [], submitted: [], rejected: [] };
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
  const [activeL2Tab, setActiveL2Tab] = useState("Pending");
  const [allL1, setAllL1] = useState([]);
  const [l2Subs, setL2Subs] = useState([]);
  const [submittedL1, setSubmittedL1] = useState([]);
  const [submittedL2, setSubmittedL2] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [modalRatings, setModalRatings] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [l2ActionLoading, setL2ActionLoading] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId, active]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (active === "l1") {
        const [pendingResp, reworkResp, submittedResp] = await Promise.all([
          getApproverAssessments(userId, 1, 25),
          getApproverReworkForms(userId, 1, 25).catch(() => ({ data: [] })),
          getApproverSubmittedL1Ratings(userId, 1, 25).catch(() => ({ data: [] })),
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
        const submittedAssessmentsBasic = extractAssessments(submittedResp);
        
        const allAssessmentIds = [
          ...pendingAssessments.map((a) => a.assessmentId),
          ...reworkAssessmentsList.map((a) => a.assessmentId),
        ];

        const allWithDetails = await Promise.all(
          allAssessmentIds.map(async (assessmentId) => {
            try {
              const detailResp = await getApproverAssessmentDetail(userId, assessmentId);
              return detailResp.data;
            } catch (err) {
              return (
                pendingAssessments.find(
                  (a) => a.assessmentId === assessmentId
                ) ||
                reworkAssessmentsList.find(
                  (a) => a.assessmentId === assessmentId
                )
              );
            }
          })
        );

        const withNotes = await Promise.all(
          allWithDetails.map(async (a) => {
            try {
              const decisionResp = await getApproverAssessmentDecision(userId, a.assessmentId);
              return {
                ...a,
                l2DecisionNote: decisionResp.data?.note || "",
                l2Decision: decisionResp.data?.decision || "",
              };
            } catch {
              return {
                ...a,
                l2DecisionNote: "",
                l2Decision: "",
              };
            }
          })
        );

        const submittedWithDetails = await Promise.all(
          submittedAssessmentsBasic.map(async (basic) => {
            try {
              const detailResp = await getApproverAssessmentDetail(userId, basic.assessmentId);
              return detailResp.data;
            } catch (err) {
              return basic;
            }
          })
        );

        setAllL1(withNotes);
        setSubmittedL1(submittedWithDetails);
      } else {
        const [pendingResp, submittedResp] = await Promise.all([
          getReviewerAssessments(userId, 1, 25),
          getReviewerSubmittedRatings(userId, 1, 25).catch(() => ({ data: [] })),
        ]);
        
        const respData = pendingResp?.data;
        const assessments = Array.isArray(respData)
          ? respData
          : Array.isArray(respData?.data)
          ? respData.data
          : Array.isArray(respData?.data?.assessments)
          ? respData.data.assessments
          : Array.isArray(respData?.assessments)
          ? respData.assessments
          : [];
          
        const submittedData = submittedResp?.data;
        const submittedAssessmentsBasic = Array.isArray(submittedData)
          ? submittedData
          : Array.isArray(submittedData?.data)
          ? submittedData.data
          : [];
        
        const submittedWithDetails = await Promise.all(
          submittedAssessmentsBasic.map(async (basic) => {
            try {
              const detailResp = await getReviewerAssessmentDetail(userId, basic.assessmentId);
              return detailResp.data;
            } catch (err) {
              return basic;
            }
          })
        );
          
        setL2Subs(assessments);
        setSubmittedL2(submittedWithDetails);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const openModal = async (assess, readOnly = false) => {
    setIsReadOnly(readOnly);
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
      const attachmentsResp = active === "l1"
        ? await getApproverAssessmentAttachments(userId, assess.assessmentId)
        : await getReviewerAssessmentAttachments(userId, assess.assessmentId);
      const attachments =
        attachmentsResp.data?.data || attachmentsResp.data || [];

      setModalData((prev) => ({
        ...assess,
        attachments: attachments,
      }));
    } catch (error) {
      console.error("Error fetching attachments:", error);
      setModalData((prev) => ({
        ...assess,
        attachments: [],
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
    setIsReadOnly(false);
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

      await submitApproverReviews(userId, {
        assessmentId: modalData.assessmentId,
        items,
      });
      toast.success("Assessment submitted successfully!");
      closeModal();
      await fetchData();
    } catch (error) {
      console.error("Error submitting L1:", error);
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
          if (
            fieldData &&
            fieldData.rating &&
            fieldData.comment &&
            fieldData.comment.trim().length > 0
          ) {
            return {
              detailId: item.detailId,
              rating: Number(fieldData.rating),
              comments: fieldData.comment,
            };
          }
          if (
            item.reviewerRating &&
            item.reviewerRating > 0 &&
            item.reviewerComments
          ) {
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

      await submitReviewerReviews(userId, {
        assessmentId: modalData.assessmentId,
        items,
      });
      await submitReviewerDecision(userId, modalData.assessmentId, "approved", "");
      
      // Optimistically remove from pending list
      setL2Subs(prevSubs => prevSubs.filter(sub => sub.assessmentId !== modalData.assessmentId));
      
      toast.success("Review approved successfully!");
      closeModal();
      await fetchData();
    } catch (error) {
      console.error("Error approving L2:", error);
      toast.error("Failed to approve.");
      // Revert optimistic update if failed
      await fetchData();
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
      await submitReviewerDecision(userId, modalData.assessmentId, "rejected", rejectionReason);
      
      // Optimistically remove from pending list
      setL2Subs(prevSubs => prevSubs.filter(sub => sub.assessmentId !== modalData.assessmentId));
      
      toast.success("Review rejected and returned to L1.");
      closeModal();
      await fetchData();
    } catch (error) {
      console.error("Error rejecting L2:", error);
      toast.error("Failed to reject.");
      // Revert optimistic update if failed
      await fetchData();
    } finally {
      setL2ActionLoading(false);
    }
  };

  const handleDownloadAttachment = async (attachmentId) => {
    try {
      const response = active === "l1"
        ? await downloadApproverAttachment(userId, attachmentId)
        : await downloadReviewerAttachment(userId, attachmentId);

      let filename = "attachment";

      const contentDisposition = response.headers["content-disposition"];

      if (contentDisposition) {
        const matches = contentDisposition.match(
          /filename\s*=\s*(?:"([^"]*)"|([^;,\n]*))/
        );
        if (matches && (matches[1] || matches[2])) {
          filename = matches[1] || matches[2];
          filename = filename.trim();
        }
      }

      const contentType = response.headers["content-type"];

      if (!filename.includes(".") && contentType) {
        const extension = getExtensionFromContentType(contentType);
        if (extension) {
          filename = `${filename}${extension}`;
        }
      }

      const blob = new Blob([response.data], {
        type: contentType || "application/octet-stream",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      toast.success(`Downloaded: ${filename}`);
    } catch (error) {
      console.error("Error downloading attachment:", error);
      toast.error("Failed to download attachment.");
    }
  };

  function renderL1Table() {
    const categories = getL1Categories(allL1);
    const tabs = [
      { key: "Pending", label: "Pending L1 Review", subs: categories.pending },
      { key: "Rejected", label: "Rejected (Rework)", subs: categories.rejected },
      { key: "Submitted", label: "Submitted L1 Ratings", subs: submittedL1 },
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
              <span className="tl-count">
                {tab.subs.length}
              </span>
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
                  const isSubmittedTab = activeL1Tab === "Submitted";
                  const showReviewBtn =
                    !isSubmittedTab && (!l1Complete || assess.l2Decision === "Rejected");
                  
                  return (
                    <tr key={assess.assessmentId}>
                      <td>{assess.employeeName}</td>
                      <td>{assess.formName}</td>
                      <td>
                        <span className="cg-days-badge badge-info">
                          {avgRating}/5
                        </span>
                      </td>
                      <td>
                        <span
                          className={`cg-days-badge ${
                            isSubmittedTab
                              ? "badge-success"
                              : assess.l2Decision === "Rejected"
                              ? "badge-danger"
                              : l1Complete
                              ? "badge-warning"
                              : "badge-info"
                          }`}
                        >
                          {isSubmittedTab
                            ? "Submitted"
                            : assess.l2Decision === "Rejected"
                            ? "Rejected"
                            : l1Complete
                            ? "Submitted"
                            : "Pending"}
                        </span>
                      </td>
                      <td>
                        {new Date(assess.submittedAt).toLocaleDateString()}
                      </td>
                      <td>
                        {showReviewBtn && (
                          <button
                            className="cg-bulk-btn"
                            onClick={() => openModal(assess, false)}
                          >
                            <i className="bi bi-pencil-square"></i> Review &amp; Submit
                          </button>
                        )}
                        {isSubmittedTab && (
                          <button
                            className="cg-bulk-btn cg-bulk-btn-view"
                            onClick={() => openModal(assess, true)}
                          >
                            <i className="bi bi-eye"></i>
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
                  <option value="5">5</option>
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
    const tabs = [
      { key: "Pending", label: "Pending L2 Review", subs: l2Subs },
      { key: "Submitted", label: "Submitted L2 Ratings", subs: submittedL2 },
    ];
    const currentSubs = tabs.find((t) => t.key === activeL2Tab)?.subs || [];
    const isSubmittedTab = activeL2Tab === "Submitted";
    
    return (
      <>
        <div className="tl-tabs-bar">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`tl-tab ${activeL2Tab === tab.key ? "active" : ""}`}
              onClick={() => setActiveL2Tab(tab.key)}
            >
              {tab.label}
              <span className="tl-count">
                {tab.subs.length}
              </span>
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
                  <th>L1 Avg</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentSubs.map((assess) => {
                  const empAvg = calculateAverageRating(assess.items);
                  const l1Ratings = (assess.items || []).filter(
                    (i) => i.approverRating && i.approverRating > 0
                  );
                  const l1Avg =
                    l1Ratings.length > 0
                      ? (
                          l1Ratings.reduce((sum, i) => sum + i.approverRating, 0) /
                          l1Ratings.length
                        ).toFixed(2)
                      : 0;
                  return (
                    <tr key={assess.assessmentId}>
                      <td>{assess.employeeName}</td>
                      <td>{assess.formName}</td>
                      <td>
                        <span className="cg-days-badge badge-info">
                          {empAvg}/5
                        </span>
                      </td>
                      <td>
                        <span className="cg-days-badge badge-warning">
                          {l1Avg}/5
                        </span>
                      </td>
                      <td>
                        <span className={`cg-days-badge ${isSubmittedTab ? "badge-success" : "badge-info"}`}>
                          {isSubmittedTab ? "Submitted" : "Awaiting"}
                        </span>
                      </td>
                      <td>
                        {new Date(assess.submittedAt).toLocaleDateString()}
                      </td>
                      <td>
                        {!isSubmittedTab && (
                          <button
                            className="cg-bulk-btn"
                            onClick={() => openModal(assess, false)}
                          >
                            <i className="bi bi-pencil-square"></i> Review
                          </button>
                        )}
                        {isSubmittedTab && (
                          <button
                            className="cg-bulk-btn cg-bulk-btn-view"
                            onClick={() => openModal(assess, true)}
                          >
                            <i className="bi bi-eye"></i> View
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

  return (
    <div className="tl-page">
      <Toaster position="top-right" />

      <div className="hrfcper-top-bar compact">
        <Breadcrumb
          items={[
            { label: "Performance", path: "/manager/dashboard/performance" },
            { label: "Performance Review", path: null }
          ]}
        />

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
            onClick={() => {
              setActive("l2");
              setActiveL2Tab("Pending");
            }}
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
          isReadOnly={isReadOnly}
        />
      )}
    </div>
  );
}

export default TeamLeadPage;
