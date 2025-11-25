import { useState } from "react";
import { X, Upload, FileText, AlertCircle } from "lucide-react";
import { lndService } from "../../../services/lnd/lndService";
import { FILE_UPLOAD } from "../../../constants/lnd/lndConstants";
import { toast } from "sonner";

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
            animation: "slideUp 0.3s ease-out",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "1.5rem",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              backgroundColor: "rgb(39, 35, 92)",
              alignItems: "center",
            }}
          >
            <h5 style={{ margin: 0, fontWeight: "600", color: "white" }}>
              Upload Completion Proof
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
          <form onSubmit={handleSubmit}>
            <div style={{ padding: "1.5rem" }}>
              {/* Assignment Info */}
              <div
                style={{
                  padding: "1rem",
                  background: "#f8f9fa",
                  borderRadius: "8px",
                  border: "1px solid rgba(39, 35, 92, 0.66)",
                  marginBottom: "1.5rem",
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
                  Assignment
                </p>
                <p
                  style={{
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#212529",
                    margin: 0,
                    marginBottom: "0.5rem",
                  }}
                >
                  {assignment.skillName}
                </p>
                <p
                  style={{ fontSize: "0.875rem", color: "#6c757d", margin: 0 }}
                >
                  SME: <strong>{assignment.smeName}</strong>
                </p>
              </div>

              {/* Completion Notes */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#212529",
                    marginBottom: "0.5rem",
                    display: "block",
                    textAlign: "left",
                  }}
                >
                  Completion Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe what you've completed and learned..."
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid rgba(39, 35, 92, 0.5)",
                    borderRadius: "8px",
                    fontSize: "12px",
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

              {/* File Upload */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#212529",
                    marginBottom: "0.5rem",
                    display: "block",
                    textAlign: "left",
                  }}
                >
                  Proof Document <span style={{ color: "#dc3545" }}>*</span>
                </label>

                {!file ? (
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    style={{
                      border: `2px dashed ${
                        dragActive ? "#97247E" : "rgba(39, 35, 92, 0.5)"
                      }`,
                      borderRadius: "8px",
                      padding: "2rem",
                      textAlign: "center",
                      background: dragActive ? "#f9f5ff" : "#f8f9fa",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onClick={() =>
                      document.getElementById("proof-file-input").click()
                    }
                  >
                    <Upload
                      size={32}
                      color="#6c757d"
                      style={{ marginBottom: "0.5rem" }}
                    />
                    <p
                      style={{
                        fontSize: "0.9375rem",
                        color: "#212529",
                        margin: 0,
                        marginBottom: "0.25rem",
                        fontWeight: "500",
                      }}
                    >
                      Drag & drop or click to upload
                    </p>
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        color: "#6c757d",
                        margin: 0,
                      }}
                    >
                      PDF, DOC, DOCX, Images, ZIP (Max 10MB)
                    </p>
                    <input
                      id="proof-file-input"
                      type="file"
                      accept={FILE_UPLOAD.ALLOWED_EXTENSIONS.join(",")}
                      onChange={(e) => handleFileChange(e.target.files[0])}
                      style={{ display: "none" }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      border: "1px solid rgb(39, 35, 92, 0.5)",
                      borderRadius: "8px",
                      padding: "1rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "#fff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                      }}
                    >
                      <FileText size={24} color="#97247E" />
                      <div>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: "500",
                            color: "#212529",
                            margin: 0,
                          }}
                        >
                          {file.name}
                        </p>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#6c757d",
                            margin: 0,
                          }}
                        >
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "#dc3545",
                        padding: "0.25rem",
                      }}
                    >
                      <X size={20} />
                    </button>
                  </div>
                )}
              </div>
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
                disabled={uploading}
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
                disabled={!file || uploading}
                style={{
                  padding: "0.625rem 1.25rem",
                  border: "none",
                  borderRadius: "8px",
                  background:
                    file && !uploading
                      ? "linear-gradient(90deg, #97247E 0%, #E01950 100%)"
                      : "#e5e7eb",
                  color: file && !uploading ? "#fff" : "#6c757d",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  cursor: file && !uploading ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {uploading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
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
