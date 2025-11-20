import { useState } from "react";
import { Modal, Button, Form, Spinner, CloseButton } from "react-bootstrap";
import departmentService from "../../../../services/auth/departmentService";
import { toast } from "sonner";

const AddDepartmentModal = ({ show, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    departmentName: "",
    departmentCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev, [name]: value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.departmentName.trim()) {
      newErrors.departmentName = "Department name is required";
    } else if (formData.departmentName.trim().length < 3) {
      newErrors.departmentName = "Department name must be at least 3 characters";
    }
    if (!formData.departmentCode.trim()) {
      newErrors.departmentCode = "Department code is required";
    } else if (formData.departmentCode.trim().length < 2) {
      newErrors.departmentCode = "Department code must be at least 2 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Enter Valid Details!");
      return;
    }
    try {
      setLoading(true);
      const response = await departmentService.createDepartment(formData);
      if (response.success) {
        toast.success("Department created successfully");
        onSuccess();
      } else {
        toast.error(response.message || "Failed to create department");
      }
    } catch (error) {
      toast.error(error.message || "Error creating department");
    } finally {
      setLoading(false);
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
        />
      )}
      <Modal
        show={show}
        onHide={onClose}
        centered
        size="md"
        backdrop={false}
        style={{ zIndex: 1050 }}
      >
        <div
          style={{
            borderRadius: '0.5rem',
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            border: 'none',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: '#27235C',
              color: '#fff',
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
                color: '#fff'
              }}
            >
              <i className="bi bi-plus-circle"></i>
              Add Department
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
          {/* Body */}
          <Modal.Body
            style={{
              padding: '28px 28px 10px 28px',
              background: '#fff',
              border: 'none'
            }}
          >
            <Form onSubmit={handleSubmit} autoComplete="off">
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}
              >
                <Form.Group>
                  <Form.Label
                    style={{
                      fontWeight: '600',
                      fontSize: '13px',
                      color: '#334155',
                      marginBottom: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    Department Name <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="departmentName"
                    placeholder="Enter department name"
                    value={formData.departmentName}
                    onChange={handleChange}
                    isInvalid={!!errors.departmentName}
                    maxLength={100}
                    autoFocus
                    style={{
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      fontSize: '14px',
                      backgroundColor: '#fff'
                    }}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.departmentName}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group>
                  <Form.Label
                    style={{
                      fontWeight: '600',
                      fontSize: '13px',
                      color: '#334155',
                      marginBottom: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    Department Code <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="departmentCode"
                    placeholder="Enter department code"
                    value={formData.departmentCode}
                    onChange={handleChange}
                    isInvalid={!!errors.departmentCode}
                    maxLength={100}
                    style={{
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      fontSize: '14px',
                      backgroundColor: '#fff'
                    }}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.departmentCode}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
              {/* Footer */}
              <div
                style={{
                  padding: '20px 0 0 0',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px'
                }}
              >
                <Button
                  variant="secondary"
                  onClick={onClose}
                  disabled={loading}
                  style={{
                    background: '#6c757d',
                    borderColor: '#6c757d',
                    color: '#fff',
                    fontWeight: 600,
                    padding: '8px 16px',
                    fontSize: '13px',
                    borderRadius: '6px'
                  }}
                  onMouseEnter={e => {
                    e.target.style.background = '#5a6268';
                    e.target.style.borderColor = '#5a6268';
                  }}
                  onMouseLeave={e => {
                    e.target.style.background = '#6c757d';
                    e.target.style.borderColor = '#6c757d';
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(90deg, #97247E 0%, #E01950 100%)',
                    border: 'none',
                    color: '#fff',
                    padding: '8px 16px',
                    fontWeight: '600',
                    fontSize: '13px',
                    borderRadius: '6px',
                    boxShadow: '0 2px 8px rgba(151, 36, 126, 0.25)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle"></i>
                      Create Department
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </div>
      </Modal>
    </>
  );
};

export default AddDepartmentModal;
