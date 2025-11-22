import { useState } from "react";
import { X, CheckCircle, XCircle, Download } from "lucide-react";
import { lndService, downloadFile } from "../../../services/lnd/lndService";
import { APPROVAL_TYPE } from "../../../constants/lnd/lndConstants";
import { toast } from "sonner";

const ApprovalDecisionModal = ({ approval, onClose, onSuccess }) => {
  const [decision, setDecision] = useState(null); // 'approve' or 'reject'
  const [notes, setNotes] = useState("");
  const [newRating, setNewRating] = useState(""); // for completion flow
  const [processing, setProcessing] = useState(false);

  const getApprovalTypeLabel = (type) => {
    const labels = {
      [APPROVAL_TYPE.SME_REGISTRATION]: "SME Registration",
      [APPROVAL_TYPE.SME_REQUEST]: "SME Request",
      [APPROVAL_TYPE.ASSIGNMENT_ACKNOWLEDGEMENT]: "Assignment Acknowledgement",
      [APPROVAL_TYPE.ASSIGNMENT_COMPLETION]: "Assignment Completion",
    };
    return labels[type] || type;
  };

  const handleDownload = async () => {
    try {
      const response = await lndService.downloadApprovalAttachment(
        approval.approvalId
      );
      const filename = `approval_${approval.approvalId}_attachment`;
      downloadFile(response.data, filename);
      toast.success("File downloaded successfully");
    } catch (error) {
      console.error("Failed to download:", error);
      toast.error("Failed to download file");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!decision) {
      toast.error("Please select approve or reject");
      return;
    }

    // Complete assignment approval flow
    if (
      approval.approvalType === APPROVAL_TYPE.ASSIGNMENT_COMPLETION &&
      decision === "approve"
    ) {
      if (
        !newRating ||
        isNaN(newRating) ||
        Number(newRating) < 1 ||
        Number(newRating) > 10
      ) {
        toast.error("Please provide a rating between 1 and 10");
        return;
      }

      try {
        setProcessing(true);

        const data = {
          assignmentId: approval.assignmentId,
          newRating: Number(newRating),
          notes: notes.trim(),
        };

        const response = await lndService.completeAssignment(data);

        if (response.data.success) {
          toast.success("Assignment completed and rating updated!");
          onSuccess();
        } else {
          toast.error(response.data.message || "Failed to complete assignment");
        }
      } catch (error) {
        console.error("Failed to complete assignment:", error);
        toast.error(
          error.response?.data?.message || "Failed to complete assignment"
        );
      } finally {
        setProcessing(false);
      }
      return;
    }

    // Default: other approval types use processApproval
    const isSmeRequest = approval.approvalType === APPROVAL_TYPE.SME_REQUEST;
    const notesToSend = isSmeRequest ? approval.notes || "" : notes.trim();

    if (!isSmeRequest && !notesToSend) {
      toast.error("Please provide notes for your decision");
      return;
    }

    try {
      setProcessing(true);

      const data = {
        approvalId: approval.approvalId,
        isApproved: decision === "approve",
        notes: notesToSend,
      };

      const response = await lndService.processApproval(data);

      if (response.data.success) {
        toast.success(
          `Approval ${
            decision === "approve" ? "approved" : "rejected"
          } successfully!`
        );
        onSuccess();
      } else {
        toast.error(response.data.message || "Failed to process approval");
      }
    } catch (error) {
      console.error("Failed to process approval:", error);
      toast.error(
        error.response?.data?.message || "Failed to process approval"
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { 
              opacity: 0;
              transform: translateY(20px);
            }
            to { 
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          animation: "fadeIn 0.2s ease-in-out",
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#fff",
            borderRadius: "12px",
            width: "100%",
            maxWidth: "600px",
            maxHeight: "90vh",
            overflow: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "1.5rem",
              borderBottom: "1px solid #e5e7eb",
              backgroundColor: "rgb(39, 35, 92)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <h5 style={{ margin: 0, fontWeight: "600", color: "white" }}>
              Review Approval Request
            </h5>
            <button
              type="button"
              class="btn-close-white"
              onClick={onClose}
              style={{
                border: "none",
                width: "36px",
                backgroundColor: "transparent",
                height: "36px",
                borderRadius: "0.5rem",
                cursor: "pointer",
                color: "white",
                fontSize: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "red";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "white";
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Body */}
          <div
            style={{
              flexGrow: 1, // take remaining space
              overflowY: "auto", // scroll only here
              padding: "1.5rem",
            }}
          >
            <form onSubmit={handleSubmit}>
              <div style={{ padding: "1.5rem" }}>
                {/* Approval Info */}
                <div
                  style={{
                    padding: "1rem",
                    background: "#f8f9fa",
                    borderRadius: "8px",
                    marginBottom: "1.5rem",
                    border: "1px solid rgb(39, 35, 92, 0.5)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#6c757d",
                      margin: 0,
                      marginBottom: "0.25rem",
                    }}
                  >
                    Approval Type
                  </p>
                  <p
                    style={{
                      fontSize: "1rem",
                      fontWeight: "600",
                      color: "#212529",
                      margin: 0,
                      marginBottom: "0.75rem",
                    }}
                  >
                    {getApprovalTypeLabel(approval.approvalType)}
                  </p>

                  {approval.skillName && (
                    <>
                      <p
                        style={{
                          fontSize: "0.875rem",
                          color: "#6c757d",
                          margin: 0,
                          marginBottom: "0.25rem",
                        }}
                      >
                        Skill
                      </p>
                      <p
                        style={{
                          fontSize: "1rem",
                          fontWeight: "600",
                          color: "#212529",
                          margin: 0,
                          marginBottom: "0.75rem",
                        }}
                      >
                        {approval.skillName}
                      </p>
                    </>
                  )}

                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#6c757d",
                      margin: 0,
                      marginBottom: "0.25rem",
                    }}
                  >
                    Requested by
                  </p>
                  <p
                    style={{
                      fontSize: "0.9375rem",
                      fontWeight: "500",
                      color: "#212529",
                      margin: 0,
                      marginBottom: "0.75rem",
                    }}
                  >
                    {approval.requesterName}
                  </p>

                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#6c757d",
                      margin: 0,
                      marginBottom: "0.25rem",
                    }}
                  >
                    Requested On
                  </p>
                  <p
                    style={{
                      fontSize: "0.9375rem",
                      fontWeight: "500",
                      color: "#212529",
                      margin: 0,
                    }}
                  >
                    {new Date(approval.requestedOn).toLocaleDateString()}
                  </p>
                </div>

                {/* Download Attachment */}
                {approval.attachmentPath && (
                  <div style={{ marginBottom: "1.5rem" }}>
                    <button
                      type="button"
                      onClick={handleDownload}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        background: "#f8f9fa",
                        border: "1px solid rgb(39, 35, 92, 0.5)",
                        borderRadius: "8px",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        color: "#97247E",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = "#97247E";
                        e.target.style.color = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = "#f8f9fa";
                        e.target.style.color = "#97247E";
                      }}
                    >
                      <Download size={16} />
                      Download Attached Document
                    </button>
                  </div>
                )}

                {/* Decision Buttons */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <label
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: "#212529",
                      marginBottom: "0.75rem",
                      display: "block",
                    }}
                  >
                    Decision <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <button
                      type="button"
                      onClick={() => setDecision("approve")}
                      style={{
                        flex: 1,
                        padding: "0.75rem",
                        border:
                          decision === "approve"
                            ? "2px solid #198754"
                            : "1px solid rgb(39, 35, 92, 0.5)",
                        borderRadius: "8px",
                        background: decision === "approve" ? "#d1fae5" : "#fff",
                        color: decision === "approve" ? "#065f46" : "#212529",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        transition: "all 0.2s",
                      }}
                    >
                      <CheckCircle size={16} />
                      Approve
                    </button>

                    <button
                      type="button"
                      onClick={() => setDecision("reject")}
                      style={{
                        flex: 1,
                        padding: "0.75rem",
                        border:
                          decision === "reject"
                            ? "2px solid #dc3545"
                            : "1px solid rgb(39, 35, 92, 0.5)",
                        borderRadius: "8px",
                        background: decision === "reject" ? "#fee2e2" : "#fff",
                        color: decision === "reject" ? "#991b1b" : "#212529",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        transition: "all 0.2s",
                      }}
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>
                </div>

                {/* Show new rating input only for assignment completion AND approve */}
                {approval.approvalType ===
                  APPROVAL_TYPE.ASSIGNMENT_COMPLETION &&
                  decision === "approve" && (
                    <div style={{ marginBottom: "1rem" }}>
                      <label
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          color: "#212529",
                          marginBottom: "0.5rem",
                          display: "block",
                        }}
                      >
                        New Rating <span style={{ color: "#dc3545" }}>*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        step={1}
                        value={newRating}
                        onChange={(e) => setNewRating(e.target.value)}
                        placeholder="Enter new skill rating for this employee (1-10)"
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          fontSize: "0.875rem",
                          outline: "none",
                          fontFamily: "inherit",
                        }}
                      />
                    </div>
                  )}

                {/* Notes */}
                {approval.approvalType !== APPROVAL_TYPE.SME_REQUEST && (
                  <div style={{ marginBottom: "1.5rem" }}>
                    <label
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: "#212529",
                        marginBottom: "0.5rem",
                        display: "block",
                      }}
                    >
                      Notes <span style={{ color: "#dc3545" }}>*</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={
                        decision === "approve"
                          ? "Add approval notes..."
                          : decision === "reject"
                          ? "Explain reason for rejection..."
                          : "Select a decision first..."
                      }
                      rows={4}
                      required={
                        approval.approvalType !== APPROVAL_TYPE.SME_REQUEST
                      }
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid rgb(39, 35, 92, 0.5)",
                        borderRadius: "8px",
                        fontSize: "0.875rem",
                        outline: "none",
                        resize: "vertical",
                        fontFamily: "inherit",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#97247E";
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(151, 36, 126, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#e5e7eb";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: "1rem 1.5rem",
                  borderTop: "1px solid #e5e7eb",
                  display: "flex",
                  gap: "0.75rem",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={processing}
                  style={{
                    padding: "0.625rem 1.25rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    !decision ||
                    (approval.approvalType ===
                      APPROVAL_TYPE.ASSIGNMENT_COMPLETION &&
                      decision === "approve" &&
                      (processing ||
                        !newRating ||
                        isNaN(newRating) ||
                        Number(newRating) < 1 ||
                        Number(newRating) > 10)) ||
                    (approval.approvalType !== APPROVAL_TYPE.SME_REQUEST &&
                      !notes.trim()) ||
                    processing
                  }
                  style={{
                    padding: "0.625rem 1.25rem",
                    border: "none",
                    borderRadius: "8px",
                    background:
                      decision &&
                      (approval.approvalType !==
                        APPROVAL_TYPE.ASSIGNMENT_COMPLETION ||
                        (decision === "approve" &&
                          newRating &&
                          !isNaN(newRating) &&
                          Number(newRating) >= 1 &&
                          Number(newRating) <= 10)) &&
                      (approval.approvalType === APPROVAL_TYPE.SME_REQUEST ||
                        notes.trim()) &&
                      !processing
                        ? decision === "approve"
                          ? "#198754"
                          : "#dc3545"
                        : "#e5e7eb",
                    color:
                      decision &&
                      (approval.approvalType !==
                        APPROVAL_TYPE.ASSIGNMENT_COMPLETION ||
                        (decision === "approve" &&
                          newRating &&
                          !isNaN(newRating) &&
                          Number(newRating) >= 1 &&
                          Number(newRating) <= 10)) &&
                      (approval.approvalType === APPROVAL_TYPE.SME_REQUEST ||
                        notes.trim()) &&
                      !processing
                        ? "#fff"
                        : "#6c757d",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    cursor:
                      decision &&
                      (approval.approvalType !==
                        APPROVAL_TYPE.ASSIGNMENT_COMPLETION ||
                        (decision === "approve" &&
                          newRating &&
                          !isNaN(newRating) &&
                          Number(newRating) >= 1 &&
                          Number(newRating) <= 10)) &&
                      (approval.approvalType === APPROVAL_TYPE.SME_REQUEST ||
                        notes.trim()) &&
                      !processing
                        ? "pointer"
                        : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  {processing ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                      />{" "}
                      Processing...
                    </>
                  ) : decision === "approve" ? (
                    <>
                      <CheckCircle size={16} />
                      Approve Request
                    </>
                  ) : decision === "reject" ? (
                    <>
                      <XCircle size={16} />
                      Reject Request
                    </>
                  ) : (
                    "Submit Decision"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ApprovalDecisionModal;
