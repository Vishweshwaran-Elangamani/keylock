import { useState } from "react";
import { X, Upload, FileText, AlertCircle } from "lucide-react";
import { lndService } from "../../../services/lnd/lndService";
import { FILE_UPLOAD } from "../../../constants/lnd/lndConstants";
import { toast } from "sonner";
import styles from "../../../styles/lnd/components/UploadProofModal.module.css";

const UploadProofModal = ({ assignment, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (selectedFile) => {
    if (selectedFile.size > FILE_UPLOAD.MAX_SIZE) {
      toast.error("File size must be less than 10MB");
      return;
    }

    if (!FILE_UPLOAD.ALLOWED_TYPES.includes(selectedFile.type)) {
      toast.error("Invalid file type. Allowed: PDF, DOC, DOCX, Images, ZIP");
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please upload a completion proof document");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("assignmentId", assignment.assignmentId);
      formData.append("proofDocument", file);
      formData.append("completionNotes", notes);

      const response = await lndService.uploadCompletionProof(formData);

      if (response.data.success) {
        onSuccess();
      } else {
        toast.error(response.data.message || "Failed to upload proof");
      }
    } catch (error) {
      console.error("Failed to upload:", error);
      toast.error(
        error.response?.data?.message || "Failed to upload completion proof"
      );
    } finally {
      setUploading(false); 
    }
  };

  return (
    <>
      <div className={styles.backdrop} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <h5 className={styles.headerTitle}>Upload Completion Proof</h5>
            <button
              type="button"
              onClick={onClose}
              className={`btn-close-white ${styles.btnClose}`}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "red";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "white";
              }}
              aria-label="Close"
            >
              <i className="bi bi-x-lg"></i>     
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.body}>
              {/* Assignment Info */}
              <div className={styles.assignmentInfo}>
                <p className={styles.infoLabel}>Assignment</p>
                <p className={styles.infoValue}>{assignment.skillName}</p>
                <p className={styles.infoSme}>
                  SME: <strong>{assignment.smeName}</strong>
                </p>
              </div>

              {/* Completion Notes */}
              <div className={styles.notesField}>
                <label className={styles.notesLabel}>Completion Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe what you've completed and learned..."
                  rows={4}
                  className={styles.notesTextarea}
                />
              </div>

              {/* File Upload */}
              <div className={styles.uploadField}>
                <label className={styles.uploadLabel}>
                  Proof Document <span className={styles.required}> *</span>
                </label>

                {!file ? (
                  <div
                    className={`${styles.uploadArea} ${
                      dragActive
                        ? styles.uploadAreaDragActive
                        : styles.uploadAreaNoFile
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() =>
                      document.getElementById("proof-file-input").click()
                    }
                  >
                    <Upload
                      size={32}
                      color="#6c757d"
                      className={styles.uploadIcon}
                    />
                    <p className={styles.uploadTitle}>
                      Drag & drop or click to upload
                    </p>
                    <p className={styles.uploadSubtitle}>
                      PDF, DOC, DOCX, Images, ZIP (Max 10MB)
                    </p>
                    <input
                      id="proof-file-input"
                      type="file"
                      accept={FILE_UPLOAD.ALLOWED_EXTENSIONS.join(",")}
                      onChange={(e) => handleFileChange(e.target.files[0])}
                      className={styles.fileInput}
                    />
                  </div>
                ) : (
                  <div className={styles.fileUploaded}>
                    <div className={styles.fileInfo}>
                      <FileText size={24} className={styles.fileIcon} />
                      <div>
                        <p className={styles.fileName}>{file.name}</p>
                        <p className={styles.fileSize}>
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className={styles.btnRemoveFile}
                    >
                      <X size={20} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className={styles.footer}>
              <button
                type="button"
                className={`btn btn-secondary ${styles.btnCancel}`}
                onClick={onClose}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`
                ${styles.btnSubmit}
                ${file && !uploading ? styles.btnSubmitEnabled : ""}
              `}
                disabled={!file || uploading}
              >
                {uploading ? (
                  <>
                    <span
                      className={`spinner-border spinner-border-sm ${styles.loadingSpinner}`}
                      role="status"
                    />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Upload Proof
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UploadProofModal;
