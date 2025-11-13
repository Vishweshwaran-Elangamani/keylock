import React, { useState, useEffect } from "react";
import api from "../../../services/performancemanagement/hr/api";

const PRIMARY = "#27235C";
const MAGENTA = "#A04A85";

// --- UTILITY FUNCTIONS (Added/Modified) ---

// Helper to determine if an L1 review is complete
const isL1Complete = (assess) => {
    return (assess.items || []).every(item =>
        item.approverRating && item.approverComments && item.approverRating >= 1 && item.approverRating <= 5
    );
};

// CORE FIX: Correctly categorize L1 submissions into three groups
const getL1Categories = (allSubs) => {
    if (!Array.isArray(allSubs)) return { pending: [], submitted: [], rejected: [] };

    const rejected = [];
    const pending = [];
    const submitted = [];

    allSubs.forEach(a => {
        // 1. REJECTED (Highest Priority for L1 rework)
        // A form is rejected if L2 reviewer explicitly set the decision to "Rejected"
        if (a.l2Decision === "Rejected") {
            rejected.push(a);
            return;
        }

        // 2. SUBMITTED (L1 completed, awaiting L2 review or Approved)
        // Check if L1 ratings are complete AND it's not rejected
        if (isL1Complete(a)) {
            submitted.push(a);
            return;
        }

        // 3. PENDING (L1 incomplete, no L2 decision yet)
        // If not rejected and L1 is not complete, it's pending initial L1 review
        pending.push(a);
    });

    return { pending, submitted, rejected };
};
// --- END UTILITY FUNCTIONS ---

function TeamLeadPage() {
    // ✅ Get manager ID from JWT token (same as employee page)
    const user = JSON.parse(localStorage.getItem("user"));
    const empId = user ? user.empId : null;
    const [userId] = useState(() => empId);
    
    const [active, setActive] = useState("l1");
    // FIX: Added new state to manage the L1 sub-tabs
    const [activeL1Tab, setActiveL1Tab] = useState("Pending"); 
    const [l1Subs, setL1Subs] = useState([]);
    const [allL1, setAllL1] = useState([]);
    const [l2Subs, setL2Subs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(null);
    const [msg, setMsg] = useState("");
    const [lastUserIdLoaded, setLastUserIdLoaded] = useState("");
    const [editingL1, setEditingL1] = useState(null); // For L1 initial or rework input UI
    const [l1Ratings, setL1Ratings] = useState({});
    const [editingRework, setEditingRework] = useState(null);
    const [reworkRatings, setReworkRatings] = useState({});
    const [resubmitting, setResubmitting] = useState(false);
    const [submittingL1, setSubmittingL1] = useState(false);
    const [l2ReviewFields, setL2ReviewFields] = useState({});
    const [submittingL2, setSubmittingL2] = useState(null);
    const [l2ActionLoading, setL2ActionLoading] = useState({});
    const [showRejectBox, setShowRejectBox] = useState({});
    const [rejectionInput, setRejectionInput] = useState({});

    // ✅ Auto-fetch data on mount when userId is available
    useEffect(() => {
        if (userId) {
            setLastUserIdLoaded(userId);
            fetchForActiveTab();
            fetchAllL1Assessments();
        }
    }, [userId]);

    // On tab change, re-fetch and reset
    useEffect(() => {
        if (lastUserIdLoaded && userId && userId === lastUserIdLoaded) {
            fetchForActiveTab();
            fetchAllL1Assessments();
        }
        setEditingL1(null);
        setEditingRework(null);
        // FIX: Reset L1 sub-tab when main role tab changes
        setActiveL1Tab("Pending"); 
        // eslint-disable-next-line
    }, [active]);

    // Fetch assignments for current tab (L1 or L2)
    const fetchForActiveTab = async () => {
        setMsg("");
        setLoading(true);
        try {
            if (active === "l1") {
                // L1Subs state is not strictly needed for rendering L1 forms once allL1 is used, 
                // but kept for existing logic and to hold the primary list.
                const resp = await api.get(`/approver/${userId}/assessments`, {
                    params: { page: 1, pageSize: 25 }
                });
                // Backend may return different shapes (array, { data: [...] }, { data: { assessments: [...] } }, etc.).
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
                setL1Subs(assessments);
            } else {
                const resp = await api.get(`/reviewer/${userId}/assessments/full`, {
                    params: { page: 1, pageSize: 25 }
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
            setMsg("Failed to load submissions.");
            setL1Subs([]);
            setL2Subs([]);
        } finally {
            setLoading(false);
        }
    };

    // ============ CRITICAL FIX: Fetch both pending AND rejected assessments with FULL DETAILS ============
    const fetchAllL1Assessments = async () => {
        try {
            setLoading(true);
            
            // Fetch both pending/submitted and rejected assessments in parallel
            const [pendingResp, reworkResp] = await Promise.all([
                api.get(`/approver/${userId}/assessments`, {
                    params: { page: 1, pageSize: 25 }
                }),
                api.get(`/approver/${userId}/rework-forms`, {
                    params: { page: 1, pageSize: 25 }
                })
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
            
            // ============ FIX: Fetch FULL details for ALL assessments ============
            // This ensures we have the items array with competencies for ALL forms
            const allAssessmentIds = [
                ...pendingAssessments.map(a => a.assessmentId),
                ...reworkAssessmentsList.map(a => a.assessmentId)
            ];

            const allWithDetails = await Promise.all(
                allAssessmentIds.map(async (assessmentId) => {
                    try {
                        const detailResp = await api.get(`/approver/${userId}/assessment/${assessmentId}`);
                        return detailResp.data;
                    } catch (err) {
                        console.error(`Failed to fetch details for assessment ${assessmentId}:`, err);
                        // Fallback to original data from list
                        return pendingAssessments.find(a => a.assessmentId === assessmentId) 
                            || reworkAssessmentsList.find(a => a.assessmentId === assessmentId);
                    }
                })
            );

            // Fetch decision notes for all assessments
            const withNotes = await Promise.all(allWithDetails.map(async (a) => {
                try {
                    const decisionResp = await api.get(`/approver/${userId}/assessment/${a.assessmentId}/decision`);
                    return {
                        ...a,
                        l2DecisionNote: decisionResp.data?.note || "",
                        l2Decision: decisionResp.data?.decision || "", 
                    };
                } catch {
                    return a;
                }
            }));

            setAllL1(withNotes);
            setL1Subs(withNotes);
        } catch (error) {
            console.error("Error fetching L1 assessments:", error);
            setAllL1([]);
            setL1Subs([]);
        } finally {
            setLoading(false);
        }
    };

    // Load UI for initial L1 rating (if pending), or for rejected for rework
    const openL1Edit = (assess) => {
        setEditingL1(assess);
        // Prefill if available, else empty
        const ratings = {};
        (assess.items || []).forEach(item => {
            ratings[item.detailId] = {
                rating: item.approverRating ?? "",
                comment: item.approverComments ?? "",
            };
        });
        setL1Ratings(ratings);
        setEditingRework(null); // Hide rework panel if showing
    };

    const handleL1RatingField = (detailId, key, value) => {
        setL1Ratings(prev => ({
            ...prev,
            [detailId]: { ...prev[detailId], [key]: value }
        }));
    };

    // Submit initial L1 ratings OR rework after rejection
    const handleL1Submit = async (assessment, isRework = false) => {
        setSubmittingL1(true);
        setMsg("");
        try {
            const items = (assessment.items || []).map(item => ({
                detailId: item.detailId,
                rating: Number(l1Ratings[item.detailId]?.rating),
                comments: l1Ratings[item.detailId]?.comment,
            }));

            if (!items.every(it => it.rating && !isNaN(it.rating) && it.rating >= 1 && it.rating <= 5 && it.comments && it.comments.trim().length > 0)) {
                setMsg("Please fill all ratings and comments before submitting.");
                setSubmittingL1(false);
                return;
            }

            await api.post(`/approver/${userId}/reviews`, {
                assessmentId: assessment.assessmentId,
                items,
            });

            setMsg(isRework ? "Rework resubmitted successfully! L2 Reviewer will now review your changes." : "Assessment submitted and forwarded to L2 reviewer.");
            setEditingL1(null);
            setEditingRework(null);
            // Re-fetch ALL L1 to get updated status/categories
            await fetchForActiveTab(); 
            await fetchAllL1Assessments();
        } catch (error) {
            setMsg(isRework ? "Failed to resubmit rework." : "Failed to submit assessment.");
        } finally {
            setSubmittingL1(false);
        }
    };

    // L2 Tab logic: load reviewable fields
    useEffect(() => {
        if (active === "l2") {
            const current = l2Subs.find(a => a.assessmentId === expanded);
            if (!current) {
                setL2ReviewFields({});
                return;
            }
            const fieldMap = {};
            (current.items || []).forEach(item => {
                if (item.reviewerRating == null || item.reviewerComments == null) {
                    fieldMap[item.detailId] = {
                        rating: "",
                        comments: ""
                    };
                }
            });
            setL2ReviewFields(fieldMap);
        }
    }, [active, l2Subs, expanded]);

    // L2 field change handler
    const handleL2FieldChange = (detailId, key, value) => {
        setL2ReviewFields(prev => ({
            ...prev,
            [detailId]: { ...prev[detailId], [key]: value }
        }));
    };

    // Submit L2 review fields
    const handleL2Submit = async (assessment) => {

        setSubmittingL2(assessment.assessmentId);
    
        setMsg("");
    
        try {
    
            // ✅ FIX: Submit ALL items with new ratings from the form
    
            const itemsToSubmit = (assessment.items || [])
    
                .map(item => {
    
                    const fieldData = l2ReviewFields[item.detailId];
    
                    // Check if user has entered NEW ratings in the form
    
                    if (fieldData && fieldData.rating && fieldData.comments) {
    
                        return {
    
                            detailId: item.detailId,
    
                            rating: Number(fieldData.rating),
    
                            comments: fieldData.comments
    
                        };
    
                    }
    
                    return null;
    
                })
    
                .filter(item => item !== null && item.rating && item.comments && item.comments.trim().length > 0);
     
            // Validate that user filled in ratings for ALL items
    
            const totalItems = (assessment.items || []).length;
    
            if (itemsToSubmit.length === 0) {
    
                setMsg("Please provide ratings and comments for all items.");
    
                setSubmittingL2(null);
    
                return;
    
            }
     
            if (itemsToSubmit.length < totalItems) {
    
                setMsg(`Please complete all ${totalItems} items. You've only filled ${itemsToSubmit.length}.`);
    
                setSubmittingL2(null);
    
                return;
    
            }
     
            // Submit the new ratings
    
            await api.post(
    
                `/reviewer/${userId}/reviews`,
    
                { assessmentId: assessment.assessmentId, items: itemsToSubmit }
    
            );
    
            setMsg("L2 reviews submitted successfully!");
    
            setL2ReviewFields({});  // Clear the form fields

            await fetchForActiveTab();  // Refresh the list
    
            await fetchAllL1Assessments();
     
    
        } catch (error) {
    
            setMsg("Failed to submit L2 review.");
    
        } finally {
    
            setSubmittingL2(null);
    
        }
    
    };
    
     
     
     
     
     

    // L2 Approve/Reject Decision
    const submitL2Decision = async (assessmentId, decision, comment = "") => {
        setL2ActionLoading(prev => ({ ...prev, [assessmentId]: true }));
        setMsg("");
        try {
            await api.post(
                `/reviewer/${userId}/decision?assessmentId=${assessmentId}&decision=${decision}`,
                decision === "rejected" ? comment : "",
                { headers: { "Content-Type": "application/json" } }
            );
            setMsg(decision === "approved"
                ? "Review approved successfully."
                : "Review rejected and returned to L1.");
            setShowRejectBox(prev => ({ ...prev, [assessmentId]: false }));
            setRejectionInput(prev => ({ ...prev, [assessmentId]: "" }));
            // Must re-fetch ALL L1 assessments to update the L1 dashboard with the rejection status
            await fetchForActiveTab();
            await fetchAllL1Assessments(); 
        } catch (error) {
            setMsg("Failed to submit L2 decision.");
        } finally {
            setL2ActionLoading(prev => ({ ...prev, [assessmentId]: false }));
        }
    };

    // Load button + main view logic
    const handleLoad = async () => {
        setMsg("");
        setExpanded(null);
        const normalizedUserId = typeof userId === "string" ? userId.trim() : userId;
        if (!normalizedUserId && normalizedUserId !== 0) {
            setMsg("Please enter your User ID.");
            return;
        }
        setLastUserIdLoaded(normalizedUserId);
        await fetchForActiveTab();
        await fetchAllL1Assessments();
    };

    // --- NEW L1 SUB-TAB RENDERING FUNCTION ---
    function renderL1Tabs(allSubs, activeTab, setActiveTab) {
        const categories = getL1Categories(allSubs);
        const tabs = [
            { key: "Pending", label: "Pending L1 Review", count: categories.pending.length, subs: categories.pending, color: PRIMARY },
            { key: "Submitted", label: "Awaiting L2 Review / Approved", count: categories.submitted.length, subs: categories.submitted, color: PRIMARY },
            { key: "Rejected", label: "Rejected (Rework Required)", count: categories.rejected.length, subs: categories.rejected, color: "#d8385e" },
        ];
        
        const currentSubs = tabs.find(t => t.key === activeTab)?.subs || [];
        const currentTabColor = tabs.find(t => t.key === activeTab)?.color || PRIMARY;

        return (
            <>
                {/* Tab Buttons */}
                <div style={{
                    marginBottom: 30,
                    display: "inline-flex",
                    background: "#fff",
                    borderRadius: 12,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    padding: 4
                }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => {
                                setActiveTab(tab.key);
                                setExpanded(null); // Collapse expanded views on tab switch
                                setEditingL1(null);
                            }}
                            style={{
                                background: activeTab === tab.key ? tab.color : "transparent",
                                color: activeTab === tab.key ? "#fff" : tab.color,
                                border: "none",
                                fontSize: 15,
                                fontWeight: 600,
                                borderRadius: 8,
                                padding: "12px 24px",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            {tab.label}
                            <span style={{
                                background: activeTab === tab.key ? "#fff" : tab.color,
                                color: activeTab === tab.key ? tab.color : "#fff",
                                borderRadius: 6,
                                fontSize: 13,
                                fontWeight: 700,
                                padding: "2px 8px",
                                marginLeft: 8
                            }}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Render the Forms Table for the currently active L1 tab */}
                {renderTable(currentSubs, "l1", expanded, setExpanded, currentTabColor)}
            </>
        );
    }
    // --- END NEW L1 SUB-TAB RENDERING FUNCTION ---
    
    // L1 Table: display assessments. Show Edit button if L1 pending, or if l2Decision is "Rejected".
    function renderTable(subs, role, expandedId, setExpanded, headerColor = PRIMARY) {
        return (
            <>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 16,
                    fontWeight: 700,
                    fontSize: 18,
                    color: headerColor,
                }}>
                    {role === "l1" ? `L1 Approver: ${activeL1Tab}` : "L2 Reviewer Submissions"}
                    <span style={{
                        background: headerColor,
                        color: "#fff",
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        padding: "3px 14px",
                        marginLeft: 14
                    }}>
                        {subs.length}
                    </span>
                </div>
                {loading && <div style={{ color: PRIMARY, fontSize: 15 }}>Loading submissions...</div>}
                {!loading && subs.length === 0 && (
                    <div style={{ color: "#999", marginBottom: 8, fontSize: 15 }}>No submissions found in this category.</div>
                )}

                {subs.map(assess => {
                    const l1Complete = isL1Complete(assess);
                    // L1 can edit if it's pending initial review OR if it was rejected by L2
                    const showEdit = (role === "l1" && (!l1Complete || assess.l2Decision === "Rejected"));

                    return (
                        <div key={assess.assessmentId} style={{ marginBottom: 20, borderBottom: "1.5px solid #e8e4f0", paddingBottom: 14 }}>
                            <div style={{ fontWeight: 600, fontSize: 17, color: "#222", marginBottom: 4 }}>
                                {assess.employeeName}
                                <span style={{ fontWeight: 400, color: "#555", fontSize: 14, marginLeft: 16 }}>
                                    {assess.formName}
                                </span>
                                {assess.l2Decision === "Rejected" && (
                                    <span style={{
                                        marginLeft: 14,
                                        background: "#d8385e",
                                        color: "#fff",
                                        borderRadius: 6,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        padding: "2px 8px"
                                    }}>Rejected (Rework)</span>
                                )}
                                {/* Status tag for Submitted L1 forms */}
                                {role === "l1" && l1Complete && assess.l2Decision !== "Rejected" && (
                                    <span style={{
                                        marginLeft: 14,
                                        background: "#28a745",
                                        color: "#fff",
                                        borderRadius: 6,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        padding: "2px 8px"
                                    }}>Submitted</span>
                                )}
                            </div>
                            <div style={{ color: "#666", fontSize: 13, marginBottom: 10 }}>
                                Project: {assess.project} | Submitted: {assess.submittedAt ? new Date(assess.submittedAt).toLocaleString() : "N/A"}
                            </div>
                            <button
                                style={{
                                    margin: "6px 0 12px 0",
                                    color: role === "l1" ? PRIMARY : MAGENTA,
                                    background: "none",
                                    border: "none",
                                    fontWeight: 600,
                                    fontSize: 15,
                                    cursor: "pointer",
                                    textDecoration: "underline"
                                }}
                                onClick={() => setExpanded(prev => prev === assess.assessmentId ? null : assess.assessmentId)}
                            >
                                {expandedId === assess.assessmentId ? "▲ Hide Details" : "▼ Show Details"}
                            </button>
                            {expandedId === assess.assessmentId &&
                                <div style={{ marginTop: 12 }}>
                                    <table style={{
                                        width: "100%",
                                        background: "#fff",
                                        borderRadius: 10,
                                        fontSize: 14,
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                        overflow: "hidden"
                                    }}>
                                        <thead>
                                            <tr>
                                                <th style={thStyle(role)}>Competency</th>
                                                <th style={thStyle(role)}>Employee Rating</th>
                                                <th style={thStyle(role)}>Employee Comments</th>
                                                <th style={thStyle(role)}>Approver Rating</th>
                                                <th style={thStyle(role)}>Approver Comments</th>
                                                {role === "l2" && (
                                                    <>
                                                        <th style={thStyle(role)}>Reviewer Rating</th>
                                                        <th style={thStyle(role)}>Reviewer Comments</th>
                                                    </>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(assess.items || []).map((detail, idx) => (
                                                <tr key={detail.detailId} style={{
                                                    background: idx % 2 === 0 ? "#fafafa" : "#fff"
                                                }}>
                                                    <td style={tdStyle}>{detail.competencyName}</td>
                                                    <td style={tdStyleCenter}>{detail.employeeRating ?? "-"}</td>
                                                    <td style={tdStyle}>{detail.employeeComments || "-"}</td>
                                                    <td style={tdStyleCenter}>{detail.approverRating ?? "-"}</td>
                                                    <td style={tdStyle}>{detail.approverComments || "-"}</td>
                                                    {role === "l2" && (
                                                        <>
                                                            <td style={tdStyleCenter}>
                                                                {detail.reviewerRating != null && detail.reviewerRating >= 1 ? (
                                                                    <span style={{ fontWeight: 600, color: "#27235C" }}>
                                                                        {detail.reviewerRating}
                                                                    </span>
                                                                ) : (
                                                                    <input
                                                                        type="number"
                                                                        min={1}
                                                                        max={5}
                                                                        value={l2ReviewFields[detail.detailId]?.rating || ""}
                                                                        style={{
                                                                            width: 55,
                                                                            padding: "6px 10px",
                                                                            borderRadius: 6,
                                                                            border: "2px solid #A04A85",
                                                                            fontSize: 14,
                                                                            fontWeight: 600,
                                                                        }}
                                                                        placeholder="-"
                                                                        onChange={(e) =>
                                                                            handleL2FieldChange(detail.detailId, "rating", e.target.value)
                                                                        }
                                                                    />
                                                                )}
                                                            </td>
                                                            <td style={tdStyle}>
                                                                {detail.reviewerComments &&
                                                                    detail.reviewerComments.trim().length > 0 &&
                                                                    detail.reviewerRating != null &&
                                                                    detail.reviewerRating >= 1 ? (
                                                                    <span style={{ color: "#555" }}>{detail.reviewerComments}</span>
                                                                ) : (
                                                                    <input
                                                                        type="text"
                                                                        style={{
                                                                            width: "100%",
                                                                            padding: "6px 10px",
                                                                            borderRadius: 6,
                                                                            border: "2px solid #A04A85",
                                                                            fontSize: 14,
                                                                        }}
                                                                        value={l2ReviewFields[detail.detailId]?.comments || ""}
                                                                        placeholder="Enter your review comments"
                                                                        onChange={(e) =>
                                                                            handleL2FieldChange(detail.detailId, "comments", e.target.value)
                                                                        }
                                                                    />
                                                                )}
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {role === "l2" && (
                                        <>
                                            <button
                                                style={{
                                                    background: MAGENTA,
                                                    color: "#fff",
                                                    border: "none",
                                                    padding: "11px 32px",
                                                    borderRadius: 9,
                                                    fontSize: 15,
                                                    fontWeight: 700,
                                                    marginTop: 18,
                                                    cursor: "pointer",
                                                    boxShadow: "0 2px 6px rgba(160, 74, 133, 0.3)",
                                                    transition: "all 0.2s"
                                                }}
                                                disabled={submittingL2 === assess.assessmentId}
                                                onClick={() => handleL2Submit(assess)}
                                            >
                                                {submittingL2 === assess.assessmentId ? "Submitting..." : "Submit Review & Approve"}
                                            </button>
                                            <button
                                                style={{
                                                    background: "#d8385e",
                                                    color: "#fff",
                                                    border: "none",
                                                    padding: "11px 28px",
                                                    borderRadius: 9,
                                                    fontSize: 15,
                                                    fontWeight: 700,
                                                    marginTop: 18,
                                                    marginLeft: 18,
                                                    cursor: "pointer",
                                                    boxShadow: "0 2px 6px rgba(216, 56, 94, 0.3)",
                                                    transition: "all 0.2s"
                                                }}
                                                disabled={l2ActionLoading[assess.assessmentId]}
                                                onClick={() => setShowRejectBox(prev => ({ ...prev, [assess.assessmentId]: !prev[assess.assessmentId] }))}
                                            >
                                                Reject & Return to L1
                                            </button>

                                            {showRejectBox[assess.assessmentId] && (
                                                <div style={{ marginTop: 16, maxWidth: 600 }}>
                                                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#d8385e", fontSize: 14 }}>
                                                        Rejection Reason (will be sent to L1 Approver):
                                                    </label>
                                                    <textarea
                                                        rows={4}
                                                        style={{ width: "100%", padding: 12, borderRadius: 8, border: "2px solid #d8385e", fontSize: 15, resize: "vertical", fontFamily: "inherit" }}
                                                        placeholder="Please provide a clear reason for rejection..."
                                                        value={rejectionInput[assess.assessmentId] || ""}
                                                        onChange={e => setRejectionInput(prev => ({ ...prev, [assess.assessmentId]: e.target.value }))}
                                                    />
                                                    <button
                                                        style={{
                                                            marginTop: 10,
                                                            background: "#d8385e",
                                                            color: "#fff",
                                                            border: "none",
                                                            padding: "10px 28px",
                                                            borderRadius: 8,
                                                            fontWeight: 700,
                                                            fontSize: 15,
                                                            cursor: "pointer",
                                                            boxShadow: "0 2px 6px rgba(216, 56, 94, 0.3)"
                                                        }}
                                                        disabled={!rejectionInput[assess.assessmentId]?.trim() || l2ActionLoading[assess.assessmentId]}
                                                        onClick={() => submitL2Decision(assess.assessmentId, "rejected", rejectionInput[assess.assessmentId])}
                                                    >
                                                        {l2ActionLoading[assess.assessmentId] ? "Submitting..." : "Confirm Rejection"}
                                                    </button>
                                                    <button
                                                        style={{
                                                            marginTop: 10,
                                                            marginLeft: 14,
                                                            background: "transparent",
                                                            color: "#666",
                                                            border: "1.5px solid #ccc",
                                                            padding: "10px 28px",
                                                            borderRadius: 8,
                                                            fontWeight: 600,
                                                            fontSize: 15,
                                                            cursor: "pointer"
                                                        }}
                                                        onClick={() => {
                                                            setShowRejectBox(prev => ({ ...prev, [assess.assessmentId]: false }));
                                                            setRejectionInput(prev => ({ ...prev, [assess.assessmentId]: "" }));
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            }
                            {showEdit && (
                                <>
                                    <button
                                        style={{
                                            background: MAGENTA,
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: 8,
                                            padding: "7px 16px",
                                            fontWeight: 600,
                                            fontSize: 15,
                                            marginTop: 10,
                                            marginRight: 7,
                                            cursor: "pointer"
                                        }}
                                        onClick={() => openL1Edit(assess)}
                                    >
                                        {assess.l2Decision === "Rejected" ? "Edit & Resubmit" : "Start / Continue Review"}
                                    </button>
                                </>
                            )}
                            {/* L1 Rating and Comment UI */}
                            {editingL1 && editingL1.assessmentId === assess.assessmentId && (
                                <div style={{
                                    marginTop: 20,
                                    background: "#f6f9ff",
                                    border: `2px solid ${MAGENTA}`,
                                    borderRadius: 8,
                                    padding: "20px 26px"
                                }}>
                                    <h3 style={{
                                        color: MAGENTA,
                                        fontWeight: 700,
                                        fontSize: 16,
                                        marginBottom: 10
                                    }}>
                                        {assess.l2Decision === "Rejected" ? "Rework Required — L2 Rejected" : "Your Review"}
                                    </h3>
                                    {/* Show L2 reason if rejected */}
                                    {assess.l2Decision === "Rejected" && (
                                        <div
                                            style={{
                                                background: "#fee",
                                                border: "2px solid #d8385e",
                                                color: "#d8385e",
                                                borderRadius: 8,
                                                fontWeight: "bold",
                                                padding: "12px 16px",
                                                marginBottom: 16,
                                            }}
                                        >
                                            L2 Reviewer Rejection Reason:
                                            <div style={{ marginTop: 8, fontWeight: 400 }}>
                                                {assess.l2DecisionNote || "No note provided."}
                                            </div>
                                        </div>
                                    )}
                                    <table style={{
                                        width: "100%",
                                        background: "#fff",
                                        marginBottom: 16,
                                        borderRadius: 7,
                                        overflow: "hidden",
                                        fontSize: 15
                                    }}>
                                        <thead>
                                            <tr>
                                                <th style={{ padding: 10, textAlign: "left", fontWeight: 600, color: PRIMARY }}>Competency</th>
                                                <th style={{ padding: 10, textAlign: "center", fontWeight: 600, color: PRIMARY }}>Rating (1-5)</th>
                                                <th style={{ padding: 10, textAlign: "left", fontWeight: 600, color: PRIMARY }}>Comments</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(editingL1.items || []).map(item => (
                                                <tr key={item.detailId}>
                                                    <td style={{ padding: 10 }}>{item.competencyName}</td>
                                                    <td style={{ padding: 10, textAlign: "center" }}>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            max={5}
                                                            value={l1Ratings[item.detailId]?.rating || ""}
                                                            style={{
                                                                width: 55,
                                                                borderRadius: 6,
                                                                border: "2px solid #A04A85",
                                                                padding: "6px 10px",
                                                                fontSize: 15,
                                                                textAlign: "center"
                                                            }}
                                                            placeholder="-"
                                                            onChange={e =>
                                                                handleL1RatingField(item.detailId, "rating", e.target.value)
                                                            }
                                                        />
                                                    </td>
                                                    <td style={{ padding: 10 }}>
                                                        <input
                                                            type="text"
                                                            value={l1Ratings[item.detailId]?.comment || ""}
                                                            style={{
                                                                width: "100%",
                                                                borderRadius: 6,
                                                                border: "2px solid #A04A85",
                                                                padding: "6px 10px",
                                                                fontSize: 15
                                                            }}
                                                            placeholder="Enter your comments"
                                                            onChange={e =>
                                                                handleL1RatingField(item.detailId, "comment", e.target.value)
                                                            }
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button
                                        style={{
                                            background: MAGENTA,
                                            color: "#fff",
                                            borderRadius: 7,
                                            border: "none",
                                            padding: "12px 32px",
                                            fontWeight: 700,
                                            fontSize: 16,
                                            boxShadow: "0 2px 6px rgba(160, 74, 133, 0.2)",
                                            marginTop: 5,
                                            cursor: "pointer"
                                        }}
                                        onClick={() => handleL1Submit(editingL1, assess.l2Decision === "Rejected")}
                                        disabled={submittingL1}
                                    >
                                        {submittingL1 ? "Submitting..." : assess.l2Decision === "Rejected" ? "Resubmit to L2" : "Submit to L2"}
                                    </button>
                                    <button
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: MAGENTA,
                                            marginLeft: 15,
                                            fontWeight: 600,
                                            fontSize: 15,
                                            cursor: "pointer",
                                            textDecoration: "underline"
                                        }}
                                        onClick={() => setEditingL1(null)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </>
        );
    }

    function thStyle(role) {
        return {
            padding: 10,
            color: role === "l1" ? PRIMARY : MAGENTA,
            textAlign: "left",
            fontWeight: 600,
            background: "#f9f8fb",
            border: 0,
            borderBottom: `2.5px solid ${role === "l1" ? PRIMARY : MAGENTA}`,
            fontSize: 13
        };
    }

    const tdStyle = { padding: 10, fontSize: 14, color: "#333" };
    const tdStyleCenter = { ...tdStyle, textAlign: "center" };

    return (
        <div
            style={{
                padding: 40,
                fontFamily: "'Poppins', 'Segoe UI', Arial, sans-serif",
                minHeight: "100vh",
                background: "linear-gradient(135deg, #f6f5fa 0%, #faf9fc 100%)"
            }}
        >
            <div style={{ maxWidth: 1400, margin: "0 auto" }}>
                <h1
                    style={{
                        fontSize: 30,
                        color: PRIMARY,
                        fontWeight: 700,
                        marginBottom: 8,
                        letterSpacing: "0.5px"
                    }}
                >
                    Performance Review Dashboard
                </h1>
                <p style={{
                    color: "#666",
                    fontSize: 15,
                    marginBottom: 28,
                    marginTop: 4
                }}>
                    Manage and review employee performance assessments
                </p>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        background: "#fff",
                        borderRadius: 12,
                        boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
                        padding: 24,
                        maxWidth: 600,
                        marginBottom: 32
                    }}
                >
                    <span style={{
                        color: PRIMARY,
                        fontWeight: 600,
                        fontSize: 15
                    }}>
                        Manager ID: {userId || "Loading..."}
                    </span>
                    {loading && <span style={{
                        marginLeft: 16,
                        fontSize: 14,
                        color: MAGENTA,
                        fontWeight: 600,
                        animation: "pulse 1.5s infinite"
                    }}>Loading data...</span>}
                </div>
                {/* Main Role Tabs (L1 / L2) */}
                <div
                    style={{
                        marginBottom: 32,
                        display: "flex",
                        justifyContent: "flex-start"
                    }}
                >
                    <div
                        style={{
                            background: "#fff",
                            borderRadius: 12,
                            display: "inline-flex",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                            padding: 4
                        }}
                    >
                        <button
                            onClick={() => {
                                setActive("l1");
                                setExpanded(null);
                            }}
                            style={{
                                background: active === "l1" ? PRIMARY : "transparent",
                                color: active === "l1" ? "#fff" : PRIMARY,
                                border: "none",
                                fontSize: 15,
                                fontWeight: 600,
                                borderRadius: 10,
                                padding: "12px 40px",
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                        >
                            L1 Approver
                        </button>
                        <button
                            onClick={() => {
                                setActive("l2");
                                setExpanded(null);
                            }}
                            style={{
                                background: active === "l2" ? MAGENTA : "transparent",
                                color: active === "l2" ? "#fff" : MAGENTA,
                                border: "none",
                                fontSize: 15,
                                fontWeight: 600,
                                borderRadius: 10,
                                padding: "12px 40px",
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                        >
                            L2 Reviewer
                        </button>
                    </div>
                </div>
                {msg && (
                    <div style={{
                        color: msg.includes("successfully") || msg.includes("approved") ? "#28a745" : "#d8385e",
                        fontSize: 15,
                        marginBottom: 20,
                        background: msg.includes("successfully") || msg.includes("approved") ? "#d4edda" : "#fff0f3",
                        padding: "12px 18px",
                        borderRadius: 8,
                        border: `1.5px solid ${msg.includes("successfully") || msg.includes("approved") ? "#c3e6cb" : "#f5c6cb"}`,
                        fontWeight: 600
                    }}>
                        {msg}
                    </div>
                )}

                {/* --- CONDITIONAL RENDERING --- */}
                {lastUserIdLoaded && active === "l1" && (
                    // FIX: Render the L1 sub-tabs and table logic here
                    renderL1Tabs(allL1, activeL1Tab, setActiveL1Tab)
                )}

                {lastUserIdLoaded && active === "l2" && (
                    renderTable(l2Subs, "l2", expanded, setExpanded)
                )}
                
            </div>
        </div>
    );
}

export default TeamLeadPage;
