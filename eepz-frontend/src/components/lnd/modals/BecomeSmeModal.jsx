import { X, Upload, FileText } from "lucide-react";
import { useState } from "react";
import { lndService } from "../../../services/lnd/lndService";
import { FILE_UPLOAD } from "../../../constants/lnd/lndConstants";
import { toast } from "sonner";
import styles from "../../../styles/lnd/components/BecomeSmeModal.module.css";
import { LND_TOASTS } from "../../../constants/lnd/lndToasts";

const BecomeSmeModal = ({ skill, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
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
    // Validate file size
    if (selectedFile.size > FILE_UPLOAD.MAX_SIZE) {
      toast.error(LND_TOASTS.FILE_SIZE_MESSAGE);
      return;
    }

    // Validate file type
    if (!FILE_UPLOAD.ALLOWED_TYPES.includes(selectedFile.type)) {
      toast.error(LND_TOASTS.FILE_TYPE_MESSAGE);
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error(LND_TOASTS.UPLOAD_MESSAGE);
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("skillId", skill.skillId);
      formData.append("proofDocument", file);

      const response = await lndService.applyToBecomeSme(formData);

      if (response.data.success) {
        onSuccess();
      } else {
        toast.error(response.data.message || LND_TOASTS.FAILED_TO_SUBMIT);
      }
    } catch (error) {
      console.error("Failed to apply:", error);
      toast.error(error.response?.data?.message || LND_TOASTS.FAILED_TO_SUBMIT);
    } finally {
      setUploading(false);
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
            <h5 className={styles.headerTitle}>Apply to Become SME</h5>
            <button
              type="button"
              className={`btn-close-white ${styles.btnClose}`}
              onClick={onClose}
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
          <form onSubmit={handleSubmit}>
            <div className={styles.body}>
              {/* Skill Info */}
              <div className={styles.skillInfo}>
                <p className={styles.skillLabel}>Skill</p>
                <p className={styles.skillName}>{skill.skillName}</p>
                <p className={styles.skillRating}>
                  Current Rating: <strong>{skill.rating}/10</strong>
                </p>
              </div>

              {/* File Upload */}
              <div>
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
                      document.getElementById("file-input").click()
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
                      id="file-input"
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
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default BecomeSmeModal;
