import { useState, useEffect } from "react";
import promotionService from "../../../services/internal/promotionService";
import internalOpportunityService from "../../../services/internal/internalOpportunityService";
import { toast } from "sonner";
import "../../../styles/internal/CreatePromotionModal.css";

const CreatePromotionModal = ({
  show,
  onHide,
  approvedNominations,
  onPromotionCreated,
}) => {
  const [formData, setFormData] = useState({
    nominationId: "",
    departmentId: "",
    oldRole: "",
    newRole: "",
    promotionDate: new Date().toISOString().split("T")[0],
    justification: "",
  });
  const [selectedNomination, setSelectedNomination] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await internalOpportunityService.getAllOpportunities();
      if (response.success && Array.isArray(response.data)) {
        const uniqueDepts = [
          ...new Map(
            response.data
              .filter((opp) => opp.departmentId && opp.departmentName)
              .map((opp) => [
                opp.departmentId,
                {
                  departmentId: opp.departmentId,
                  departmentName: opp.departmentName,
                },
              ])
          ).values(),
        ];
        setDepartments(uniqueDepts);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const handleNominationChange = (e) => {
    const nominationId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      nominationId,
    }));

    if (nominationId) {
      const nomination = approvedNominations.find(
        (n) => n.nominationId === parseInt(nominationId)
      );

      setSelectedNomination(nomination);

      if (nomination) {
        setFormData((prev) => ({
          ...prev,
          newRole: nomination.opportunityName || "",
          departmentId: nomination.departmentId || prev.departmentId,
        }));
      }
    } else {
      setSelectedNomination(null);
    }

    if (errors.nominationId) {
      setErrors((prev) => ({
        ...prev,
        nominationId: "",
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nominationId) {
      newErrors.nominationId = "Please select a nomination";
    }

    if (!formData.departmentId) {
      newErrors.departmentId = "Please select a department";
    }

    if (!formData.oldRole.trim()) {
      newErrors.oldRole = "Old role is required";
    }

    if (!formData.newRole.trim()) {
      newErrors.newRole = "New role is required";
    }

    if (!formData.promotionDate) {
      newErrors.promotionDate = "Promotion date is required";
    }

    if (!formData.justification.trim()) {
      newErrors.justification = "Justification is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        nominationId: parseInt(formData.nominationId),
        employeeUserId: selectedNomination?.nomineeUserId,
        departmentId: parseInt(formData.departmentId),
        oldRole: formData.oldRole.trim(),
        newRole: formData.newRole.trim(),
        oldSalary: 0,
        newSalary: 0,
        incrementPercentage: 0,
        promotionDate: formData.promotionDate,
        justification: formData.justification.trim(),
      };

      const response = await promotionService.createPromotion(payload);

      if (response.success) {
        toast.success("Promotion created successfully!");
        onPromotionCreated();
        onHide();
      } else {
        toast.error(response.message || "Failed to create promotion");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to create promotion");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="cpm-backdrop" onClick={onHide} />

      <div className="cpm-modal-wrapper">
        <div className="cpm-modal-dialog">
          {/* Modal Header */}
          <div className="cpm-modal-header">
            <h5 className="cpm-header-title">
              <i className="bi bi-arrow-up-circle"></i>
              Create Promotion
            </h5>
            <button
              type="button"
              className="cpm-close-button"
              onClick={onHide}
              disabled={loading}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="cpm-form">
            {/* Modal Body */}
            <div className="cpm-modal-body">
              <div className="cpm-form-grid">
                {/* Select Approved Nomination - Full Width */}
                <div className="cpm-form-group full-width">
                  <label className="cpm-form-label">
                    Select Approved Nomination{" "}
                    <span className="cpm-required-asterisk">*</span>
                  </label>
                  <select
                    name="nominationId"
                    className={`cpm-form-select ${
                      errors.nominationId ? "is-invalid" : ""
                    }`}
                    value={formData.nominationId}
                    onChange={handleNominationChange}
                  >
                    <option value="">-- Choose a Nomination --</option>
                    {approvedNominations.map((nom) => (
                      <option key={nom.nominationId} value={nom.nominationId}>
                        {nom.nomineeName} - {nom.opportunityName}
                      </option>
                    ))}
                  </select>
                  {errors.nominationId && (
                    <div className="cpm-form-error">{errors.nominationId}</div>
                  )}
                </div>

                {/* Info Section - Conditional */}
                {selectedNomination && (
                  <div className="cpm-info-section">
                    <p>
                      <strong>Nominee:</strong> {selectedNomination.nomineeName}
                    </p>
                    <p>
                      <strong>Opportunity:</strong>{" "}
                      {selectedNomination.opportunityName}
                    </p>
                  </div>
                )}

                {/* Department - Full Width */}
                <div className="cpm-form-group full-width">
                  <label className="cpm-form-label">
                    Department <span className="cpm-required-asterisk">*</span>
                  </label>
                  <select
                    name="departmentId"
                    className={`cpm-form-select ${
                      errors.departmentId ? "is-invalid" : ""
                    }`}
                    value={formData.departmentId}
                    onChange={handleChange}
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((dept) => (
                      <option key={dept.departmentId} value={dept.departmentId}>
                        {dept.departmentName}
                      </option>
                    ))}
                  </select>
                  {errors.departmentId && (
                    <div className="cpm-form-error">{errors.departmentId}</div>
                  )}
                </div>

                {/* Current Role */}
                <div className="cpm-form-group">
                  <label className="cpm-form-label">
                    Current Role{" "}
                    <span className="cpm-required-asterisk">*</span>
                  </label>
                  <input
                    type="text"
                    name="oldRole"
                    className={`cpm-form-input ${
                      errors.oldRole ? "is-invalid" : ""
                    }`}
                    placeholder="Enter current role"
                    value={formData.oldRole}
                    onChange={handleChange}
                  />
                  {errors.oldRole && (
                    <div className="cpm-form-error">{errors.oldRole}</div>
                  )}
                </div>

                {/* New Role */}
                <div className="cpm-form-group">
                  <label className="cpm-form-label">
                    New Role <span className="cpm-required-asterisk">*</span>
                  </label>
                  <input
                    type="text"
                    name="newRole"
                    className={`cpm-form-input ${
                      errors.newRole ? "is-invalid" : ""
                    }`}
                    placeholder="Enter new role"
                    value={formData.newRole}
                    onChange={handleChange}
                  />
                  {errors.newRole && (
                    <div className="cpm-form-error">{errors.newRole}</div>
                  )}
                </div>

                {/* Promotion Date - Full Width */}
                <div className="cpm-form-group full-width">
                  <label className="cpm-form-label">
                    Promotion Date{" "}
                    <span className="cpm-required-asterisk">*</span>
                  </label>
                  <input
                    type="date"
                    name="promotionDate"
                    className={`cpm-form-input ${
                      errors.promotionDate ? "is-invalid" : ""
                    }`}
                    value={formData.promotionDate}
                    onChange={handleChange}
                  />
                  {errors.promotionDate && (
                    <div className="cpm-form-error">{errors.promotionDate}</div>
                  )}
                </div>

                {/* Justification - Full Width */}
                <div className="cpm-form-group full-width">
                  <label className="cpm-form-label">
                    Justification{" "}
                    <span className="cpm-required-asterisk">*</span>
                  </label>
                  <textarea
                    name="justification"
                    className={`cpm-form-textarea ${
                      errors.justification ? "is-invalid" : ""
                    }`}
                    placeholder="Enter justification for this promotion..."
                    value={formData.justification}
                    onChange={handleChange}
                    rows={4}
                    maxLength={500}
                  />
                  {errors.justification && (
                    <div className="cpm-form-error">{errors.justification}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="cpm-modal-footer">
              <button
                type="button"
                className="cpm-btn-cancel"
                onClick={onHide}
                disabled={loading}
              >
                <i className="bi bi-x-circle"></i>
                Cancel
              </button>
              <button
                type="submit"
                className="cpm-btn-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="cpm-spinner"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i>
                    Create Promotion
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

export default CreatePromotionModal;
