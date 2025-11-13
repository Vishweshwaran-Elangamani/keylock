import { useState, useEffect } from "react";
import promotionService from "../../../services/internal/promotionService";
import internalOpportunityService from "../../../services/internal/internalOpportunityService";
import toastr from "toastr";
import "../../../styles/internal/NominationModal.css";

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

      console.log("Selected nomination object:", nomination);

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
      toastr.error("Please fix the errors");
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

      console.log("Creating promotion with payload:", payload);

      const response = await promotionService.createPromotion(payload);

      if (response.success) {
        toastr.success("Promotion created successfully!");
        onPromotionCreated();
        onHide();
      } else {
        toastr.error(response.message || "Failed to create promotion");
      }
    } catch (error) {
      console.error("Error:", error);
      toastr.error(error.message || "Failed to create promotion");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop-custom"></div>
      <div className="modal-wrapper-custom">
        <div className="modal-dialog-custom modal-dialog-large">
          <div className="modal-content-custom">
            <div className="modal-header-custom">
              <h5 className="modal-title-custom">
                <i className="bi bi-arrow-up-circle"></i>
                Create Promotion
              </h5>
              <button
                type="button"
                className="modal-close-btn"
                onClick={onHide}
                disabled={loading}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body-custom">
                <div className="form-grid">
                  <div className="form-group-custom full-width">
                    <label className="form-label-custom">
                      Select Approved Nomination{" "}
                      <span className="required-mark">*</span>
                    </label>
                    <select
                      name="nominationId"
                      className={`form-select-custom ${
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
                      <div className="error-message">{errors.nominationId}</div>
                    )}
                  </div>

                  {selectedNomination && (
                    <div className="info-section">
                      <p>
                        <strong>Nominee:</strong> {selectedNomination.nomineeName}
                      </p>
                      <p>
                        <strong>Opportunity:</strong>{" "}
                        {selectedNomination.opportunityName}
                      </p>
                    </div>
                  )}

                  <div className="form-group-custom full-width">
                    <label className="form-label-custom">
                      Department <span className="required-mark">*</span>
                    </label>
                    <select
                      name="departmentId"
                      className={`form-select-custom ${
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
                      <div className="error-message">{errors.departmentId}</div>
                    )}
                  </div>

                  <div className="form-group-custom">
                    <label className="form-label-custom">
                      Current Role <span className="required-mark">*</span>
                    </label>
                    <input
                      type="text"
                      name="oldRole"
                      className={`form-input-custom ${
                        errors.oldRole ? "is-invalid" : ""
                      }`}
                      placeholder="Enter current role"
                      value={formData.oldRole}
                      onChange={handleChange}
                    />
                    {errors.oldRole && (
                      <div className="error-message">{errors.oldRole}</div>
                    )}
                  </div>

                  <div className="form-group-custom">
                    <label className="form-label-custom">
                      New Role <span className="required-mark">*</span>
                    </label>
                    <input
                      type="text"
                      name="newRole"
                      className={`form-input-custom ${
                        errors.newRole ? "is-invalid" : ""
                      }`}
                      placeholder="Enter new role"
                      value={formData.newRole}
                      onChange={handleChange}
                    />
                    {errors.newRole && (
                      <div className="error-message">{errors.newRole}</div>
                    )}
                  </div>

                  <div className="form-group-custom full-width">
                    <label className="form-label-custom">
                      Promotion Date <span className="required-mark">*</span>
                    </label>
                    <input
                      type="date"
                      name="promotionDate"
                      className={`form-input-custom ${
                        errors.promotionDate ? "is-invalid" : ""
                      }`}
                      value={formData.promotionDate}
                      onChange={handleChange}
                    />
                    {errors.promotionDate && (
                      <div className="error-message">{errors.promotionDate}</div>
                    )}
                  </div>

                  <div className="form-group-custom full-width">
                    <label className="form-label-custom">
                      Justification <span className="required-mark">*</span>
                    </label>
                    <textarea
                      name="justification"
                      className={`form-textarea-custom ${
                        errors.justification ? "is-invalid" : ""
                      }`}
                      placeholder="Enter justification for this promotion..."
                      value={formData.justification}
                      onChange={handleChange}
                      rows={4}
                      maxLength={500}
                    />
                    {errors.justification && (
                      <div className="error-message">{errors.justification}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer-custom">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={onHide}
                  disabled={loading}
                >
                  <i className="bi bi-x-circle"></i>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-custom"></span>
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
      </div>
    </>
  );
};

export default CreatePromotionModal;
