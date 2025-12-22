import { useState } from "react";
import { X, CheckCircle, XCircle, Download, Eye } from "lucide-react";
import lndService, {
  downloadFile,
  previewFile,
} from "../../../services/lnd/lndService";
import { APPROVAL_TYPE } from "../../../constants/lnd/lndConstants";
import { toast } from "sonner";
import styles from "../../../styles/lnd/components/ApprovalDecisionModal.module.css";

const ApprovalDecisionModal = ({ approval, onClose, onSuccess }) => {
  const [decision, setDecision] = useState(null);
  const [notes, setNotes] = useState("");
  const [newRating, setNewRating] = useState("");
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

  // Check if file can be previewed (only PDF and images)
  const fileName = approval.attachmentFileName || approval.attachmentPath || "";
  const extension = fileName.split(".").pop()?.toLowerCase();
  const canPreview = [
    "pdf",
    "png",
    "jpg",
    "jpeg",
    "gif",
    "bmp",
    "svg",
  ].includes(extension);

  // PREVIEW HANDLER
  const handlePreview = async () => {
    if (!canPreview) {
      toast.info(
        "Preview not supported for this file type. Please download to view."
      );
      return;
    }

    try {
      const response = await lndService.previewApprovalAttachment(
        approval.approvalId
      );

      if (response?.data) {
        const contentType =
          response.headers["content-type"] || "application/pdf";
        previewFile(response.data, contentType);
        toast.success("Opening preview...");
      }
    } catch (error) {
      console.error("Failed to preview:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        "Failed to preview document";
      toast.error(errorMessage);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await lndService.downloadApprovalAttachment(
        approval.approvalId
      );
      const filename =
        approval.attachmentFileName ||
        `approval_${approval.approvalId}_attachment`;
      downloadFile(response.data, filename);
      toast.success("File downloaded successfully");
    } catch (error) {
      console.error("Failed to download:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        "Failed to download file";
      toast.error(errorMessage);
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
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose}>
        {/* Modal */}
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className={styles.header}>
            <h5 className={styles.headerTitle}>Review Approval Request</h5>
            <button
              type="button"
              onClick={onClose}
              className={`btn-close-white ${styles.btnClose}`}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Body */}
          <div className={styles.body}>
            <form onSubmit={handleSubmit}>
              <div>
                {/* Approval Info */}
                <div className={styles.infoCard}>
                  <p className={styles.infoLabel}>Approval Type</p>
                  <p className={styles.infoValue}>
                    {getApprovalTypeLabel(approval.approvalType)}
                  </p>

                  {approval.skillName && (
                    <>
                      <p className={styles.infoLabel}>Skill</p>
                      <p className={styles.infoValue}>{approval.skillName}</p>
                    </>
                  )}

                  <p className={styles.infoLabel}>Requested by</p>
                  <p className={styles.infoValueSmall}>
                    {approval.requesterName}
                  </p>

                  <p className={styles.infoLabel}>Requested On</p>
                  <p className={styles.infoValueSmall}>
                    {new Date(approval.requestedOn).toLocaleDateString()}
                  </p>
                </div>

                {/* Preview & Download Buttons */}
                {approval.attachmentPath && (
                  <div className={styles.fileActions}>
                    {/* Preview Button */}
                    <button
                      type="button"
                      onClick={handlePreview}
                      disabled={!canPreview}
                      title={
                        !canPreview
                          ? "Preview not supported for this file type"
                          : "Preview document in browser"
                      }
                      className={`${styles.fileBtn} ${styles.fileBtnPreview}`}
                    >
                      <Eye size={16} />
                      {canPreview
                        ? "Preview Document"
                        : "Preview Not Supported"}
                    </button>

                    {/* Download Button */}
                    <button
                      type="button"
                      onClick={handleDownload}
                      className={`${styles.fileBtn} ${styles.fileBtnDownload}`}
                    >
                      <Download size={16} />
                      Download Attachment
                    </button>
                  </div>
                )}

                {/* Decision Buttons */}
                <div className="mb-4">
                  <label className={styles.decisionLabel}>
                    Decision <span className={styles.required}> *</span>
                  </label>
                  <div className={styles.decisionButtons}>
                    <button
                      type="button"
                      onClick={() => setDecision("approve")}
                      className={`${styles.decisionBtn} ${
                        styles.decisionBtnApprove
                      } ${decision === "approve" ? styles.selected : ""}`}
                    >
                      <CheckCircle size={16} />
                      Approve
                    </button>

                    <button
                      type="button"
                      onClick={() => setDecision("reject")}
                      className={`${styles.decisionBtn} ${
                        styles.decisionBtnReject
                      } ${decision === "reject" ? styles.selected : ""}`}
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
                    <div className="mb-4">
                      <label className={styles.ratingLabel}>
                        New Rating <span className={styles.required}> *</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        step={1}
                        value={newRating}
                        onChange={(e) => {
                          let val = Number(e.target.value);

                          if (val < 1) val = 1;
                          if (val > 10) val = 10;

                          setNewRating(val);
                        }}
                        placeholder="Enter new skill rating for this employee (1-10)"
                        className={styles.ratingInput}
                      />
                    </div>
                  )}

                {/* Notes */}
                {approval.approvalType !== APPROVAL_TYPE.SME_REQUEST && (
                  <div className="mb-4">
                    <label className={styles.notesLabel}>
                      Notes <span className={styles.required}> *</span>
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
                      className={styles.notesTextarea}
                    />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className={styles.footer}>
                <button
                  type="button"
                  className={`btn btn-secondary ${styles.btnCancel}`}
                  onClick={onClose}
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`
                  ${styles.btnSubmit}
                  ${
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
                        ? styles.btnSubmitApprove
                        : styles.btnSubmitReject
                      : ""
                  }
                `}
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
