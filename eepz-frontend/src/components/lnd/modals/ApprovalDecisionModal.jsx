import { useState } from "react";
import { X, CheckCircle, XCircle, Download, Eye } from "lucide-react";
import lndService, {
  downloadFile,
  previewFile,
} from "../../../services/lnd/lndService";
import { APPROVAL_TYPE } from "../../../constants/lnd/lndConstants";
import { toast } from "sonner";
import styles from "../../../styles/lnd/components/ApprovalDecisionModal.module.css";
import { LND_TOASTS } from "../../../constants/lnd/lndToasts";

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

  const getFileExtension = (filename) => {
    if (!filename) return "";
    const cleanName = filename.split("?")[0].split("#")[0];
    const parts = cleanName.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
  };

  const fileName = approval.attachmentFileName || approval.attachmentPath || "";
  const extension = getFileExtension(fileName);

  const previewableExtensions = [
    "pdf",
    "png",
    "jpg",
    "jpeg",
    "gif",
    "bmp",
    "svg",
  ];

  const nonPreviewableExtensions = [
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    "txt",
    "zip",
    "rar",
    "7z",
  ];

  const hasAttachment = approval.attachmentPath || approval.attachmentFileName;

  let canPreview = false;

  if (hasAttachment) {
    if (extension) {
      if (nonPreviewableExtensions.includes(extension)) {
        canPreview = false;
      } else if (previewableExtensions.includes(extension)) {
        canPreview = true;
      } else {
        canPreview = false;
      }
    } else {
      canPreview = true;
    }
  }
  const handlePreview = async () => {
    if (!canPreview) {
      toast.warning(LND_TOASTS.PREVIEW_NOT_SUPPORTED);
      return;
    }
    try {
      toast.info(LND_TOASTS.LOADING);

      const response = await lndService.previewApprovalAttachment(
        approval.approvalId
      );
      if (response?.data) {
        const contentType =
          response.headers["content-type"] || "application/pdf";

        const previewableContentTypes = [
          "application/pdf",
          "image/png",
          "image/jpeg",
          "image/jpg",
          "image/gif",
          "image/bmp",
          "image/svg+xml",
        ];

        const blockedContentTypes = [
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ];

        if (blockedContentTypes.includes(contentType)) {
          toast.warning(LND_TOASTS.PREVIEW_NOT_SUPPORTED);
          return;
        }

        if (!previewableContentTypes.includes(contentType)) {
          toast.warning(LND_TOASTS.PREVIEW_NOT_SUPPORTED);
          return;
        }

        previewFile(response.data, contentType);
        toast.success(LND_TOASTS.LOADING);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        LND_TOASTS.PREVIEW_FAILED;
      toast.error(errorMessage);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await lndService.downloadApprovalAttachment(
        approval.approvalId
      );

      const contentDisposition = response.headers["content-disposition"];
      const typeLabel = getApprovalTypeLabel(approval.approvalType);
      let filename = `${approval.requesterName}_${typeLabel}${approval.approvalId}`;

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (fileNameMatch && fileNameMatch[1]) {
          filename = fileNameMatch[1].replace(/['"]/g, "");
        }
      } else if (approval.attachmentFileName) {
        filename = approval.attachmentFileName;
      }

      downloadFile(response.data, filename);
      toast.success(LND_TOASTS.DOWNLOAD_SUCCESS);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        LND_TOASTS.DOWNLOAD_FAILED;
      toast.error(errorMessage);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!decision) {
      toast.error(LND_TOASTS.SELECT_DECISION_MESSAGE);
      return;
    }

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
        toast.error(LND_TOASTS.PROVIDE_RATING_MESSAGE);
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
          toast.success(LND_TOASTS.ASSIGNMENT_COMPLETED_MESSAGE);
          onSuccess();
        } else {
          toast.error(
            response.data.message || LND_TOASTS.ASSIGNMENT_FAILED_TO_COMPLETE
          );
        }
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            LND_TOASTS.ASSIGNMENT_FAILED_TO_COMPLETE
        );
      } finally {
        setProcessing(false);
      }
      return;
    }

    const isSmeRequest = approval.approvalType === APPROVAL_TYPE.SME_REQUEST;
    const notesToSend = isSmeRequest ? approval.notes || "" : notes.trim();

    if (!isSmeRequest && !notesToSend) {
      toast.error(LND_TOASTS.PROVIDE_NOTES_MESSAGE);
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
        toast.success(LND_TOASTS.APPROVAL_PROCESSED_MESSAGE);
        onSuccess();
      } else {
        toast.error(
          response.data.message || LND_TOASTS.APPROVAL_NOT_PROCESSED_MESSAGE
        );
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          LND_TOASTS.APPROVAL_NOT_PROCESSED_MESSAGE
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
