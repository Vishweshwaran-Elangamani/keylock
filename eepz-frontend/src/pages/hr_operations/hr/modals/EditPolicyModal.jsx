import { useState, useEffect } from "react";
import { Modal, Button, Form, Spinner, Badge } from "react-bootstrap";
import policyService from "../../../../services/hr_operations/hr/policyService";

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

  //  Document state
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

  //  Helper function to get full document URL
  const getFullDocumentUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url; // Already full URL

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

      //  Load existing document if available
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

  //  Handle file selection
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

      //  Handle new document upload/link
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

  //  Handle Publish
  const handlePublish = async () => {
    try {
      setPublishing(true);
      await policyService.publishPolicy(policy.policyId);
      if (typeof onToast === "function")
        onToast("success", " Policy published successfully!");
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

  //  NEW: Handle Unpublish
  const handleUnpublish = async () => {
    try {
      setUnpublishing(true);
      await policyService.unpublishPolicy(policy.policyId);
      if (typeof onToast === "function")
        onToast("warning", " Policy unpublished - Hidden from employees");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error unpublishing policy:", error);
      if (typeof onToast === "function")
        onToast("danger", "Failed to unpublish policy");
    } finally {
      setUnpublishing(false);
    }
  };

  const handleDeleteClick = () => {
    onClose();
    onDelete(policy.policyId, policy.policyName);
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg" className="pm-modal">
      <Modal.Header closeButton className="pm-modal-header">
        <Modal.Title>
          <i className="bi bi-pencil-square me-2"></i>
          Edit Policy
          {/*  Show publish status badge */}
          {policy?.isPublished ? (
            <Badge bg="success" className="ms-2">
              Published
            </Badge>
          ) : (
            <Badge bg="warning" className="ms-2">
              Draft
            </Badge>
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="pm-modal-body">
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>
              Policy Name <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              name="policyName"
              placeholder="Enter policy name"
              value={formData.policyName}
              onChange={handleChange}
              isInvalid={!!errors.policyName}
            />
            <Form.Control.Feedback type="invalid">
              {errors.policyName}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              Category <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              name="category"
              value={formData.category}
              onChange={handleChange}
              isInvalid={!!errors.category}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              {errors.category}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              Description <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              placeholder="Enter policy description"
              value={formData.description}
              onChange={handleChange}
              isInvalid={!!errors.description}
            />
            <Form.Control.Feedback type="invalid">
              {errors.description}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Compliance Guidance</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="complianceGuidance"
              placeholder="Enter compliance guidance (optional)"
              value={formData.complianceGuidance}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Status</Form.Label>
            <Form.Select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {/*  DOCUMENT SECTION */}
          <div
            className="pm-document-section mt-4 p-3"
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              background: "#f9fafb",
            }}
          >
            <Form.Label className="fw-bold mb-3">
              <i className="bi bi-file-earmark-text me-2"></i>
              Policy Document
            </Form.Label>

            {/*  Show existing document with FIXED URL */}
            {existingDocument && (
              <div
                className="mb-3 p-2"
                style={{
                  background: "#e0f2fe",
                  borderRadius: "6px",
                  border: "1px solid #7dd3fc",
                }}
              >
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <i
                      className={`bi ${
                        existingDocument.type === "upload"
                          ? "bi-file-earmark-pdf"
                          : "bi-link-45deg"
                      } me-2`}
                    ></i>
                    <strong>{existingDocument.name}</strong>
                    {existingDocument.size && (
                      <small className="text-muted ms-2">
                        ({existingDocument.size})
                      </small>
                    )}
                  </div>
                  {/*  FIX: Use getFullDocumentUrl helper */}
                  <a
                    href={getFullDocumentUrl(existingDocument.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-primary"
                  >
                    <i className="bi bi-eye me-1"></i> View
                  </a>
                </div>
              </div>
            )}

            {/* Document update options */}
            <div className="btn-group w-100 mb-3" role="group">
              <button
                type="button"
                className={`btn ${
                  documentType === "none"
                    ? "btn-primary"
                    : "btn-outline-secondary"
                }`}
                onClick={() => setDocumentType("none")}
              >
                <i className="bi bi-x-circle me-1"></i>{" "}
                {existingDocument ? "Keep Existing" : "No Document"}
              </button>
              <button
                type="button"
                className={`btn ${
                  documentType === "upload"
                    ? "btn-primary"
                    : "btn-outline-secondary"
                }`}
                onClick={() => setDocumentType("upload")}
              >
                <i className="bi bi-cloud-upload me-1"></i> Upload New File
              </button>
              <button
                type="button"
                className={`btn ${
                  documentType === "link"
                    ? "btn-primary"
                    : "btn-outline-secondary"
                }`}
                onClick={() => setDocumentType("link")}
              >
                <i className="bi bi-link-45deg me-1"></i> Add New Link
              </button>
            </div>

            {documentType === "upload" && (
              <div className="upload-section">
                <Form.Group>
                  <Form.Control
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />
                  <Form.Text className="text-muted">
                    Supported: PDF, DOC, DOCX (Max 5MB)
                  </Form.Text>
                </Form.Group>
                {selectedFile && (
                  <Badge bg="success" className="mt-2">
                    <i className="bi bi-check-circle me-1"></i>
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)}{" "}
                    KB)
                  </Badge>
                )}
              </div>
            )}

            {documentType === "link" && (
              <div className="link-section">
                <Form.Group className="mb-2">
                  <Form.Label>
                    Document URL <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="url"
                    placeholder="https://drive.google.com/file/d/..."
                    value={documentLink}
                    onChange={(e) => setDocumentLink(e.target.value)}
                    isInvalid={!!errors.documentLink}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.documentLink}
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group>
                  <Form.Label>
                    Document Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Policy Document.pdf"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    isInvalid={!!errors.documentName}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.documentName}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            )}
          </div>

          {errors.submit && (
            <div className="alert alert-danger mt-3">{errors.submit}</div>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer className="pm-modal-footer">
        <div className="d-flex justify-content-between w-100">
          <div>
            <Button
              variant="danger"
              onClick={handleDeleteClick}
              disabled={loading || uploadingDoc || publishing || unpublishing}
            >
              <i className="bi bi-trash me-2"></i> Delete
            </Button>
          </div>
          <div className="d-flex gap-2">
            {/*  Publish Button (only show if not published) */}
            {!policy?.isPublished && (
              <Button
                variant="success"
                onClick={handlePublish}
                disabled={loading || uploadingDoc || publishing || unpublishing}
              >
                {publishing ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send me-2"></i>
                    Publish
                  </>
                )}
              </Button>
            )}

            {/*  NEW: Unpublish Button (only show if published) */}
            {policy?.isPublished && (
              <Button
                variant="warning"
                onClick={handleUnpublish}
                disabled={loading || uploadingDoc || publishing || unpublishing}
              >
                {unpublishing ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Unpublishing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-eye-slash me-2"></i>
                    Unpublish
                  </>
                )}
              </Button>
            )}

            <Button
              variant="secondary"
              onClick={onClose}
              disabled={loading || uploadingDoc || publishing || unpublishing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={loading || uploadingDoc || publishing || unpublishing}
              className="pm-btn-submit"
            >
              {uploadingDoc ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Uploading...
                </>
              ) : loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Updating...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  Update Policy
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default EditPolicyModal;
