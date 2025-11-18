// import React, { useState, useEffect } from "react";
// import api from "../../../services/performancemanagement/hr/api";
// import { Toaster, toast } from "sonner";
// import "../../../styles/performancemanagement/manager/TeamLeadPage.css";
// import "bootstrap-icons/font/bootstrap-icons.css";

// const calculateAverageRating = (items) => {
//   if (!items || items.length === 0) return 0;
//   const validRatings = items
//     .filter((item) => item.employeeRating && item.employeeRating > 0)
//     .map((item) => item.employeeRating);
//   if (validRatings.length === 0) return 0;
//   return (validRatings.reduce((a, b) => a + b, 0) / validRatings.length).toFixed(2);
// };

// const isL1Complete = (assess) => {
//   return (assess.items || []).every(
//     (item) =>
//       item.approverRating &&
//       item.approverComments &&
//       item.approverRating >= 1 &&
//       item.approverRating <= 5
//   );
// };

// const getL1Categories = (allSubs) => {
//   if (!Array.isArray(allSubs))
//     return { pending: [], submitted: [], rejected: [] };

//   const rejected = [];
//   const pending = [];
//   const submitted = [];

//   allSubs.forEach((a) => {
//     if (a.l2Decision === "Rejected") {
//       rejected.push(a);
//       return;
//     }

//     if (isL1Complete(a)) {
//       submitted.push(a);
//       return;
//     }

//     pending.push(a);
//   });

//   return { pending, submitted, rejected };
// };

// function TeamLeadPage() {
//   const user = JSON.parse(localStorage.getItem("user"));
//   const empId = user ? user.empId : null;
//   const [userId] = useState(() => empId);

//   const [active, setActive] = useState("l1");
//   const [activeL1Tab, setActiveL1Tab] = useState("Pending");
//   const [allL1, setAllL1] = useState([]);
//   const [l2Subs, setL2Subs] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const [showModal, setShowModal] = useState(false);
//   const [modalData, setModalData] = useState(null);
//   const [modalRatings, setModalRatings] = useState({});
//   const [submitting, setSubmitting] = useState(false);
//   const [showRejectReason, setShowRejectReason] = useState(false);
//   const [rejectionReason, setRejectionReason] = useState("");
//   const [l2ActionLoading, setL2ActionLoading] = useState(false);

//   useEffect(() => {
//     if (userId) {
//       fetchData();
//     }
//   }, [userId, active]);

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       if (active === "l1") {
//         const [pendingResp, reworkResp] = await Promise.all([
//           api.get(`/approver/${userId}/assessments`, {
//             params: { page: 1, pageSize: 25 },
//           }),
//           api
//             .get(`/approver/${userId}/rework-forms`, {
//               params: { page: 1, pageSize: 25 },
//             })
//             .catch(() => ({ data: [] })),
//         ]);

//         const extractAssessments = (resp) => {
//           const respData = resp?.data;
//           return Array.isArray(respData)
//             ? respData
//             : Array.isArray(respData?.data)
//             ? respData.data
//             : Array.isArray(respData?.data?.assessments)
//             ? respData.data.assessments
//             : Array.isArray(respData?.assessments)
//             ? respData.assessments
//             : [];
//         };

//         const pendingAssessments = extractAssessments(pendingResp);
//         const reworkAssessmentsList = extractAssessments(reworkResp);
//         const allAssessmentIds = [
//           ...pendingAssessments.map((a) => a.assessmentId),
//           ...reworkAssessmentsList.map((a) => a.assessmentId),
//         ];

//         const allWithDetails = await Promise.all(
//           allAssessmentIds.map(async (assessmentId) => {
//             try {
//               const detailResp = await api.get(
//                 `/approver/${userId}/assessment/${assessmentId}`
//               );
//               return detailResp.data;
//             } catch (err) {
//               return (
//                 pendingAssessments.find((a) => a.assessmentId === assessmentId) ||
//                 reworkAssessmentsList.find((a) => a.assessmentId === assessmentId)
//               );
//             }
//           })
//         );

//         const withNotes = await Promise.all(
//           allWithDetails.map(async (a) => {
//             try {
//               const decisionResp = await api.get(
//                 `/approver/${userId}/assessment/${a.assessmentId}/decision`
//               );
//               return {
//                 ...a,
//                 l2DecisionNote: decisionResp.data?.note || "",
//                 l2Decision: decisionResp.data?.decision || "",
//               };
//             } catch {
//               return a;
//             }
//           })
//         );

//         setAllL1(withNotes);
//       } else {
//         const resp = await api.get(`/reviewer/${userId}/assessments/full`, {
//           params: { page: 1, pageSize: 25 },
//         });
//         const respData = resp?.data;
//         const assessments = Array.isArray(respData)
//           ? respData
//           : Array.isArray(respData?.data)
//           ? respData.data
//           : Array.isArray(respData?.data?.assessments)
//           ? respData.data.assessments
//           : Array.isArray(respData?.assessments)
//           ? respData.assessments
//           : [];
//         setL2Subs(assessments);
//       }
//     } catch (error) {
//       toast.error("Failed to load submissions.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const openModal = (assess) => {
//     setModalData(assess);
//     const ratings = {};
//     (assess.items || []).forEach((item) => {
//       if (active === "l1") {
//         ratings[item.detailId] = {
//           rating: item.approverRating ?? "",
//           comment: item.approverComments ?? "",
//         };
//       } else {
//         ratings[item.detailId] = {
//           rating: item.reviewerRating ?? "",
//           comment: item.reviewerComments ?? "",
//         };
//       }
//     });
//     setModalRatings(ratings);
//     setShowRejectReason(false);
//     setRejectionReason("");
//     setShowModal(true);
//   };

//   const closeModal = () => {
//     setShowModal(false);
//     setModalData(null);
//     setModalRatings({});
//     setShowRejectReason(false);
//     setRejectionReason("");
//   };

//   const handleRatingChange = (detailId, key, value) => {
//     setModalRatings((prev) => ({
//       ...prev,
//       [detailId]: { ...prev[detailId], [key]: value },
//     }));
//   };

//   const handleL1Submit = async () => {
//     setSubmitting(true);
//     try {
//       const items = (modalData.items || []).map((item) => ({
//         detailId: item.detailId,
//         rating: Number(modalRatings[item.detailId]?.rating),
//         comments: modalRatings[item.detailId]?.comment,
//       }));

//       if (
//         !items.every(
//           (it) =>
//             it.rating &&
//             !isNaN(it.rating) &&
//             it.rating >= 1 &&
//             it.rating <= 5 &&
//             it.comments &&
//             it.comments.trim().length > 0
//         )
//       ) {
//         toast.error("Please fill all ratings and comments.");
//         setSubmitting(false);
//         return;
//       }

//       await api.post(`/approver/${userId}/reviews`, {
//         assessmentId: modalData.assessmentId,
//         items,
//       });

//       toast.success("Assessment submitted successfully!");
//       closeModal();
//       await fetchData();
//     } catch (error) {
//       toast.error("Failed to submit.");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleL2Approve = async () => {
//     setL2ActionLoading(true);
//     try {
//       const items = (modalData.items || [])
//         .map((item) => {
//           const fieldData = modalRatings[item.detailId];
//           if (
//             fieldData &&
//             fieldData.rating &&
//             fieldData.comment &&
//             fieldData.comment.trim().length > 0
//           ) {
//             return {
//               detailId: item.detailId,
//               rating: Number(fieldData.rating),
//               comments: fieldData.comment,
//             };
//           }
//           if (
//             item.reviewerRating &&
//             item.reviewerRating > 0 &&
//             item.reviewerComments
//           ) {
//             return {
//               detailId: item.detailId,
//               rating: item.reviewerRating,
//               comments: item.reviewerComments,
//             };
//           }
//           return null;
//         })
//         .filter((item) => item !== null);

//       if (items.length !== (modalData.items || []).length) {
//         toast.error("Please complete all items.");
//         setL2ActionLoading(false);
//         return;
//       }

//       await api.post(`/reviewer/${userId}/reviews`, {
//         assessmentId: modalData.assessmentId,
//         items,
//       });

//       await api.post(
//         `/reviewer/${userId}/decision?assessmentId=${modalData.assessmentId}&decision=approved`,
//         "",
//         { headers: { "Content-Type": "application/json" } }
//       );

//       toast.success("Review approved successfully!");
//       closeModal();
//       await fetchData();
//     } catch (error) {
//       toast.error("Failed to approve.");
//     } finally {
//       setL2ActionLoading(false);
//     }
//   };

//   const handleL2Reject = async () => {
//     if (!rejectionReason.trim()) {
//       toast.error("Please provide a rejection reason.");
//       return;
//     }

//     setL2ActionLoading(true);
//     try {
//       await api.post(
//         `/reviewer/${userId}/decision?assessmentId=${modalData.assessmentId}&decision=rejected`,
//         rejectionReason,
//         { headers: { "Content-Type": "application/json" } }
//       );

//       toast.success("Review rejected and returned to L1.");
//       closeModal();
//       await fetchData();
//     } catch (error) {
//       toast.error("Failed to reject.");
//     } finally {
//       setL2ActionLoading(false);
//     }
//   };

//   function renderL1Table() {
//     const categories = getL1Categories(allL1);
//     const tabs = [
//       { key: "Pending", label: "Pending L1 Review", subs: categories.pending },
//       { key: "Submitted", label: "Awaiting L2 / Approved", subs: categories.submitted },
//       { key: "Rejected", label: "Rejected (Rework)", subs: categories.rejected },
//     ];

//     const currentSubs = tabs.find((t) => t.key === activeL1Tab)?.subs || [];

//     return (
//       <>
//         <div className="tl-tabs-bar">
//           {tabs.map((tab) => (
//             <button
//               key={tab.key}
//               className={`tl-tab ${activeL1Tab === tab.key ? "active" : ""}`}
//               onClick={() => setActiveL1Tab(tab.key)}
//             >
//               {tab.label}
//               <span className="tl-count">{tab.subs.length}</span>
//             </button>
//           ))}
//         </div>

//         {currentSubs.length === 0 ? (
//           <div className="tl-empty">
//             <i className="bi bi-inbox"></i>
//             <p>No submissions</p>
//           </div>
//         ) : (
//           <table className="tl-table">
//             <thead>
//               <tr>
//                 <th>Employee</th>
//                 <th>Form</th>
//                 <th>Emp Avg</th>
//                 <th>Status</th>
//                 <th>Date</th>
//                 <th>Action</th>
//               </tr>
//             </thead>
//             <tbody>
//               {currentSubs.map((assess) => {
//                 const avgRating = calculateAverageRating(assess.items);
//                 const l1Complete = isL1Complete(assess);
//                 const showReviewBtn = !l1Complete || assess.l2Decision === "Rejected";

//                 return (
//                   <tr key={assess.assessmentId}>
//                     <td className="tl-emp">{assess.employeeName}</td>
//                     <td>{assess.formName}</td>
//                     <td className="tl-center">
//                       <span className="tl-badge tl-badge-emp">{avgRating}/5</span>
//                     </td>
//                     <td>
//                       <span
//                         className={`tl-badge tl-badge-${
//                           assess.l2Decision === "Rejected"
//                             ? "rejected"
//                             : l1Complete
//                             ? "submitted"
//                             : "pending"
//                         }`}
//                       >
//                         {assess.l2Decision === "Rejected"
//                           ? "Rejected"
//                           : l1Complete
//                           ? "Submitted"
//                           : "Pending"}
//                       </span>
//                     </td>
//                     <td>{new Date(assess.submittedAt).toLocaleDateString()}</td>
//                     <td>
//                       {showReviewBtn && (
//                         <button className="tl-btn-action" onClick={() => openModal(assess)}>
//                           <i className="bi bi-pencil-square"></i>
//                           Review & Submit
//                         </button>
//                       )}
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         )}
//       </>
//     );
//   }

//   function renderL2Table() {
//     return l2Subs.length === 0 ? (
//       <div className="tl-empty">
//         <i className="bi bi-inbox"></i>
//         <p>No submissions</p>
//       </div>
//     ) : (
//       <table className="tl-table">
//         <thead>
//           <tr>
//             <th>Employee</th>
//             <th>Form</th>
//             <th>Emp Avg</th>
//             <th>L1 Avg</th>
//             <th>Status</th>
//             <th>Date</th>
//             <th>Action</th>
//           </tr>
//         </thead>
//         <tbody>
//           {l2Subs.map((assess) => {
//             const empAvg = calculateAverageRating(assess.items);
//             const l1AvgRating = (assess.items || [])
//               .filter((i) => i.approverRating && i.approverRating > 0)
//               .reduce((a, b) => a + b.approverRating, 0);
//             const l1Avg =
//               assess.items && assess.items.length > 0
//                 ? (
//                     l1AvgRating /
//                     (assess.items || []).filter((i) => i.approverRating && i.approverRating > 0)
//                       .length
//                   ).toFixed(2)
//                 : 0;

//             return (
//               <tr key={assess.assessmentId}>
//                 <td className="tl-emp">{assess.employeeName}</td>
//                 <td>{assess.formName}</td>
//                 <td className="tl-center">
//                   <span className="tl-badge tl-badge-emp">{empAvg}/5</span>
//                 </td>
//                 <td className="tl-center">
//                   <span className="tl-badge tl-badge-l1">{l1Avg}/5</span>
//                 </td>
//                 <td>
//                   <span className="tl-badge tl-badge-pending">Awaiting</span>
//                 </td>
//                 <td>{new Date(assess.submittedAt).toLocaleDateString()}</td>
//                 <td>
//                   <button className="tl-btn-action" onClick={() => openModal(assess)}>
//                     <i className="bi bi-pencil-square"></i>
//                     Review
//                   </button>
//                 </td>
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>
//     );
//   }

//   return (
//     <div className="tl-page">
//       <Toaster position="top-right" richColors />

//       <div className="tl-header">
//         <h1 className="tl-title">
//           <i className="bi bi-graph-up"></i>
//           Performance Review Dashboard
//         </h1>
//         <div className="tl-toggle">
//           <button
//             className={`tl-toggle-btn ${active === "l1" ? "active" : ""}`}
//             onClick={() => {
//               setActive("l1");
//               setActiveL1Tab("Pending");
//             }}
//           >
//             <i className="bi bi-person-check"></i>
//             L1 Approver
//           </button>
//           <button
//             className={`tl-toggle-btn ${active === "l2" ? "active" : ""}`}
//             onClick={() => setActive("l2")}
//           >
//             <i className="bi bi-person-check-fill"></i>
//             L2 Reviewer
//           </button>
//         </div>
//       </div>

//       <div className="tl-content">
//         {loading ? (
//           <div className="tl-loading">
//             <div className="tl-spinner"></div>
//             <p>Loading...</p>
//           </div>
//         ) : (
//           <>
//             {active === "l1" && renderL1Table()}
//             {active === "l2" && renderL2Table()}
//           </>
//         )}
//       </div>

//       {showModal && modalData && (
//         <div className="tl-modal-overlay" onClick={closeModal}>
//           <div className="tl-modal" onClick={(e) => e.stopPropagation()}>
//             <div className="tl-modal-header">
//               <h2>{active === "l1" ? "L1 Review" : "L2 Review"}</h2>
//               <button className="tl-modal-close" onClick={closeModal}>
//                 <i className="bi bi-x-lg"></i>
//               </button>
//             </div>

//             <div className="tl-modal-info">
//               <div className="tl-info-item">
//                 <span className="tl-label">Employee</span>
//                 <span className="tl-value">{modalData.employeeName}</span>
//               </div>
//               <div className="tl-info-item">
//                 <span className="tl-label">Form</span>
//                 <span className="tl-value">{modalData.formName}</span>
//               </div>
//             </div>

//             {active === "l1" && modalData.l2Decision === "Rejected" && (
//               <div className="tl-rejection">
//                 <div className="tl-rejection-header">
//                   <i className="bi bi-exclamation-circle-fill"></i>
//                   L2 Rejection Reason
//                 </div>
//                 <p>{modalData.l2DecisionNote || "No reason provided"}</p>
//               </div>
//             )}

//             <div className="tl-modal-body">
//               <table className="tl-modal-table">
//                 <thead>
//                   <tr>
//                     <th>Competency</th>
//                     {active === "l2" && <th>Emp Rating</th>}
//                     {active === "l2" && <th>Emp Comments</th>}
//                     {active === "l2" && <th>L1 Rating</th>}
//                     {active === "l2" && <th>L1 Comments</th>}
//                     {active === "l1" && <th>Emp Rating</th>}
//                     {active === "l1" && <th>Emp Comments</th>}
//                     <th>Your Rating</th>
//                     <th>Your Comments</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {(modalData.items || []).map((item) => (
//                     <tr key={item.detailId}>
//                       <td className="tl-comp">{item.competencyName}</td>
//                       {active === "l2" && <td className="tl-center">{item.employeeRating ?? "-"}</td>}
//                       {active === "l2" && <td>{item.employeeComments || "-"}</td>}
//                       {active === "l2" && <td className="tl-center">{item.approverRating ?? "-"}</td>}
//                       {active === "l2" && <td>{item.approverComments || "-"}</td>}
//                       {active === "l1" && <td className="tl-center">{item.employeeRating ?? "-"}</td>}
//                       {active === "l1" && <td>{item.employeeComments || "-"}</td>}
//                       <td className="tl-center">
//                         <input
//                           type="number"
//                           min="1"
//                           max="5"
//                           value={modalRatings[item.detailId]?.rating || ""}
//                           onChange={(e) =>
//                             handleRatingChange(item.detailId, "rating", e.target.value)
//                           }
//                           className="tl-input-num"
//                           placeholder="-"
//                         />
//                       </td>
//                       <td>
//                         <input
//                           type="text"
//                           value={modalRatings[item.detailId]?.comment || ""}
//                           onChange={(e) =>
//                             handleRatingChange(item.detailId, "comment", e.target.value)
//                           }
//                           className="tl-input-text"
//                           placeholder="Add comments..."
//                         />
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             <div className="tl-modal-footer">
//               <button className="tl-btn tl-btn-cancel" onClick={closeModal}>
//                 <i className="bi bi-x-circle"></i>
//                 Cancel
//               </button>
//               {active === "l1" && (
//                 <button
//                   className="tl-btn tl-btn-primary"
//                   onClick={handleL1Submit}
//                   disabled={submitting}
//                 >
//                   <i className="bi bi-check-circle"></i>
//                   {submitting ? "Submitting..." : "Submit Review"}
//                 </button>
//               )}
//               {active === "l2" && (
//                 <>
//                   <button
//                     className="tl-btn tl-btn-success"
//                     onClick={handleL2Approve}
//                     disabled={l2ActionLoading}
//                   >
//                     <i className="bi bi-check-lg"></i>
//                     {l2ActionLoading ? "Processing..." : "Submit & Approve"}
//                   </button>
//                   <button
//                     className="tl-btn tl-btn-danger"
//                     onClick={() => setShowRejectReason(!showRejectReason)}
//                     disabled={l2ActionLoading}
//                   >
//                     <i className="bi bi-x-lg"></i>
//                     Reject
//                   </button>
//                 </>
//               )}
//             </div>

//             {active === "l2" && showRejectReason && (
//               <div className="tl-reject-box">
//                 <label>
//                   <i className="bi bi-exclamation-triangle"></i>
//                   Rejection Reason
//                 </label>
//                 <textarea
//                   value={rejectionReason}
//                   onChange={(e) => setRejectionReason(e.target.value)}
//                   placeholder="Provide reason..."
//                   className="tl-textarea"
//                 />
//                 <div className="tl-reject-actions">
//                   <button
//                     className="tl-btn tl-btn-danger-confirm"
//                     onClick={handleL2Reject}
//                     disabled={!rejectionReason.trim() || l2ActionLoading}
//                   >
//                     <i className="bi bi-check"></i>
//                     Confirm Rejection
//                   </button>
//                   <button className="tl-btn tl-btn-cancel" onClick={() => setShowRejectReason(false)}>
//                     <i className="bi bi-x"></i>
//                     Cancel
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default TeamLeadPage;


import React, { useState, useEffect } from "react";
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
          api.get(`/approver/${userId}/assessments`, {
            params: { page: 1, pageSize: 25 },
          }),
          api
            .get(`/approver/${userId}/rework-forms`, {
              params: { page: 1, pageSize: 25 },
            })
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
              const detailResp = await api.get(
                `/approver/${userId}/assessment/${assessmentId}`
              );
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
      toast.error("Failed to load submissions.");
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

  const handleRatingChange = (detailId, key, value) => {
    setModalRatings((prev) => ({
      ...prev,
      [detailId]: { ...prev[detailId], [key]: value },
    }));
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

  function renderL1Table() {
    const categories = getL1Categories(allL1);
    const tabs = [
      { key: "Pending", label: "Pending L1 Review", subs: categories.pending },
      { key: "Submitted", label: "Awaiting L2 / Approved", subs: categories.submitted },
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
          <table className="tl-table">
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
                    <td className="tl-emp">{assess.employeeName}</td>
                    <td>{assess.formName}</td>
                    <td className="tl-center">
                      <span className="tl-badge tl-badge-emp">{avgRating}/5</span>
                    </td>
                    <td>
                      <span
                        className={`tl-badge tl-badge-${
                          assess.l2Decision === "Rejected"
                            ? "rejected"
                            : l1Complete
                              ? "submitted"
                              : "pending"
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
                        <button className="tl-btn-action" onClick={() => openModal(assess)}>
                          <i className="bi bi-pencil-square"></i>
                          Review & Submit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
      <table className="tl-table">
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
                ? (
                  l1AvgRating /
                  (assess.items || []).filter((i) => i.approverRating && i.approverRating > 0)
                    .length
                ).toFixed(2)
                : 0;

            return (
              <tr key={assess.assessmentId}>
                <td className="tl-emp">{assess.employeeName}</td>
                <td>{assess.formName}</td>
                <td className="tl-center">
                  <span className="tl-badge tl-badge-emp">{empAvg}/5</span>
                </td>
                <td className="tl-center">
                  <span className="tl-badge tl-badge-l1">{l1Avg}/5</span>
                </td>
                <td>
                  <span className="tl-badge tl-badge-pending">Awaiting</span>
                </td>
                <td>{new Date(assess.submittedAt).toLocaleDateString()}</td>
                <td>
                  <button className="tl-btn-action" onClick={() => openModal(assess)}>
                    <i className="bi bi-pencil-square"></i>
                    Review
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <div className="tl-page">
      <Toaster position="top-right" richColors />

      <div className="tl-header">
        <h1 className="tl-title">
          <i className="bi bi-graph-up"></i>
          Performance Review Dashboard
        </h1>
        <div className="tl-toggle">
          <button
            className={`tl-toggle-btn ${active === "l1" ? "active" : ""}`}
            onClick={() => {
              setActive("l1");
              setActiveL1Tab("Pending");
            }}
          >
            <i className="bi bi-person-check"></i>
            L1 Approver
          </button>
          <button
            className={`tl-toggle-btn ${active === "l2" ? "active" : ""}`}
            onClick={() => setActive("l2")}
          >
            <i className="bi bi-person-check-fill"></i>
            L2 Reviewer
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
        />
      )}
    </div>
  );
}

export default TeamLeadPage;
