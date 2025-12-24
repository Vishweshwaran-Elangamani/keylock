import { useState, useEffect } from "react";
import policyService from "../../../services/hr_operations/hr/policyService";
import "../../../styles/hr_operations/hr/EditPolicyModal.css";

const EditPolicyModal = ({
  show,
  policy,
  onClose,
  onSuccess,
  onDelete,
  onToast,
}) => {
  const [formData, setFormData] = useState({
    policyName: "",
    category: "",
    description: "",
    complianceGuidance: "",
    status: "Active",
  });

  const [documentType, setDocumentType] = useState("none");
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentLink, setDocumentLink] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [existingDocument, setExistingDocument] = useState(null);

  const [loading, setLoading] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
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

  const getFullDocumentUrl = (url) => {
    if (!url) {
      console.warn(" Empty document URL provided");
      return "";
    }

    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    const fileName = url.split("/").pop();
    const hrBaseUrl = import.meta.env.VITE_HR_API_URL;
    const fullUrl = `${hrBaseUrl}/api/policy/document/${fileName}`;

    return fullUrl;
  };

  useEffect(() => {
    if (policy) {
      setFormData({
        policyName: policy.policyName || "",
        category: policy.category || "",
        description: policy.description || "",
        complianceGuidance: policy.complianceGuidance || "",
        status: policy.status || "Active",
      });

      if (policy.documentUrl) {
        setExistingDocument({
          url: policy.documentUrl,
          name: policy.documentName,
          type: policy.documentType,
          size: policy.documentSizeFormatted,
        });
      } else {
        setExistingDocument(null);
      }

      setDocumentType("none");
      setSelectedFile(null);
      setDocumentLink("");
      setDocumentName("");
    }
  }, [policy]);

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
      await policyService.updatePolicy(policy.policyId, policyDataWithDoc);
      onSuccess();
      if (typeof onToast === "function")
        onToast("success", "Policy updated successfully!");
    } catch (error) {
      console.error("Error updating policy:", error);
      setErrors({ submit: "Failed to update policy. Please try again." });
      if (typeof onToast === "function")
        onToast("danger", "Failed to update policy");
    } finally {
      setLoading(false);
      setUploadingDoc(false);
    }
  };

  const handleUnpublish = async () => {
    try {
      setUnpublishing(true);
      await policyService.unpublishPolicy(policy.policyId);
      if (typeof onToast === "function")
        onToast("warning", "Policy unpublished - Hidden from employees");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error unpublishing:", error);
      if (typeof onToast === "function")
        onToast("danger", "Failed to unpublish policy");
    } finally {
      setUnpublishing(false);
    }
  };

  const isAnyActionLoading = loading || uploadingDoc || unpublishing;

  if (!show) return null;

  return (
    <>
      <div className="epm-backdrop" onClick={onClose} />

      <div className="epm-modal-container">
        <div className="epm-modal-dialog">
          {/* Header */}
          <div className="epm-modal-header">
            <div className="epm-header-title">
              <i className="bi bi-pencil-square"></i>
              Edit Policy
              {policy?.isPublished ? (
                <span className="epm-badge-published">Published</span>
              ) : (
                <span className="epm-badge-draft">Draft</span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isAnyActionLoading}
              aria-label="Close"
              className="epm-close-button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="epm-form">
            {/* Body */}
            <div className="epm-modal-body">
              {errors.submit && (
                <div className="epm-error-alert">
                  <i className="bi bi-exclamation-triangle-fill epm-error-icon"></i>
                  {errors.submit}
                </div>
              )}

              <div className="epm-form-columns">
                {/* Left Column */}
                <div className="epm-form-column">
                  {/* Policy Name */}
                  <div className="epm-form-group">
                    <label className="epm-form-label">
                      Policy Name{" "}
                      <span className="epm-required-asterisk">*</span>
                    </label>
                    <input
                      type="text"
                      name="policyName"
                      placeholder="Enter policy name"
                      value={formData.policyName}
                      onChange={handleChange}
                      className={`epm-form-input ${
                        errors.policyName ? "error" : ""
                      }`}
                    />
                    {errors.policyName && (
                      <div className="epm-form-error">{errors.policyName}</div>
                    )}
                  </div>

                  {/* Category */}
                  <div className="epm-form-group">
                    <label className="epm-form-label">
                      Category <span className="epm-required-asterisk">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className={`epm-form-input epm-form-select ${
                        errors.category ? "error" : ""
                      }`}
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <div className="epm-form-error">{errors.category}</div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="epm-form-group">
                    <label className="epm-form-label-block">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="epm-form-input epm-form-select"
                    >
                      {statuses.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right Column */}
                <div className="epm-form-column">
                  {/* Description */}
                  <div className="epm-form-group">
                    <label className="epm-form-label">
                      Description{" "}
                      <span className="epm-required-asterisk">*</span>
                    </label>
                    <textarea
                      rows={3}
                      name="description"
                      placeholder="Enter policy description"
                      value={formData.description}
                      onChange={handleChange}
                      className={`epm-form-input epm-form-textarea ${
                        errors.description ? "error" : ""
                      }`}
                    />
                    {errors.description && (
                      <div className="epm-form-error">{errors.description}</div>
                    )}
                  </div>

                  {/* Compliance Guidance */}
                  <div className="epm-form-group">
                    <label className="epm-form-label-block">
                      Compliance Guidance
                    </label>
                    <textarea
                      rows={3}
                      name="complianceGuidance"
                      placeholder="Enter compliance guidance (optional)"
                      value={formData.complianceGuidance}
                      onChange={handleChange}
                      className="epm-form-input epm-form-textarea"
                    />
                  </div>
                </div>
              </div>

              {/* Document Section */}
              <div className="epm-document-section">
                <label className="epm-document-label">
                  <i className="bi bi-file-earmark-text epm-document-icon"></i>
                  Policy Document
                </label>

                {/* Existing Document Display */}
                {existingDocument && (
                  <div className="epm-existing-document">
                    <div className="epm-existing-document-content">
                      <div className="epm-existing-document-info">
                        <i
                          className={`bi ${
                            existingDocument.type === "upload"
                              ? "bi-file-earmark-pdf"
                              : "bi-link-45deg"
                          } epm-existing-document-icon`}
                        ></i>
                        <strong>{existingDocument.name}</strong>
                        {existingDocument.size && (
                          <small className="epm-existing-document-size">
                            ({existingDocument.size})
                          </small>
                        )}
                      </div>
                      <a
                        href={getFullDocumentUrl(existingDocument.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="epm-existing-document-view"
                      >
                        <i className="bi bi-eye"></i> View
                      </a>
                    </div>
                  </div>
                )}

                {/* Document Type Selector */}
                <div className="epm-document-type-selector">
                  <button
                    type="button"
                    onClick={() => setDocumentType("none")}
                    className={`epm-type-button ${
                      documentType === "none" ? "active" : ""
                    }`}
                  >
                    <i className="bi bi-x-circle epm-type-icon"></i>
                    {existingDocument ? "Keep Existing" : "No Document"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocumentType("upload")}
                    className={`epm-type-button ${
                      documentType === "upload" ? "active" : ""
                    }`}
                  >
                    <i className="bi bi-cloud-upload epm-type-icon"></i>
                    Upload New File
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocumentType("link")}
                    className={`epm-type-button ${
                      documentType === "link" ? "active" : ""
                    }`}
                  >
                    <i className="bi bi-link-45deg epm-type-icon"></i>
                    Add New Link
                  </button>
                </div>

                {/* Upload File UI */}
                {documentType === "upload" && (
                  <div className="epm-upload-container">
                    <label
                      htmlFor="file-upload-edit"
                      className="epm-upload-label"
                    >
                      <i className="bi bi-cloud-upload epm-upload-icon"></i>
                      <span>Click to upload or drag and drop</span>
                    </label>
                    <input
                      id="file-upload-edit"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="epm-upload-input"
                    />
                    <small className="epm-upload-hint">
                      Supported: PDF, DOC, DOCX (Max 5MB)
                    </small>

                    {/* Selected File Display */}
                    {selectedFile && (
                      <div className="epm-selected-file">
                        <div className="epm-selected-file-info">
                          <i className="bi bi-file-earmark-check-fill epm-selected-file-icon"></i>
                          <div>
                            <div className="epm-selected-file-name">
                              {selectedFile.name}
                            </div>
                            <div className="epm-selected-file-size">
                              {(selectedFile.size / 1024).toFixed(2)} KB
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="epm-selected-file-remove"
                          title="Remove file"
                        >
                          <i className="bi bi-x-circle-fill"></i>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Link UI */}
                {documentType === "link" && (
                  <div className="epm-link-container">
                    <div className="epm-link-group">
                      <label className="epm-form-label">
                        Document URL{" "}
                        <span className="epm-required-asterisk">*</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://drive.google.com/file/d/..."
                        value={documentLink}
                        onChange={(e) => setDocumentLink(e.target.value)}
                        className={`epm-form-input ${
                          errors.documentLink ? "error" : ""
                        }`}
                      />
                      {errors.documentLink && (
                        <div className="epm-form-error">
                          {errors.documentLink}
                        </div>
                      )}
                    </div>
                    <div className="epm-link-group">
                      <label className="epm-form-label">
                        Document Name{" "}
                        <span className="epm-required-asterisk">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Policy Document.pdf"
                        value={documentName}
                        onChange={(e) => setDocumentName(e.target.value)}
                        className={`epm-form-input ${
                          errors.documentName ? "error" : ""
                        }`}
                      />
                      {errors.documentName && (
                        <div className="epm-form-error">
                          {errors.documentName}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="epm-modal-footer">
              {policy?.isPublished && (
                <button
                  type="button"
                  onClick={handleUnpublish}
                  disabled={isAnyActionLoading}
                  className="epm-btn-unpublish"
                >
                  {unpublishing ? (
                    <>
                      <span className="epm-spinner unpublish" />
                      Unpublishing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-eye-slash"></i> Unpublish
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                disabled={isAnyActionLoading}
                className="epm-btn-cancel"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isAnyActionLoading}
                className="epm-btn-submit"
              >
                {loading || uploadingDoc ? (
                  <>
                    <span className="epm-spinner submit" />
                    {uploadingDoc ? "Uploading..." : "Updating..."}
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i> Update Policy
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

export default EditPolicyModal;
