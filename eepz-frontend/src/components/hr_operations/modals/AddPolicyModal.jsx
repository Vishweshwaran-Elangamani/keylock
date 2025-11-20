import { useState } from "react";
import { Modal, Button, Form, Spinner, Badge, CloseButton } from "react-bootstrap";
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

  return (
    <>
      {/* Custom Backdrop with Blur Effect */}
      {show && (
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
      )}

      <Modal 
        show={show} 
        onHide={onClose} 
        centered 
        size="lg"
        backdrop={false}
        style={{ 
          zIndex: 1050
        }}
      >
        <div style={{
          borderRadius: '0.5rem',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          border: 'none',
        }}>
          {/* HEADER with White Close Button */}
          <div 
            style={{
              background: '#27235C',
              color: '#ffffff',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative'
            }}
          >
            <div 
              style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                color: '#ffffff'
              }}
            >
              <i className="bi bi-plus-circle"></i>
              Create New Policy
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
          
          {/* BODY */}
          <Modal.Body 
            style={{ 
              padding: '20px', 
              background: '#ffffff',
              overflowY: 'auto',
              maxHeight: 'calc(90vh - 140px)',
              border: 'none'
            }}
          >
            <Form onSubmit={handleSubmit}>
              {errors.submit && (
                <div 
                  style={{ 
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '13px',
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fecaca',
                    color: '#991b1b'
                  }}
                >
                  {errors.submit}
                </div>
              )}

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
                  <Form.Group>
                    <Form.Label 
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
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="policyName"
                      placeholder="Enter policy name"
                      value={formData.policyName}
                      onChange={handleChange}
                      isInvalid={!!errors.policyName}
                      style={{
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '13px',
                        transition: 'all 0.2s ease',
                        backgroundColor: '#ffffff'
                      }}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.policyName}
                    </Form.Control.Feedback>
                  </Form.Group>

                  {/* Category */}
                  <Form.Group>
                    <Form.Label 
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
                    </Form.Label>
                    <Form.Select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      isInvalid={!!errors.category}
                      style={{
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '13px',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <option value="">Leave</option>
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

                  {/* Status */}
                  <Form.Group>
                    <Form.Label 
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
                      Status
                    </Form.Label>
                    <Form.Select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      style={{
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '13px',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      {statuses.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Text 
                      style={{ 
                        fontSize: '11px', 
                        color: '#64748b', 
                        marginTop: '2px', 
                        fontStyle: 'italic',
                        display: 'block'
                      }}
                    >
                      Draft by default (publish later)
                    </Form.Text>
                  </Form.Group>
                </div>

                {/* RIGHT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Description */}
                  <Form.Group>
                    <Form.Label 
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
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="description"
                      placeholder="Enter policy description"
                      value={formData.description}
                      onChange={handleChange}
                      isInvalid={!!errors.description}
                      style={{
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
                        backgroundColor: '#ffffff'
                      }}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.description}
                    </Form.Control.Feedback>
                  </Form.Group>

                  {/* Compliance Guidance */}
                  <Form.Group>
                    <Form.Label 
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
                      Compliance Guidance
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="complianceGuidance"
                      placeholder="Enter compliance guidance (optional)"
                      value={formData.complianceGuidance}
                      onChange={handleChange}
                      style={{
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
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </Form.Group>
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
                <Form.Label 
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
                  Attach Policy Document (Optional)
                </Form.Label>

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
                    <i className="bi bi-x-circle" style={{ fontSize: '13px' }}></i> No Document
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
                    <i className="bi bi-cloud-upload" style={{ fontSize: '13px' }}></i> Upload File
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
                    <i className="bi bi-link-45deg" style={{ fontSize: '14px' }}></i> Add Link
                  </button>
                </div>

                {documentType === "upload" && (
                  <div style={{ marginTop: '12px' }}>
                    <Form.Group>
                      <Form.Control
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        style={{
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '8px',
                          fontSize: '13px',
                          backgroundColor: '#ffffff',
                          cursor: 'pointer'
                        }}
                      />
                      <Form.Text 
                        style={{ 
                          fontSize: '11px', 
                          color: '#64748b',
                          display: 'block',
                          marginTop: '6px'
                        }}
                      >
                        Supported: PDF, DOC, DOCX (Max 5MB)
                      </Form.Text>
                    </Form.Group>
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
                    <Form.Group style={{ marginBottom: '12px' }}>
                      <Form.Label 
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
                      </Form.Label>
                      <Form.Control
                        type="url"
                        placeholder="https://drive.google.com/file/d/..."
                        value={documentLink}
                        onChange={(e) => setDocumentLink(e.target.value)}
                        isInvalid={!!errors.documentLink}
                        style={{
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          fontSize: '13px',
                          transition: 'all 0.2s ease',
                          backgroundColor: '#ffffff'
                        }}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.documentLink}
                      </Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group>
                      <Form.Label 
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
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Policy Document.pdf"
                        value={documentName}
                        onChange={(e) => setDocumentName(e.target.value)}
                        isInvalid={!!errors.documentName}
                        style={{
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          fontSize: '13px',
                          transition: 'all 0.2s ease',
                          backgroundColor: '#ffffff'
                        }}
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
          
          {/* FOOTER */}
          <div 
            style={{
              padding: '12px 20px',
              borderTop: '1px solid #e2e8f0',
              background: '#ffffff',
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
              borderBottomLeftRadius: '12px',
              borderBottomRightRadius: '12px'
            }}
          >

            {/* CANCEL BUTTON - Updated Color */}
            <Button
              onClick={onClose}
              disabled={loading || uploadingDoc}
              style={{
                background: '#6c757d',
                borderColor: '#6c757d',
                color: '#ffffff',
                fontWeight: '600',
                padding: '8px 16px',
                fontSize: '13px',
                borderRadius: '6px',
              }}
              onMouseEnter={(e) => {
                if (!sendingReminder) {
                  e.target.style.background = '#5a6268';
                  e.target.style.borderColor = '#5a6268';
                }
              }}
              onMouseLeave={(e) => {
                if (!sendingReminder) {
                  e.target.style.background = '#6c757d';
                  e.target.style.borderColor = '#6c757d';
                }
              }}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={loading || uploadingDoc}
              style={{
                background: 'linear-gradient(90deg, #97247E 0%, #E01950 100%)',
                border: 'none',
                color: '#ffffff',
                padding: '8px 16px',
                fontWeight: '600',
                fontSize: '13px',
                borderRadius: '6px',
                transition: 'all 0.12s ease',
                boxShadow: '0 2px 8px rgba(151, 36, 126, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {uploadingDoc ? (
                <>
                  <Spinner animation="border" size="sm" />
                  Uploading Document...
                </>
              ) : loading ? (
                <>
                  <Spinner animation="border" size="sm" />
                  Creating...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle"></i>
                  Create Policy
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AddPolicyModal;
