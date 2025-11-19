import { useState, useEffect } from "react";
import { CloseButton, Badge } from "react-bootstrap";
import policyService from "../../../services/hr_operations/hr/policyService";

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
  const [publishing, setPublishing] = useState(false);
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
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const baseUrl = import.meta.env.VITE_HR_API_URL;
    return `${baseUrl}${url}`;
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

  const handlePublish = async () => {
    try {
      setPublishing(true);
      await policyService.publishPolicy(policy.policyId);
      if (typeof onToast === "function")
        onToast("success", "Policy published successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error publishing policy:", error);
      if (typeof onToast === "function")
        onToast("danger", "Failed to publish policy");
    } finally {
      setPublishing(false);
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
    } finally {
      setUnpublishing(false);
    }
  };

  const handleDeleteClick = () => {
    onClose();
    onDelete(policy.policyId, policy.policyName);
  };

  if (!show) return null;

  const isAnyActionLoading = loading || uploadingDoc || publishing || unpublishing;

  return (
    <>
      {/* Backdrop with Blur */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(39, 35, 92, 0.4)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 1040,
          transition: 'all 0.3s ease'
        }}
        onClick={onClose}
      />

      {/* Modal Wrapper */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '20px'
        }}
      >
        {/* Modal Dialog */}
        <div
          style={{
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '0.5rem',
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            backgroundColor: '#ffffff'
          }}
        >
          {/* Modal Header - Dark Navy Blue */}
          <div
            style={{
              background: '#27235C',
              color: '#ffffff',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}
          >
            <div
              style={{
                fontSize: '16px',
                fontWeight: '600',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#ffffff'
              }}
            >
              <i className="bi bi-pencil-square"></i>
              Edit Policy
              {policy?.isPublished ? (
                <Badge 
                  bg="success"
                  style={{
                    marginLeft: '8px',
                    fontSize: '11px',
                    padding: '4px 8px',
                    fontWeight: '500'
                  }}
                >
                  Published
                </Badge>
              ) : (
                <Badge 
                  bg="warning"
                  style={{
                    marginLeft: '8px',
                    fontSize: '11px',
                    padding: '4px 8px',
                    fontWeight: '500'
                  }}
                >
                  Draft
                </Badge>
              )}
            </div>
            <CloseButton
              onClick={onClose}
              variant="white"
              style={{
                filter: 'brightness(0) invert(1)',
                opacity: 1
              }}
            />
          </div>

          {/* Form - Scrollable Body */}
          <form 
            onSubmit={handleSubmit} 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              flex: 1,
              overflow: 'hidden'
            }}
          >
            {/* Modal Body - Scrollable */}
            <div
              style={{
                padding: '20px',
                overflowY: 'auto',
                flex: 1,
                backgroundColor: '#ffffff',
                maxHeight: 'calc(90vh - 200px)'
              }}
            >
              {/* Two Column Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px',
                  marginBottom: 0
                }}
              >
                {/* LEFT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Policy Name */}
                  <div>
                    <label
                      style={{
                        fontWeight: '600',
                        fontSize: '13px',
                        color: '#334155',
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      Policy Name <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="policyName"
                      placeholder="Enter policy name"
                      value={formData.policyName}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        border: errors.policyName ? '1px solid #ef4444' : '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '13px',
                        transition: 'all 0.2s ease',
                        backgroundColor: '#ffffff',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        if (!errors.policyName) {
                          e.target.style.borderColor = '#27235C';
                          e.target.style.boxShadow = '0 0 0 0.2rem rgba(39, 35, 92, 0.25)';
                        }
                      }}
                      onBlur={(e) => {
                        if (!errors.policyName) {
                          e.target.style.borderColor = '#cbd5e1';
                          e.target.style.boxShadow = 'none';
                        }
                      }}
                    />
                    {errors.policyName && (
                      <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                        {errors.policyName}
                      </div>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label
                      style={{
                        fontWeight: '600',
                        fontSize: '13px',
                        color: '#334155',
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      Category <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        border: errors.category ? '1px solid #ef4444' : '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '13px',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        backgroundColor: '#ffffff',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        if (!errors.category) {
                          e.target.style.borderColor = '#27235C';
                          e.target.style.boxShadow = '0 0 0 0.2rem rgba(39, 35, 92, 0.25)';
                        }
                      }}
                      onBlur={(e) => {
                        if (!errors.category) {
                          e.target.style.borderColor = '#cbd5e1';
                          e.target.style.boxShadow = 'none';
                        }
                      }}
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                        {errors.category}
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label
                      style={{
                        fontWeight: '600',
                        fontSize: '13px',
                        color: '#334155',
                        marginBottom: '6px',
                        display: 'block'
                      }}
                    >
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '13px',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        backgroundColor: '#ffffff',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#27235C';
                        e.target.style.boxShadow = '0 0 0 0.2rem rgba(39, 35, 92, 0.25)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#cbd5e1';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Description */}
                  <div>
                    <label
                      style={{
                        fontWeight: '600',
                        fontSize: '13px',
                        color: '#334155',
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      Description <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                    </label>
                    <textarea
                      name="description"
                      placeholder="Enter policy description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      style={{
                        width: '100%',
                        border: errors.description ? '1px solid #ef4444' : '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '13px',
                        transition: 'all 0.2s ease',
                        resize: 'vertical',
                        minHeight: '80px',
                        maxHeight: '120px',
                        fontFamily: 'inherit',
                        lineHeight: '1.4',
                        backgroundColor: '#ffffff',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        if (!errors.description) {
                          e.target.style.borderColor = '#27235C';
                          e.target.style.boxShadow = '0 0 0 0.2rem rgba(39, 35, 92, 0.25)';
                        }
                      }}
                      onBlur={(e) => {
                        if (!errors.description) {
                          e.target.style.borderColor = '#cbd5e1';
                          e.target.style.boxShadow = 'none';
                        }
                      }}
                    />
                    {errors.description && (
                      <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                        {errors.description}
                      </div>
                    )}
                  </div>

                  {/* Compliance Guidance */}
                  <div>
                    <label
                      style={{
                        fontWeight: '600',
                        fontSize: '13px',
                        color: '#334155',
                        marginBottom: '6px',
                        display: 'block'
                      }}
                    >
                      Compliance Guidance
                    </label>
                    <textarea
                      name="complianceGuidance"
                      placeholder="Enter compliance guidance (optional)"
                      value={formData.complianceGuidance}
                      onChange={handleChange}
                      rows={3}
                      style={{
                        width: '100%',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '13px',
                        transition: 'all 0.2s ease',
                        resize: 'vertical',
                        minHeight: '80px',
                        maxHeight: '120px',
                        fontFamily: 'inherit',
                        lineHeight: '1.4',
                        backgroundColor: '#ffffff',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#27235C';
                        e.target.style.boxShadow = '0 0 0 0.2rem rgba(39, 35, 92, 0.25)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#cbd5e1';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* DOCUMENT SECTION */}
              <div
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  background: '#f9fafb',
                  padding: '1rem',
                  marginTop: '20px'
                }}
              >
                <label
                  style={{
                    fontWeight: '600',
                    marginBottom: '12px',
                    color: '#334155',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <i className="bi bi-file-earmark-text" style={{ fontSize: '14px' }}></i>
                  Policy Document
                </label>

                {/* Existing Document */}
                {existingDocument && (
                  <div
                    style={{
                      marginBottom: '12px',
                      padding: '10px',
                      background: '#e0f2fe',
                      borderRadius: '6px',
                      border: '1px solid #7dd3fc'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '13px' }}>
                        <i
                          className={`bi ${
                            existingDocument.type === "upload"
                              ? "bi-file-earmark-pdf"
                              : "bi-link-45deg"
                          }`}
                          style={{ marginRight: '8px' }}
                        ></i>
                        <strong>{existingDocument.name}</strong>
                        {existingDocument.size && (
                          <small style={{ color: '#64748b', marginLeft: '8px' }}>
                            ({existingDocument.size})
                          </small>
                        )}
                      </div>
                      <a
                        href={getFullDocumentUrl(existingDocument.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '4px 12px',
                          fontSize: '12px',
                          borderRadius: '4px',
                          textDecoration: 'none',
                          border: '1px solid #3b82f6',
                          color: '#3b82f6',
                          backgroundColor: '#ffffff',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <i className="bi bi-eye"></i> View
                      </a>
                    </div>
                  </div>
                )}

                {/* Three Button Group */}
                <div
                  style={{
                    display: 'flex',
                    width: '100%',
                    marginBottom: '1rem',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setDocumentType("none")}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: 'none',
                      backgroundColor: documentType === "none" ? '#27235C' : '#ffffff',
                      color: documentType === "none" ? 'white' : '#6c757d',
                      fontWeight: '500',
                      fontSize: '13px',
                      cursor: 'pointer',
                      borderRight: '1px solid #cbd5e1',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <i className="bi bi-x-circle" style={{ fontSize: '13px' }}></i>
                    {existingDocument ? "Keep Existing" : "No Document"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocumentType("upload")}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: 'none',
                      backgroundColor: documentType === "upload" ? '#27235C' : '#ffffff',
                      color: documentType === "upload" ? 'white' : '#6c757d',
                      fontWeight: '500',
                      fontSize: '13px',
                      cursor: 'pointer',
                      borderRight: '1px solid #cbd5e1',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <i className="bi bi-cloud-upload" style={{ fontSize: '13px' }}></i> Upload New File
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocumentType("link")}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: 'none',
                      backgroundColor: documentType === "link" ? '#27235C' : '#ffffff',
                      color: documentType === "link" ? 'white' : '#6c757d',
                      fontWeight: '500',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <i className="bi bi-link-45deg" style={{ fontSize: '14px' }}></i> Add New Link
                  </button>
                </div>

                {documentType === "upload" && (
                  <div style={{ marginTop: '12px' }}>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      style={{
                        width: '100%',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '8px',
                        fontSize: '13px',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer'
                      }}
                    />
                    <small style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '6px' }}>
                      Supported: PDF, DOC, DOCX (Max 5MB)
                    </small>
                    {selectedFile && (
                      <Badge
                        bg="success"
                        style={{
                          marginTop: '12px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <i className="bi bi-check-circle"></i>
                        {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                      </Badge>
                    )}
                  </div>
                )}

                {documentType === "link" && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <label
                        style={{
                          fontWeight: '600',
                          fontSize: '13px',
                          color: '#334155',
                          marginBottom: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        Document URL <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://drive.google.com/file/d/..."
                        value={documentLink}
                        onChange={(e) => setDocumentLink(e.target.value)}
                        style={{
                          width: '100%',
                          border: errors.documentLink ? '1px solid #ef4444' : '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          fontSize: '13px',
                          transition: 'all 0.2s ease',
                          backgroundColor: '#ffffff',
                          outline: 'none'
                        }}
                      />
                      {errors.documentLink && (
                        <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                          {errors.documentLink}
                        </div>
                      )}
                    </div>
                    <div>
                      <label
                        style={{
                          fontWeight: '600',
                          fontSize: '13px',
                          color: '#334155',
                          marginBottom: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        Document Name <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Policy Document.pdf"
                        value={documentName}
                        onChange={(e) => setDocumentName(e.target.value)}
                        style={{
                          width: '100%',
                          border: errors.documentName ? '1px solid #ef4444' : '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          fontSize: '13px',
                          transition: 'all 0.2s ease',
                          backgroundColor: '#ffffff',
                          outline: 'none'
                        }}
                      />
                      {errors.documentName && (
                        <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                          {errors.documentName}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {errors.submit && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '12px',
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    color: '#991b1b',
                    fontSize: '13px'
                  }}
                >
                  {errors.submit}
                </div>
              )}
            </div>

            {/* Modal Footer - Fixed */}
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
                borderBottomLeftRadius: '0.5rem',
                borderBottomRightRadius: '0.5rem'
              }}
            >
              {/* Left Side - Delete Button */}
              <button
                type="button"
                onClick={handleDeleteClick}
                disabled={isAnyActionLoading}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isAnyActionLoading ? 'not-allowed' : 'pointer',
                  background: '#ef4444',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  opacity: isAnyActionLoading ? 0.65 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isAnyActionLoading) {
                    e.target.style.background = '#dc2626';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isAnyActionLoading) {
                    e.target.style.background = '#ef4444';
                  }
                }}
              >
                <i className="bi bi-trash"></i>
                Delete
              </button>

              {/* Right Side - Action Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {/* Publish Button */}
                {!policy?.isPublished && (
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={isAnyActionLoading}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '600',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isAnyActionLoading ? 'not-allowed' : 'pointer',
                      background: '#22c55e',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease',
                      opacity: isAnyActionLoading ? 0.65 : 1
                    }}
                  >
                    {publishing ? (
                      <>
                        <span
                          style={{
                            width: '14px',
                            height: '14px',
                            border: '2px solid #ffffff',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 0.6s linear infinite',
                            display: 'inline-block'
                          }}
                        />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send"></i>
                        Publish
                      </>
                    )}
                  </button>
                )}

                {/* Unpublish Button */}
                {policy?.isPublished && (
                  <button
                    type="button"
                    onClick={handleUnpublish}
                    disabled={isAnyActionLoading}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '600',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isAnyActionLoading ? 'not-allowed' : 'pointer',
                      background: '#f59e0b',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease',
                      opacity: isAnyActionLoading ? 0.65 : 1
                    }}
                  >
                    {unpublishing ? (
                      <>
                        <span
                          style={{
                            width: '14px',
                            height: '14px',
                            border: '2px solid #ffffff',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 0.6s linear infinite',
                            display: 'inline-block'
                          }}
                        />
                        Unpublishing...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-eye-slash"></i>
                        Unpublish
                      </>
                    )}
                  </button>
                )}

                {/* Cancel Button */}
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isAnyActionLoading}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: '600',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isAnyActionLoading ? 'not-allowed' : 'pointer',
                    background: '#6c757d',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    opacity: isAnyActionLoading ? 0.65 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isAnyActionLoading) {
                      e.target.style.background = '#5a6268';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isAnyActionLoading) {
                      e.target.style.background = '#6c757d';
                    }
                  }}
                >
                  Cancel
                </button>

                {/* Update Button */}
                <button
                  type="submit"
                  disabled={isAnyActionLoading}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: '600',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isAnyActionLoading ? 'not-allowed' : 'pointer',
                    background: 'linear-gradient(90deg, #97247E 0%, #E01950 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.12s ease',
                    boxShadow: '0 2px 8px rgba(151, 36, 126, 0.25)',
                    opacity: isAnyActionLoading ? 0.65 : 1,
                    minWidth: '140px',
                    justifyContent: 'center'
                  }}
                >
                  {uploadingDoc ? (
                    <>
                      <span
                        style={{
                          width: '14px',
                          height: '14px',
                          border: '2px solid #ffffff',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 0.6s linear infinite',
                          display: 'inline-block'
                        }}
                      />
                      Uploading...
                    </>
                  ) : loading ? (
                    <>
                      <span
                        style={{
                          width: '14px',
                          height: '14px',
                          border: '2px solid #ffffff',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 0.6s linear infinite',
                          display: 'inline-block'
                        }}
                      />
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle"></i>
                      Update Policy
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Keyframe Animation for Spinner */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
};

export default EditPolicyModal;
