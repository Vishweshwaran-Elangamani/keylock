import { useState } from "react";
import policyService from "../../../services/hr_operations/hr/policyService";
import "../../../styles/hr_operations/hr/AddPolicyModal.css";

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
      <div className="apm-backdrop" onClick={onClose} />

      <div className="apm-modal-container">
        <div className="apm-modal-dialog">
          {/* HEADER - Fixed */}
          <div className="apm-modal-header">
            <div className="apm-header-title">
              <i className="bi bi-plus-circle"></i>
              Create New Policy
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading || uploadingDoc}
              aria-label="Close"
              className="apm-close-button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* BODY - Scrollable */}
          <form onSubmit={handleSubmit} className="apm-form">
            <div className="apm-modal-body">
              {errors.submit && (
                <div className="apm-error-banner">
                  <i className="bi bi-exclamation-triangle-fill apm-error-icon"></i>
                  {errors.submit}
                </div>
              )}

              {/* Two Column Grid */}
              <div className="apm-two-column-grid">
                {/* LEFT COLUMN */}
                <div className="apm-column-left">
                  {/* Policy Name */}
                  <div className="apm-form-group">
                    <label className="apm-form-label">
                      Policy Name{" "}
                      <span className="apm-required-asterisk">*</span>
                    </label>
                    <input
                      type="text"
                      name="policyName"
                      placeholder="Enter policy name"
                      value={formData.policyName}
                      onChange={handleChange}
                      className={`apm-form-input ${
                        errors.policyName ? "error" : ""
                      }`}
                    />
                    {errors.policyName && (
                      <div className="apm-form-error">{errors.policyName}</div>
                    )}
                  </div>

                  {/* Category */}
                  <div className="apm-form-group">
                    <label className="apm-form-label">
                      Category <span className="apm-required-asterisk">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className={`apm-form-input apm-form-select ${
                        errors.category ? "error" : ""
                      }`}
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
                      <div className="apm-form-error">{errors.category}</div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="apm-form-group">
                    <label className="apm-form-label-block">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="apm-form-input apm-form-select"
                    >
                      {statuses.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    <small className="apm-form-hint">
                      Draft by default (publish later)
                    </small>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="apm-column-right">
                  {/* Description */}
                  <div className="apm-form-group">
                    <label className="apm-form-label">
                      Description{" "}
                      <span className="apm-required-asterisk">*</span>
                    </label>
                    <textarea
                      rows={3}
                      name="description"
                      placeholder="Enter policy description"
                      value={formData.description}
                      onChange={handleChange}
                      className={`apm-form-input apm-form-textarea ${
                        errors.description ? "error" : ""
                      }`}
                    />
                    {errors.description && (
                      <div className="apm-form-error">{errors.description}</div>
                    )}
                  </div>

                  {/* Compliance Guidance */}
                  <div className="apm-form-group">
                    <label className="apm-form-label-block">
                      Compliance Guidance
                    </label>
                    <textarea
                      rows={3}
                      name="complianceGuidance"
                      placeholder="Enter compliance guidance (optional)"
                      value={formData.complianceGuidance}
                      onChange={handleChange}
                      className="apm-form-input apm-form-textarea"
                    />
                  </div>
                </div>
              </div>

              {/* DOCUMENT SECTION */}
              <div className="apm-document-section">
                <label className="apm-document-label">
                  <i className="bi bi-file-earmark-text apm-document-label-icon"></i>
                  Attach Policy Document (Optional)
                </label>

                {/* Three Button Group */}
                <div className="apm-button-group">
                  <button
                    type="button"
                    onClick={() => {
                      setDocumentType("none");
                      setSelectedFile(null);
                      setDocumentLink("");
                      setDocumentName("");
                    }}
                    className={`apm-button-group-item ${
                      documentType === "none" ? "active" : ""
                    }`}
                  >
                    <i className="bi bi-x-circle apm-button-group-icon"></i> No
                    Document
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDocumentType("upload");
                      setDocumentLink("");
                      setDocumentName("");
                    }}
                    className={`apm-button-group-item ${
                      documentType === "upload" ? "active" : ""
                    }`}
                  >
                    <i className="bi bi-cloud-upload apm-button-group-icon"></i>{" "}
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDocumentType("link");
                      setSelectedFile(null);
                    }}
                    className={`apm-button-group-item ${
                      documentType === "link" ? "active" : ""
                    }`}
                  >
                    <i className="bi bi-link-45deg apm-button-group-icon"></i>{" "}
                    Add Link
                  </button>
                </div>

                {/* Upload File Section */}
                {documentType === "upload" && (
                  <div className="apm-upload-container">
                    <label htmlFor="file-upload" className="apm-upload-label">
                      <i className="bi bi-cloud-upload apm-upload-icon"></i>
                      <span>Click to upload or drag and drop</span>
                    </label>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="apm-upload-input"
                    />
                    <small className="apm-upload-hint">
                      Supported: PDF, DOC, DOCX (Max 5MB)
                    </small>

                    {/* Selected File Display */}
                    {selectedFile && (
                      <div className="apm-selected-file">
                        <div className="apm-selected-file-info">
                          <i className="bi bi-file-earmark-check-fill apm-selected-file-icon"></i>
                          <div>
                            <div className="apm-selected-file-name">
                              {selectedFile.name}
                            </div>
                            <div className="apm-selected-file-size">
                              {(selectedFile.size / 1024).toFixed(2)} KB
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="apm-remove-file-button"
                          title="Remove file"
                        >
                          <i className="bi bi-x-circle-fill"></i>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Link Section */}
                {documentType === "link" && (
                  <div className="apm-link-container">
                    <div className="apm-link-group">
                      <label className="apm-form-label">
                        Document URL{" "}
                        <span className="apm-required-asterisk">*</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://drive.google.com/file/d/..."
                        value={documentLink}
                        onChange={(e) => setDocumentLink(e.target.value)}
                        className={`apm-form-input ${
                          errors.documentLink ? "error" : ""
                        }`}
                      />
                      {errors.documentLink && (
                        <div className="apm-form-error">
                          {errors.documentLink}
                        </div>
                      )}
                    </div>
                    <div className="apm-link-group">
                      <label className="apm-form-label">
                        Document Name{" "}
                        <span className="apm-required-asterisk">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Policy Document.pdf"
                        value={documentName}
                        onChange={(e) => setDocumentName(e.target.value)}
                        className={`apm-form-input ${
                          errors.documentName ? "error" : ""
                        }`}
                      />
                      {errors.documentName && (
                        <div className="apm-form-error">
                          {errors.documentName}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* FOOTER - Fixed */}
            <div className="apm-modal-footer">
              <button
                type="button"
                onClick={onClose}
                disabled={loading || uploadingDoc}
                className="apm-btn-cancel"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || uploadingDoc}
                className="apm-btn-submit"
              >
                {uploadingDoc ? (
                  <>
                    <span className="apm-spinner" />
                    Uploading Document...
                  </>
                ) : loading ? (
                  <>
                    <span className="apm-spinner" />
                    Creating...
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
