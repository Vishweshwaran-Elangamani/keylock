import React, { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import promotionsService from "../../../../services/hr_operations/hr/promotionsService";
import careerProgressionService from "../../../../services/hr_operations/hr/careerProgressionService";
import departmentService from "../../../../services/auth/departmentService";
import userService from "../../../../services/auth/userService";

const CreatePromotionModal = ({ show, onHide, onPromotionCreated }) => {
  const [formData, setFormData] = useState({
    employeeUserId: "",
    departmentId: "",
    oldRole: "",
    newRole: "",
    promotionDate: "",
    justification: "",
    additionalJustification: "", //   FIELD
  });

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  //   States for pending nomination check
  const [pendingNomination, setPendingNomination] = useState(null);
  const [checkingPending, setCheckingPending] = useState(false);
  const [showAdditionalJustification, setShowAdditionalJustification] =
    useState(false);

  const currentUserId = parseInt(localStorage.getItem("userId"));

  useEffect(() => {
    if (show) {
      fetchDepartments();
      fetchEmployees();
      // Reset states when modal opens
      setPendingNomination(null);
      setShowAdditionalJustification(false);
    }
  }, [show]);

  //   Check for pending nomination when employee is selected
  useEffect(() => {
    if (formData.employeeUserId) {
      checkForPendingNomination();
    } else {
      setPendingNomination(null);
      setShowAdditionalJustification(false);
    }
  }, [formData.employeeUserId]);

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getAllDepartments();
      setDepartments(response.data || []);
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await userService.getAllUsers();
      setEmployees(response.data || []);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  //   Check if employee has pending nomination
  const checkForPendingNomination = async () => {
    if (!formData.employeeUserId) return;

    setCheckingPending(true);
    try {
      const response = await careerProgressionService.checkPendingNomination(
        parseInt(formData.employeeUserId)
      );

      if (response.data && response.data.hasPendingNomination) {
        console.log(" Pending nomination found:", response.data);
        setPendingNomination(response.data);
        setShowAdditionalJustification(false);
      } else {
        console.log(" No pending nomination");
        setPendingNomination(null);
        setShowAdditionalJustification(false);
      }
    } catch (err) {
      console.error("Error checking pending nomination:", err);
      setPendingNomination(null);
    } finally {
      setCheckingPending(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      //  VALIDATION: If pending exists and newRole is different, require additional justification
      if (
        pendingNomination &&
        formData.newRole !== pendingNomination.pendingNewRole &&
        !formData.additionalJustification.trim()
      ) {
        setError(
          "Additional justification is required to nominate for a different position"
        );
        setLoading(false);
        return;
      }

      //  VALIDATION: If newRole matches pending nomination
      if (
        pendingNomination &&
        formData.newRole === pendingNomination.pendingNewRole
      ) {
        setError(
          ` DUPLICATE! Employee is already nominated for "${pendingNomination.pendingNewRole}" (PromotionId: ${pendingNomination.pendingPromotionId})`
        );
        setLoading(false);
        return;
      }

      //  CALL SERVICE WITH ALL DATA
      const promotionPayload = {
        employeeUserId: parseInt(formData.employeeUserId),
        departmentId: parseInt(formData.departmentId),
        managerId: currentUserId, //  ADD MANAGER ID
        oldRole: formData.oldRole,
        newRole: formData.newRole,
        promotionDate: formData.promotionDate,
        justification: formData.justification,
        additionalJustification: formData.additionalJustification || null, //  INCLUDE IF PRESENT
      };

      console.log(" Submitting promotion payload:", promotionPayload);

      await careerProgressionService.createPromotion(promotionPayload);

      onPromotionCreated();
    } catch (err) {
      console.error(" Error in handleSubmit:", err);
      setError(err.message || "Failed to create promotion");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      employeeUserId: "",
      departmentId: "",
      oldRole: "",
      newRole: "",
      promotionDate: "",
      justification: "",
      additionalJustification: "",
    });
    setPendingNomination(null);
    setShowAdditionalJustification(false);
    setError(null);
    onHide();
  };

  //   Check if nominating for different position
  const isDifferentPosition =
    pendingNomination &&
    formData.newRole &&
    formData.newRole !== pendingNomination.pendingNewRole;

  return (
    <Modal show={show} onHide={handleClose} size="lg" className="promo-modal">
      <Modal.Header closeButton className="promo-modal-header">
        <Modal.Title>
          <i className="bi bi-plus-circle me-2"></i>
          Create Promotion Proposal
        </Modal.Title>
      </Modal.Header>

      <form onSubmit={handleSubmit}>
        <Modal.Body className="promo-modal-body">
          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </div>
          )}

          {/*   Pending Nomination Alert */}
          {pendingNomination && (
            <div className="alert alert-warning" role="alert">
              <i className="bi bi-exclamation-circle-fill me-2"></i>
              <strong> Existing Nomination Found!</strong>
              <br />
              Employee already has a PENDING nomination for "
              <strong>{pendingNomination.pendingNewRole}</strong>" (PromotionId:{" "}
              {pendingNomination.pendingPromotionId})
              <br />
              <small>
                Created:{" "}
                {new Date(
                  pendingNomination.pendingCreatedAt
                ).toLocaleDateString()}
              </small>
              <br />
              <br />
              {isDifferentPosition ? (
                <>
                  <strong>You are nominating for a DIFFERENT position.</strong>
                  <br />
                  Please provide additional justification below explaining why
                  you're nominating the same employee for another position.
                </>
              ) : (
                <>
                  <strong>
                    {" "}
                    Cannot create duplicate nomination for the same position!
                  </strong>
                </>
              )}
            </div>
          )}

          <div className="promo-form-grid">
            <div className="promo-form-column">
              <div className="mb-3">
                <label htmlFor="employeeUserId" className="form-label">
                  Employee <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  id="employeeUserId"
                  name="employeeUserId"
                  value={formData.employeeUserId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.userId} value={emp.userId}>
                      {emp.email} - {emp.departmentName || "No Department"}
                    </option>
                  ))}
                </select>
                {checkingPending && formData.employeeUserId && (
                  <small className="form-text text-muted">
                    <i className="bi bi-hourglass-split me-1"></i>Checking
                    pending nominations...
                  </small>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="departmentId" className="form-label">
                  Department <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  id="departmentId"
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.departmentId} value={dept.departmentId}>
                      {dept.departmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label htmlFor="oldRole" className="form-label">
                  Current Role <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="oldRole"
                  name="oldRole"
                  value={formData.oldRole}
                  onChange={handleChange}
                  placeholder="e.g., Senior Engineer"
                  required
                />
              </div>
            </div>

            <div className="promo-form-column">
              <div className="mb-3">
                <label htmlFor="newRole" className="form-label">
                  Promoted To <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="newRole"
                  name="newRole"
                  value={formData.newRole}
                  onChange={handleChange}
                  placeholder="e.g., Tech Lead"
                  required
                  disabled={
                    pendingNomination &&
                    formData.newRole === pendingNomination.pendingNewRole
                  }
                />
              </div>

              <div className="mb-3">
                <label htmlFor="promotionDate" className="form-label">
                  Effective Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  id="promotionDate"
                  name="promotionDate"
                  value={formData.promotionDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="justification" className="form-label">
                  Justification <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control promo-textarea-full"
                  id="justification"
                  name="justification"
                  value={formData.justification}
                  onChange={handleChange}
                  placeholder="Provide reason for promotion"
                  rows="3"
                  required
                />
                <small className="form-text text-muted">
                  Salary details will be added by HR during approval
                </small>
              </div>
            </div>
          </div>

          {/*   Additional Justification Field for Multiple Nominations */}
          {isDifferentPosition && (
            <div className="mb-3">
              <label htmlFor="additionalJustification" className="form-label">
                Why nominating for different position?
                <span className="text-danger">*</span>
              </label>
              <textarea
                className="form-control promo-textarea-full"
                id="additionalJustification"
                name="additionalJustification"
                value={formData.additionalJustification}
                onChange={handleChange}
                placeholder="Explain why employee should be nominated for this different position..."
                rows="4"
                required={isDifferentPosition}
              />
              <small className="form-text text-muted">
                This additional justification is required since the employee is
                already nominated for a different position.
              </small>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer className="promo-modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn promo-btn-submit"
            disabled={
              loading ||
              checkingPending ||
              (isDifferentPosition && !formData.additionalJustification.trim())
            }
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                ></span>
                Creating...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Create Promotion
              </>
            )}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default CreatePromotionModal;
