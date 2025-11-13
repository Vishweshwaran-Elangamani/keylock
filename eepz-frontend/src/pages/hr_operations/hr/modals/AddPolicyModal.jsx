import { useState } from "react";
import { Modal, Button, Form, Spinner, Badge } from "react-bootstrap";
import policyService from "../../../../services/hr_operations/hr/policyService";

const AddPolicyModal = ({ show, onClose, onSuccess, onToast }) => {
  const [formData, setFormData] = useState({
    policyName: "",
    category: "",
    description: "",
    complianceGuidance: "",
    status: "Draft",
  });

  //  Document state
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

  return (
    <Modal show={show} onHide={onClose} centered size="lg" className="pm-modal">
      <Modal.Header closeButton className="pm-modal-header">
        <Modal.Title>
          <i className="bi bi-plus-circle me-2"></i>
          Create New Policy
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="pm-modal-body">
        <Form onSubmit={handleSubmit}>
          {errors.submit && (
            <div className="alert alert-danger mb-3">{errors.submit}</div>
          )}

          <div className="pm-form-grid">
            <div className="pm-form-column">
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
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  {statuses.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  Draft by default (publish later)
                </Form.Text>
              </Form.Group>
            </div>

            <div className="pm-form-column">
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
                  className="pm-textarea-full"
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
                  className="pm-textarea-full"
                />
              </Form.Group>
            </div>
          </div>

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
              Attach Policy Document (Optional)
            </Form.Label>

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
                <i className="bi bi-x-circle me-1"></i> No Document
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
                <i className="bi bi-cloud-upload me-1"></i> Upload File
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
                <i className="bi bi-link-45deg me-1"></i> Add Link
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
        </Form>
      </Modal.Body>
      <Modal.Footer className="pm-modal-footer">
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={loading || uploadingDoc}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={loading || uploadingDoc}
          className="pm-btn-submit"
        >
          {uploadingDoc ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Uploading Document...
            </>
          ) : loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Creating...
            </>
          ) : (
            <>
              <i className="bi bi-check-circle me-2"></i>
              Create Policy
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddPolicyModal;
