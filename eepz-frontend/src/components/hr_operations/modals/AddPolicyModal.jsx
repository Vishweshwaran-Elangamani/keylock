import { useState } from "react";
import policyService from "../../../services/hr_operations/hr/policyService";

const AddPolicyModal = ({ show, onClose, onSuccess, onToast }) => {
  const [formData, setFormData] = useState({
    policyName: "",
    category: "",
    description: "",
    complianceGuidance: "",
    status: "Draft",
  });

  const [documentType, setDocumentType] = useState("none");
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentLink, setDocumentLink] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const categories = [
    "Attendance",
    "Leave",
    "Code of Conduct",
    "Work Hours",
    "Remote Work",
    "Expense",
    "Security",
    "Health & Safety",
    "IT Policy",
    "Other",
  ];

  const statuses = ["Active", "Inactive", "Draft"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        if (typeof onToast === "function")
          onToast("warning", "Only PDF, DOC, DOCX files allowed");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        if (typeof onToast === "function")
          onToast("warning", "File size must be less than 5MB");
        return;
      }

      setSelectedFile(file);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.policyName.trim())
      newErrors.policyName = "Policy name is required";
    if (!formData.category.trim()) newErrors.category = "Category is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";

    if (documentType === "link") {
      if (!documentLink.trim())
        newErrors.documentLink = "Document URL is required";
      if (!documentName.trim())
        newErrors.documentName = "Document name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);

      let documentData = {};

      if (documentType === "upload" && selectedFile) {
        setUploadingDoc(true);
        const uploadResult = await policyService.uploadDocument(selectedFile);
        documentData = {
          documentUrl: uploadResult.documentUrl,
          documentName: uploadResult.documentName,
          documentType: uploadResult.documentType,
          documentSize: uploadResult.documentSize,
        };
        setUploadingDoc(false);
      } else if (documentType === "link" && documentLink) {
        const linkResult = await policyService.addDocumentLink(
          documentLink,
          documentName
        );
        documentData = {
          documentUrl: linkResult.documentUrl,
          documentName: linkResult.documentName,
          documentType: linkResult.documentType,
        };
      }

      const policyDataWithDoc = { ...formData, ...documentData };
      await policyService.createPolicy(policyDataWithDoc);

      if (typeof onToast === "function")
        onToast("success", "Policy created successfully!");
      onSuccess();
    } catch (error) {
      console.error("Error creating policy:", error);
      setErrors({ submit: "Failed to create policy. Please try again." });
      if (typeof onToast === "function")
        onToast("danger", "Failed to create policy");
    } finally {
      setLoading(false);
      setUploadingDoc(false);
    }
  };

  if (!show) return null;

  return (
    <>
      {/* Blurred Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(39,35,92,0.4)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 1040,
        }}
        onClick={onClose}
      />

      {/* Modal Container with Scroll */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "95%",
          maxWidth: "800px",
          maxHeight: "85vh",
          zIndex: 1050,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            borderRadius: "0.5rem",
            background: "#fff",
            boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
            overflow: "hidden",
            width: "100%",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* HEADER - Fixed */}
          <div
            style={{
              background: "#27235C",
              color: "#fff",
              padding: "13px 15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "15px",
              fontWeight: 600,
              borderRadius: "0.5rem 0.5rem 0 0",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              <i className="bi bi-plus-circle"></i>
              Create New Policy
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading || uploadingDoc}
              aria-label="Close"
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: 18,
                cursor: loading || uploadingDoc ? "not-allowed" : "pointer",
                opacity: loading || uploadingDoc ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* BODY - Scrollable */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "20px",
                background: "#fff",
                textAlign: "left",
                overflowY: "auto",
                flex: 1,
              }}
            >
              {errors.submit && (
                <div
                  style={{
                    borderRadius: 8,
                    padding: "10px 14px",
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    fontSize: 13,
                    background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
                    border: "2px solid #ef4444",
                    color: "#991b1b",
                  }}
                >
                  <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: 8, color: "#ef4444" }}></i>
                  {errors.submit}
                </div>
              )}

              {/* Two Column Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 20,
                  marginBottom: 0,
                }}
              >
                {/* LEFT COLUMN */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Policy Name */}
                  <div>
                    <label
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: "#334155",
                        marginBottom: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      Policy Name <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="policyName"
                      placeholder="Enter policy name"
                      value={formData.policyName}
                      onChange={handleChange}
                      style={{
                        width: "100%",
                        border: errors.policyName ? "1px solid #ef4444" : "1px solid #cbd5e1",
                        borderRadius: 6,
                        padding: "8px 10px",
                        fontSize: 13,
                        background: "#fff",
                        color: "#22223b",
                      }}
                    />
                    {errors.policyName && (
                      <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>
                        {errors.policyName}
                      </div>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: "#334155",
                        marginBottom: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      Category <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      style={{
                        width: "100%",
                        border: errors.category ? "1px solid #ef4444" : "1px solid #cbd5e1",
                        borderRadius: 6,
                        padding: "8px 10px",
                        fontSize: 13,
                        background: "#fff",
                        color: "#22223b",
                        cursor: "pointer",
                      }}
                    >
                      <option value="" disabled>
                        Select Category
                      </option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>
                        {errors.category}
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: "#334155",
                        marginBottom: 6,
                        display: "block",
                      }}
                    >
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      style={{
                        width: "100%",
                        border: "1px solid #cbd5e1",
                        borderRadius: 6,
                        padding: "8px 10px",
                        fontSize: 13,
                        background: "#fff",
                        color: "#22223b",
                        cursor: "pointer",
                      }}
                    >
                      {statuses.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    <small
                      style={{
                        fontSize: 11,
                        color: "#64748b",
                        marginTop: 2,
                        fontStyle: "italic",
                        display: "block",
                      }}
                    >
                      Draft by default (publish later)
                    </small>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Description */}
                  <div>
                    <label
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: "#334155",
                        marginBottom: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      Description <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                    </label>
                    <textarea
                      rows={3}
                      name="description"
                      placeholder="Enter policy description"
                      value={formData.description}
                      onChange={handleChange}
                      style={{
                        width: "100%",
                        border: errors.description ? "1px solid #ef4444" : "1px solid #cbd5e1",
                        borderRadius: 6,
                        padding: "8px 10px",
                        fontSize: 13,
                        background: "#fff",
                        color: "#22223b",
                        resize: "vertical",
                        minHeight: 80,
                        maxHeight: 120,
                        fontFamily: "inherit",
                        lineHeight: 1.4,
                      }}
                    />
                    {errors.description && (
                      <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>
                        {errors.description}
                      </div>
                    )}
                  </div>

                  {/* Compliance Guidance */}
                  <div>
                    <label
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: "#334155",
                        marginBottom: 6,
                        display: "block",
                      }}
                    >
                      Compliance Guidance
                    </label>
                    <textarea
                      rows={3}
                      name="complianceGuidance"
                      placeholder="Enter compliance guidance (optional)"
                      value={formData.complianceGuidance}
                      onChange={handleChange}
                      style={{
                        width: "100%",
                        border: "1px solid #cbd5e1",
                        borderRadius: 6,
                        padding: "8px 10px",
                        fontSize: 13,
                        background: "#fff",
                        color: "#22223b",
                        resize: "vertical",
                        minHeight: 80,
                        maxHeight: 120,
                        fontFamily: "inherit",
                        lineHeight: 1.4,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* DOCUMENT SECTION */}
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  background: "#f9fafb",
                  padding: "16px",
                  marginTop: 20,
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    marginBottom: 12,
                    color: "#334155",
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <i className="bi bi-file-earmark-text" style={{ fontSize: 14 }}></i>
                  Attach Policy Document (Optional)
                </label>

                {/* Three Button Group */}
                <div
                  style={{
                    display: "flex",
                    width: "100%",
                    marginBottom: "12px",
                    borderRadius: 6,
                    overflow: "hidden",
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setDocumentType("none");
                      setSelectedFile(null);
                      setDocumentLink("");
                      setDocumentName("");
                    }}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      border: "none",
                      background: documentType === "none" ? "#27235C" : "#fff",
                      color: documentType === "none" ? "white" : "#6c757d",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                      borderRight: "1px solid #cbd5e1",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <i className="bi bi-x-circle" style={{ fontSize: 14 }}></i> No Document
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDocumentType("upload");
                      setDocumentLink("");
                      setDocumentName("");
                    }}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      border: "none",
                      background: documentType === "upload" ? "#27235C" : "#fff",
                      color: documentType === "upload" ? "white" : "#6c757d",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                      borderRight: "1px solid #cbd5e1",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <i className="bi bi-cloud-upload" style={{ fontSize: 14 }}></i> Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDocumentType("link");
                      setSelectedFile(null);
                    }}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      border: "none",
                      background: documentType === "link" ? "#27235C" : "#fff",
                      color: documentType === "link" ? "white" : "#6c757d",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <i className="bi bi-link-45deg" style={{ fontSize: 14 }}></i> Add Link
                  </button>
                </div>

                {/* Upload File Section */}
                {documentType === "upload" && (
                  <div style={{ marginTop: 12 }}>
                    <label
                      htmlFor="file-upload"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        padding: "12px",
                        border: "2px dashed #cbd5e1",
                        borderRadius: 8,
                        background: "#fff",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        fontSize: 13,
                        color: "#64748b",
                        fontWeight: 500,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#97247E";
                        e.currentTarget.style.background = "#faf5ff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#cbd5e1";
                        e.currentTarget.style.background = "#fff";
                      }}
                    >
                      <i className="bi bi-cloud-upload" style={{ fontSize: 20 }}></i>
                      <span>Click to upload or drag and drop</span>
                    </label>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      style={{
                        display: "none",
                      }}
                    />
                    <small
                      style={{
                        fontSize: 11,
                        color: "#64748b",
                        display: "block",
                        marginTop: 8,
                        textAlign: "center",
                        fontStyle: "italic",
                      }}
                    >
                      Supported: PDF, DOC, DOCX (Max 5MB)
                    </small>

                    {/* Selected File Display - Green */}
                    {selectedFile && (
                      <div
                        style={{
                          marginTop: 12,
                          padding: "12px 14px",
                          fontSize: 13,
                          borderRadius: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: "linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%)",
                          border: "2px solid #86efac",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            color: "#166534",
                          }}
                        >
                          <i
                            className="bi bi-file-earmark-check-fill"
                            style={{ fontSize: 20, color: "#16a34a" }}
                          ></i>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>
                              {selectedFile.name}
                            </div>
                            <div style={{ fontSize: 11, color: "#15803d", marginTop: 2 }}>
                              {(selectedFile.size / 1024).toFixed(2)} KB
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#dc2626",
                            cursor: "pointer",
                            padding: "4px 8px",
                            borderRadius: 4,
                            transition: "all 0.2s",
                            display: "flex",
                            alignItems: "center",
                            fontSize: 18,
                          }}
                          title="Remove file"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#fee2e2";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "none";
                          }}
                        >
                          <i className="bi bi-x-circle-fill"></i>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Link Section */}
                {documentType === "link" && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ marginBottom: 12 }}>
                      <label
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          color: "#334155",
                          marginBottom: 6,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        Document URL <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://drive.google.com/file/d/..."
                        value={documentLink}
                        onChange={(e) => setDocumentLink(e.target.value)}
                        style={{
                          width: "100%",
                          border: errors.documentLink ? "1px solid #ef4444" : "1px solid #cbd5e1",
                          borderRadius: 6,
                          padding: "8px 10px",
                          fontSize: 13,
                          background: "#fff",
                          color: "#22223b",
                        }}
                      />
                      {errors.documentLink && (
                        <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>
                          {errors.documentLink}
                        </div>
                      )}
                    </div>
                    <div>
                      <label
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          color: "#334155",
                          marginBottom: 6,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        Document Name <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Policy Document.pdf"
                        value={documentName}
                        onChange={(e) => setDocumentName(e.target.value)}
                        style={{
                          width: "100%",
                          border: errors.documentName ? "1px solid #ef4444" : "1px solid #cbd5e1",
                          borderRadius: 6,
                          padding: "8px 10px",
                          fontSize: 13,
                          background: "#fff",
                          color: "#22223b",
                        }}
                      />
                      {errors.documentName && (
                        <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>
                          {errors.documentName}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* FOOTER - Fixed */}
            <div
              style={{
                padding: "10px 15px",
                borderTop: "1px solid #e2e8f0",
                background: "#fff",
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                borderBottomLeftRadius: "0.5rem",
                borderBottomRightRadius: "0.5rem",
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={loading || uploadingDoc}
                style={{
                  background: "#6c757d",
                  border: "none",
                  color: "#fff",
                  fontWeight: 600,
                  padding: "7px 12px",
                  fontSize: 12,
                  borderRadius: 5,
                  cursor: loading || uploadingDoc ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: loading || uploadingDoc ? 0.7 : 1,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!loading && !uploadingDoc) e.target.style.background = "#5a6268";
                }}
                onMouseLeave={(e) => {
                  if (!loading && !uploadingDoc) e.target.style.background = "#6c757d";
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || uploadingDoc}
                style={{
                  background: "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
                  border: "none",
                  color: "#fff",
                  fontWeight: 600,
                  padding: "7px 12px",
                  fontSize: 12,
                  borderRadius: 5,
                  boxShadow: "0 2px 8px rgba(151,36,126,0.25)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: loading || uploadingDoc ? "not-allowed" : "pointer",
                  opacity: loading || uploadingDoc ? 0.85 : 1,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!loading && !uploadingDoc) e.target.style.opacity = 0.93;
                }}
                onMouseLeave={(e) => {
                  if (!loading && !uploadingDoc) e.target.style.opacity = 1;
                }}
              >
                {uploadingDoc ? (
                  <>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        border: "2px solid #fff",
                        borderTop: "2px solid #E01950",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                        display: "inline-block",
                        marginRight: 6,
                      }}
                    />
                    Uploading Document...
                    <style>{`
                      @keyframes spin {
                        0% { transform: rotate(0deg);}
                        100% { transform: rotate(360deg);}
                      }
                    `}</style>
                  </>
                ) : loading ? (
                  <>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        border: "2px solid #fff",
                        borderTop: "2px solid #E01950",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                        display: "inline-block",
                        marginRight: 6,
                      }}
                    />
                    Creating...
                    <style>{`
                      @keyframes spin {
                        0% { transform: rotate(0deg);}
                        100% { transform: rotate(360deg);}
                      }
                    `}</style>
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i>
                    Add Policy
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

export default AddPolicyModal;
