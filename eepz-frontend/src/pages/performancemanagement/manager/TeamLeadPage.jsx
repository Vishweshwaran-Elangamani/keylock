import React, { useState, useEffect, useRef } from "react";
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
  downloadReviewerAttachment,
} from "../../../services/performancemanagement/api/rolesapi";
import { Toaster, toast } from "sonner";
import "../../../styles/performancemanagement/manager/TeamLeadPage.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import ReviewModal from "../../../components/performance_management/modals/TeamLeadPage/ReviewModal";
import Breadcrumb from "../../../components/common/Breadcrumb";
 
const calculateAverageRating = (items) => {
  if (!items || items.length === 0) return 0;
  const validRatings = items.filter((item) => item.employeeRating && item.employeeRating > 0).map((item) => item.employeeRating);
  if (validRatings.length === 0) return 0;
  return (validRatings.reduce((a, b) => a + b, 0) / validRatings.length).toFixed(2);
};
 
const getExtensionFromContentType = (contentType) => {
  if (!contentType) return null;
  const mimeToExt = {
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/vnd.ms-powerpoint": ".ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
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
  return (assess.items || []).every((item) => item.approverRating && item.approverComments && item.approverRating >= 1 && item.approverRating <= 5);
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
 
const CustomPaginationDropdown = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(prev => !prev);
  };

  const optionsList = [5, 10, 25];

  return (
    <div className="custom-tl-pagination-dropdown" ref={dropdownRef}>
      <div 
        className="custom-tl-selected" 
        onClick={handleToggle}
        tabIndex={0}
        role="button"
      >
        {value}
        <span className="custom-tl-arrow"></span>
      </div>
      
      {isOpen && (
        <div className="custom-tl-menu">
          {optionsList.map(option => (
            <div 
              key={option} 
              className={`custom-tl-option ${value === option ? 'custom-tl-option-active' : ''}`}
              onClick={() => handleSelect(option)}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
  const [l1CurrentPage, setL1CurrentPage] = useState(1);
  const [l1ItemsPerPage, setL1ItemsPerPage] = useState(10);
  const [l2CurrentPage, setL2CurrentPage] = useState(1);
  const [l2ItemsPerPage, setL2ItemsPerPage] = useState(10);
 
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
          return Array.isArray(respData) ? respData : Array.isArray(respData?.data) ? respData.data : Array.isArray(respData?.data?.assessments) ? respData.data.assessments : Array.isArray(respData?.assessments) ? respData.assessments : [];
        };
        const pendingAssessments = extractAssessments(pendingResp);
        const reworkAssessmentsList = extractAssessments(reworkResp);
        const submittedAssessmentsBasic = extractAssessments(submittedResp);
        const allAssessmentIds = [...pendingAssessments.map((a) => a.assessmentId), ...reworkAssessmentsList.map((a) => a.assessmentId)];
        const allWithDetails = await Promise.all(
          allAssessmentIds.map(async (assessmentId) => {
            try {
              const detailResp = await getApproverAssessmentDetail(userId, assessmentId);
              return detailResp.data;
            } catch (err) {
              return pendingAssessments.find((a) => a.assessmentId === assessmentId) || reworkAssessmentsList.find((a) => a.assessmentId === assessmentId);
            }
          })
        );
        const withNotes = await Promise.all(
          allWithDetails.map(async (a) => {
            try {
              const decisionResp = await getApproverAssessmentDecision(userId, a.assessmentId);
              return { ...a, l2DecisionNote: decisionResp.data?.note || "", l2Decision: decisionResp.data?.decision || "" };
            } catch {
              return { ...a, l2DecisionNote: "", l2Decision: "" };
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
        const assessments = Array.isArray(respData) ? respData : Array.isArray(respData?.data) ? respData.data : Array.isArray(respData?.data?.assessments) ? respData.data.assessments : Array.isArray(respData?.assessments) ? respData.assessments : [];
        const submittedData = submittedResp?.data;
        const submittedAssessmentsBasic = Array.isArray(submittedData) ? submittedData : Array.isArray(submittedData?.data) ? submittedData.data : [];
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
        ratings[item.detailId] = { rating: item.approverRating ?? "", comment: item.approverComments ?? "" };
      } else {
        ratings[item.detailId] = { rating: item.reviewerRating ?? "", comment: item.reviewerComments ?? "" };
      }
    });
    setModalRatings(ratings);
    setShowRejectReason(false);
    setRejectionReason("");
    try {
      const attachmentsResp = active === "l1" ? await getApproverAssessmentAttachments(userId, assess.assessmentId) : await getReviewerAssessmentAttachments(userId, assess.assessmentId);
      const attachments = attachmentsResp.data?.data || attachmentsResp.data || [];
      setModalData((prev) => ({ ...assess, attachments: attachments }));
    } catch (error) {
      console.error("Error fetching attachments:", error);
      setModalData((prev) => ({ ...assess, attachments: [] }));
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
      const items = (modalData.items || []).map((item) => ({ detailId: item.detailId, rating: Number(modalRatings[item.detailId]?.rating), comments: modalRatings[item.detailId]?.comment }));
      if (!items.every((it) => it.rating && !isNaN(it.rating) && it.rating >= 1 && it.rating <= 5 && it.comments && it.comments.trim().length > 0)) {
        toast.error("Please fill all ratings and comments.");
        setSubmitting(false);
        return;
      }
      await submitApproverReviews(userId, { assessmentId: modalData.assessmentId, items });
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
      const items = (modalData.items || []).map((item) => {
        const fieldData = modalRatings[item.detailId];
        if (fieldData && fieldData.rating && fieldData.comment && fieldData.comment.trim().length > 0) {
          return { detailId: item.detailId, rating: Number(fieldData.rating), comments: fieldData.comment };
        }
        if (item.reviewerRating && item.reviewerRating > 0 && item.reviewerComments) {
          return { detailId: item.detailId, rating: item.reviewerRating, comments: item.reviewerComments };
        }
        return null;
      }).filter((item) => item !== null);
      if (items.length !== (modalData.items || []).length) {
        toast.error("Please complete all items.");
        setL2ActionLoading(false);
        return;
      }
      await submitReviewerReviews(userId, { assessmentId: modalData.assessmentId, items });
      await submitReviewerDecision(userId, modalData.assessmentId, "approved", "");
      setL2Subs((prevSubs) => prevSubs.filter((sub) => sub.assessmentId !== modalData.assessmentId));
      toast.success("Review approved successfully!");
      closeModal();
      await fetchData();
    } catch (error) {
      console.error("Error approving L2:", error);
      toast.error("Failed to approve.");
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
      setL2Subs((prevSubs) => prevSubs.filter((sub) => sub.assessmentId !== modalData.assessmentId));
      toast.success("Review rejected and returned to L1.");
      closeModal();
      await fetchData();
    } catch (error) {
      console.error("Error rejecting L2:", error);
      toast.error("Failed to reject.");
      await fetchData();
    } finally {
      setL2ActionLoading(false);
    }
  };
 
  const handleDownloadAttachment = async (attachmentId) => {
    try {
      const response = active === "l1" ? await downloadApproverAttachment(userId, attachmentId) : await downloadReviewerAttachment(userId, attachmentId);
      let filename = "attachment";
      const contentDisposition = response.headers["content-disposition"];
      if (contentDisposition) {
        const matches = contentDisposition.match(/filename\s*=\s*(?:"([^"]*)"|([^;,\n]*))/);
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
      const blob = new Blob([response.data], { type: contentType || "application/octet-stream" });
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
 
  const getPaginatedData = (data, currentPage, itemsPerPage) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };
 
  const getTotalPages = (totalItems, itemsPerPage) => {
    return Math.ceil(totalItems / itemsPerPage);
  };
 
  const handlePageChange = (newPage, isL1) => {
    if (isL1) {
      setL1CurrentPage(newPage);
    } else {
      setL2CurrentPage(newPage);
    }
  };
 
  const handleItemsPerPageChange = (newItemsPerPage, isL1) => {
    if (isL1) {
      setL1ItemsPerPage(Number(newItemsPerPage));
      setL1CurrentPage(1);
    } else {
      setL2ItemsPerPage(Number(newItemsPerPage));
      setL2CurrentPage(1);
    }
  };
 
  const getStatistics = () => {
    if (active === "l1") {
      const categories = getL1Categories(allL1);
      return { pending: categories.pending.length, rejected: categories.rejected.length, submitted: submittedL1.length, total: allL1.length + submittedL1.length };
    } else {
      return { pending: l2Subs.length, submitted: submittedL2.length, total: l2Subs.length + submittedL2.length };
    }
  };
 
  const StatisticsCards = () => {
    const stats = getStatistics();
    if (active === "l1") {
      return (
        <div className="tl-stats-grid">
          <div className="tl-stat-card tl-stat-pending">
            <div className="tl-stat-icon"><i className="bi bi-clock-history"></i></div>
            <div className="tl-stat-content">
              <div className="tl-stat-value">{stats.pending}</div>
              <div className="tl-stat-label">Pending Review</div>
            </div>
          </div>
          <div className="tl-stat-card tl-stat-rejected">
            <div className="tl-stat-icon"><i className="bi bi-arrow-counterclockwise"></i></div>
            <div className="tl-stat-content">
              <div className="tl-stat-value">{stats.rejected}</div>
              <div className="tl-stat-label">Rework Required</div>
            </div>
          </div>
          <div className="tl-stat-card tl-stat-submitted">
            <div className="tl-stat-icon"><i className="bi bi-check-circle"></i></div>
            <div className="tl-stat-content">
              <div className="tl-stat-value">{stats.submitted}</div>
              <div className="tl-stat-label">Submitted</div>
            </div>
          </div>
          <div className="tl-stat-card tl-stat-total">
            <div className="tl-stat-icon"><i className="bi bi-file-earmark-text"></i></div>
            <div className="tl-stat-content">
              <div className="tl-stat-value">{stats.total}</div>
              <div className="tl-stat-label">Total Assessments</div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="tl-stats-grid tl-stats-grid-l2">
          <div className="tl-stat-card tl-stat-pending">
            <div className="tl-stat-icon"><i className="bi bi-hourglass-split"></i></div>
            <div className="tl-stat-content">
              <div className="tl-stat-value">{stats.pending}</div>
              <div className="tl-stat-label">Awaiting Review</div>
            </div>
          </div>
          <div className="tl-stat-card tl-stat-submitted">
            <div className="tl-stat-icon"><i className="bi bi-check-circle"></i></div>
            <div className="tl-stat-content">
              <div className="tl-stat-value">{stats.submitted}</div>
              <div className="tl-stat-label">Completed</div>
            </div>
          </div>
          <div className="tl-stat-card tl-stat-total">
            <div className="tl-stat-icon"><i className="bi bi-file-earmark-check"></i></div>
            <div className="tl-stat-content">
              <div className="tl-stat-value">{stats.total}</div>
              <div className="tl-stat-label">Total Reviews</div>
            </div>
          </div>
        </div>
      );
    }
  };
 
  const PaginationControls = ({ currentPage, totalItems, itemsPerPage, onPageChange, onItemsPerPageChange, isL1 }) => {
    const totalPages = getTotalPages(totalItems, itemsPerPage);
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    const options = [5, 10, 25, 50];
    return (
      <div className="pagination-container">
        <div className="pagination-info">
          <span className="pagination-label">Show</span>
          <CustomPaginationDropdown value={itemsPerPage} onChange={(val) => onItemsPerPageChange(val, isL1)} options={options} />
          <span className="pagination-label">entries</span>
        </div>
        <div className="pagination-status">Showing {startItem} to {endItem} of {totalItems} entries</div>
        <nav className="pagination-nav">
          <ul className="pagination">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => onPageChange(currentPage - 1, isL1)} disabled={currentPage === 1}>
                <i className="bi bi-chevron-left"></i>
              </button>
            </li>
            {[...Array(totalPages)].map((_, index) => {
              const pageNum = index + 1;
              if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                return (
                  <li key={pageNum} className={`page-item ${currentPage === pageNum ? "active" : ""}`}>
                    <button className="page-link" onClick={() => onPageChange(pageNum, isL1)}>{pageNum}</button>
                  </li>
                );
              } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                return (
                  <li key={pageNum} className="page-item disabled">
                    <span className="page-link">...</span>
                  </li>
                );
              }
              return null;
            })}
            <li className={`page-item ${currentPage === totalPages || totalPages === 0 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => onPageChange(currentPage + 1, isL1)} disabled={currentPage === totalPages || totalPages === 0}>
                <i className="bi bi-chevron-right"></i>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    );
  };
 
  function renderL1Table() {
    const categories = getL1Categories(allL1);
    const tabs = [
      { key: "Pending", label: "Pending L1 Review", subs: categories.pending, icon: "clock-history" },
      { key: "Rejected", label: "Rejected (Rework)", subs: categories.rejected, icon: "arrow-counterclockwise" },
      { key: "Submitted", label: "Submitted L1 Ratings", subs: submittedL1, icon: "check-circle" },
    ];
    const currentSubs = tabs.find((t) => t.key === activeL1Tab)?.subs || [];
    const paginatedSubs = getPaginatedData(currentSubs, l1CurrentPage, l1ItemsPerPage);
    return (
      <>
        <div className="tl-tabs-bar">
          {tabs.map((tab) => (
            <button key={tab.key} className={`tl-tab ${activeL1Tab === tab.key ? "active" : ""}`} onClick={() => { setActiveL1Tab(tab.key); setL1CurrentPage(1); }}>
              <i className={`bi bi-${tab.icon}`}></i>
              {tab.label}
              <span className="tl-count">{tab.subs.length}</span>
            </button>
          ))}
        </div>
        {currentSubs.length === 0 ? (
          <div className="tl-empty">
            <div className="tl-empty-icon"><i className="bi bi-inbox"></i></div>
            <h3 className="tl-empty-title">No Submissions Found</h3>
            <p className="tl-empty-text">There are no assessments in this category at the moment.</p>
          </div>
        ) : (
          <>
            <div className="tl-table-wrapper">
              <table className="cg-employee-table">
                <thead>
                  <tr>
                    <th><i className="bi bi-person"></i> Employee</th>
                    <th><i className="bi bi-file-text"></i> Form</th>
                    <th><i className="bi bi-star"></i> Emp Avg</th>
                    <th><i className="bi bi-flag"></i> Status</th>
                    <th><i className="bi bi-calendar"></i> Date</th>
                    <th><i className="bi bi-gear"></i> Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSubs.map((assess) => {
                    const avgRating = calculateAverageRating(assess.items);
                    const l1Complete = isL1Complete(assess);
                    const isSubmittedTab = activeL1Tab === "Submitted";
                    const showReviewBtn = !isSubmittedTab && (!l1Complete || assess.l2Decision === "Rejected");
                    return (
                      <tr key={assess.assessmentId}>
                        <td>
                          <div className="tl-employee-cell">
                            <div className="tl-employee-avatar">{assess.employeeName?.charAt(0) || "U"}</div>
                            <span className="tl-employee-name">{assess.employeeName}</span>
                          </div>
                        </td>
                        <td>{assess.formName}</td>
                        <td>
                          <span className="cg-days-badge badge-info"><i className="bi bi-star-fill"></i>{avgRating}/5</span>
                        </td>
                        <td>
                          <span className={`cg-days-badge ${isSubmittedTab ? "badge-success" : assess.l2Decision === "Rejected" ? "badge-danger" : l1Complete ? "badge-warning" : "badge-info"}`}>
                            {isSubmittedTab ? "Submitted" : assess.l2Decision === "Rejected" ? "Rejected" : l1Complete ? "Submitted" : "Pending"}
                          </span>
                        </td>
                        <td>{new Date(assess.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td>
                          {showReviewBtn && (
                            <button className="cg-bulk-btn" onClick={() => openModal(assess, false)}>
                              <i className="bi bi-pencil-square"></i> Review
                            </button>
                          )}
                          {isSubmittedTab && (
                            <button className="cg-bulk-btn cg-bulk-btn-view" onClick={() => openModal(assess, true)}>
                              <i className="bi bi-eye"></i> View
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <PaginationControls currentPage={l1CurrentPage} totalItems={currentSubs.length} itemsPerPage={l1ItemsPerPage} onPageChange={handlePageChange} onItemsPerPageChange={handleItemsPerPageChange} isL1={true} />
          </>
        )}
      </>
    );
  }
 
  function renderL2Table() {
    const tabs = [
      { key: "Pending", label: "Pending L2 Review", subs: l2Subs, icon: "hourglass-split" },
      { key: "Submitted", label: "Submitted L2 Ratings", subs: submittedL2, icon: "check-circle" },
    ];
    const currentSubs = tabs.find((t) => t.key === activeL2Tab)?.subs || [];
    const isSubmittedTab = activeL2Tab === "Submitted";
    const paginatedSubs = getPaginatedData(currentSubs, l2CurrentPage, l2ItemsPerPage);
    return (
      <>
        <div className="tl-tabs-bar">
          {tabs.map((tab) => (
            <button key={tab.key} className={`tl-tab ${activeL2Tab === tab.key ? "active" : ""}`} onClick={() => { setActiveL2Tab(tab.key); setL2CurrentPage(1); }}>
              <i className={`bi bi-${tab.icon}`}></i>
              {tab.label}
              <span className="tl-count">{tab.subs.length}</span>
            </button>
          ))}
        </div>
        {currentSubs.length === 0 ? (
          <div className="tl-empty">
            <div className="tl-empty-icon"><i className="bi bi-inbox"></i></div>
            <h3 className="tl-empty-title">No Reviews Found</h3>
            <p className="tl-empty-text">There are no reviews in this category at the moment.</p>
          </div>
        ) : (
          <>
            <div className="tl-table-wrapper">
              <table className="cg-employee-table">
                <thead>
                  <tr>
                    <th><i className="bi bi-person"></i> Employee</th>
                    <th><i className="bi bi-file-text"></i> Form</th>
                    <th><i className="bi bi-star"></i> Emp Avg</th>
                    <th><i className="bi bi-star-fill"></i> L1 Avg</th>
                    <th><i className="bi bi-flag"></i> Status</th>
                    <th><i className="bi bi-calendar"></i> Date</th>
                    <th><i className="bi bi-gear"></i> Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSubs.map((assess) => {
                    const empAvg = calculateAverageRating(assess.items);
                    const l1Ratings = (assess.items || []).filter((i) => i.approverRating && i.approverRating > 0);
                    const l1Avg = l1Ratings.length > 0 ? (l1Ratings.reduce((sum, i) => sum + i.approverRating, 0) / l1Ratings.length).toFixed(2) : 0;
                    return (
                      <tr key={assess.assessmentId}>
                        <td>
                          <div className="tl-employee-cell">
                            <div className="tl-employee-avatar">{assess.employeeName?.charAt(0) || "U"}</div>
                            <span className="tl-employee-name">{assess.employeeName}</span>
                          </div>
                        </td>
                        <td>{assess.formName}</td>
                        <td>
                          <span className="cg-days-badge badge-info"><i className="bi bi-star-fill"></i>{empAvg}/5</span>
                        </td>
                        <td>
                          <span className="cg-days-badge badge-warning"><i className="bi bi-star-fill"></i>{l1Avg}/5</span>
                        </td>
                        <td>
                          <span className={`cg-days-badge ${isSubmittedTab ? "badge-success" : "badge-info"}`}>
                            {isSubmittedTab ? "Submitted" : "Awaiting"}
                          </span>
                        </td>
                        <td>{new Date(assess.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td>
                          {!isSubmittedTab && (
                            <button className="cg-bulk-btn" onClick={() => openModal(assess, false)}>
                              <i className="bi bi-pencil-square"></i> Review
                            </button>
                          )}
                          {isSubmittedTab && (
                            <button className="cg-bulk-btn cg-bulk-btn-view" onClick={() => openModal(assess, true)}>
                              <i className="bi bi-eye"></i> View
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <PaginationControls currentPage={l2CurrentPage} totalItems={currentSubs.length} itemsPerPage={l2ItemsPerPage}
            onPageChange={handlePageChange} onItemsPerPageChange={handleItemsPerPageChange} isL1={false} />
          </>
        )}
      </>
    );
  }
 
  return (
    <div className="tl-page">
      <Toaster position="top-right" />
      <div className="hrfcper-top-bar compact">
        <Breadcrumb items={[{ label: "Performance", path: "/manager/dashboard/performance" }, { label: "Performance Review", path: null }]} />
        <div className="tl-toggle compact">
          <button className={`tl-toggle-btn ${active === "l1" ? "active" : ""}`} onClick={() => { setActive("l1"); setActiveL1Tab("Pending"); }} aria-pressed={active === "l1"}>
            <i className="bi bi-person-check"></i>L1 Approver
          </button>
          <button className={`tl-toggle-btn ${active === "l2" ? "active" : ""}`} onClick={() => { setActive("l2"); setActiveL2Tab("Pending"); }} aria-pressed={active === "l2"}>
            <i className="bi bi-person-check-fill"></i>L2 Approver
          </button>
        </div>
      </div>
      {!loading && <StatisticsCards />}
      <div className="tl-content">
        {loading ? (
          <div className="tl-loading">
            <div className="tl-spinner"></div>
            <p>Loading assessments...</p>
          </div>
        ) : (
          <>
            {active === "l1" && renderL1Table()}
            {active === "l2" && renderL2Table()}
          </>
        )}
      </div>
      {showModal && modalData && (
        <ReviewModal showModal={showModal} closeModal={closeModal}
        modalData={modalData} modalRatings={modalRatings} setModalRatings={setModalRatings}
        handleL1Submit={handleL1Submit} handleL2Approve={handleL2Approve} handleL2Reject={handleL2Reject}
        setRejectionReason={setRejectionReason} rejectionReason={rejectionReason} showRejectReason={showRejectReason}
        setShowRejectReason={setShowRejectReason} submitting={submitting} l2ActionLoading={l2ActionLoading} active={active}
        handleDownloadAttachment={handleDownloadAttachment} isReadOnly={isReadOnly} />
      )}
    </div>
  );
}
export default TeamLeadPage;
 
