import { useState, useEffect } from "react";
import nominationService from "../../../services/internal/nominationService";
import userService from "../../../services/auth/userService";
import toastr from "toastr";
import "../../../styles/internal/NominationModal.css";

const ManagerNominateModal = ({
  show,
  onHide,
  opportunity,
  onNominationSubmitted,
}) => {
  const [formData, setFormData] = useState({
    employeeId: "",
    justification: "",
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (show) {
      fetchEmployees();
    }
  }, [show]);

  const fetchEmployees = async () => {

    try {
  
      setLoadingEmployees(true);
  
      // ⭐ FIX: Get userId from localStorage and validate it
  
      const userIdStr = localStorage.getItem("userId");
  
      console.log("🔍 Raw userId from localStorage:", userIdStr);
  
      if (!userIdStr) {
  
        console.error("❌ No userId found in localStorage");
  
        toast.error("User ID not found. Please login again.");
  
        setEmployees([]);
  
        return;
  
      }
  
      const managerId = parseInt(userIdStr);
  
      console.log("📋 Fetching employees for manager ID:", managerId);
  
      if (isNaN(managerId) || managerId <= 0) {
  
        console.error("❌ Invalid manager ID:", managerId);
  
        toast.error("Invalid user ID. Please login again.");
  
        setEmployees([]);
  
        return;
  
      }
  
      // Call the service function
  
      const response = await userService.getEmployeesByManager(managerId);
  
      console.log("Employees response:", response);
  
      // Handle response format
  
      const employeeList = response.data || response || [];
  
      setEmployees(employeeList);
  
      console.log("👥 Employees loaded:", employeeList.length);
  
    } catch (error) {
  
      console.error("Error fetching employees:", error);
  
      setEmployees([]);
  
      toast.error("Failed to load employees");
  
    } finally {
  
      setLoadingEmployees(false);
  
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

    if (!formData.employeeId) {
      newErrors.employeeId = "Please select a team member";
    }

    if (!formData.justification.trim()) {
      newErrors.justification = "Justification is required";
    } else if (formData.justification.trim().length < 50) {
      newErrors.justification = "Justification must be at least 50 characters";
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
        opportunityId: opportunity.opportunityId,
        nomineeEmployeeId: parseInt(formData.employeeId),
        justification: formData.justification.trim(),
        nominationType: "Manager",
      };

      const response = await nominationService.managerNominate(payload);

      if (response.success) {
        toastr.success("Team member nominated successfully!");
        onNominationSubmitted();
        onHide();
      } else {
        toastr.error(response.message || "Failed to nominate team member");
      }
    } catch (error) {
      console.error("Error:", error);
      toastr.error(error.message || "Failed to nominate team member");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop-custom"></div>
      <div className="modal-wrapper-custom">
        <div className="modal-dialog-custom">
          <div className="modal-content-custom">
            <div className="modal-header-custom">
              <h5 className="modal-title-custom">
                <i className="bi bi-person-plus"></i>
                Nominate Team Member
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
                <div className="info-section">
                  <p>
                    <strong>Opportunity:</strong> {opportunity.opportunityName}
                  </p>
                  <p>
                    <strong>Department:</strong> {opportunity.departmentName}
                  </p>
                  <p>
                    <strong>Deadline:</strong>{" "}
                    {new Date(opportunity.deadline).toLocaleDateString()}
                  </p>
                </div>

                <div className="form-grid">
                  <div className="form-group-custom full-width">
                    <label className="form-label-custom">
                      Select Team Member{" "}
                      <span className="required-mark">*</span>
                    </label>
                    <select
                      name="employeeId"
                      className={`form-select-custom ${
                        errors.employeeId ? "is-invalid" : ""
                      }`}
                      value={formData.employeeId}
                      onChange={handleChange}
                      disabled={loadingEmployees}
                    >
                      <option value="">
                        {loadingEmployees
                          ? "Loading team members..."
                          : "-- Choose a team member --"}
                      </option>
                      {employees.map((emp) => (
                        <option key={emp.userId} value={emp.userId}>
                          {emp.firstName} {emp.lastName}
                        </option>
                      ))}
                    </select>
                    {errors.employeeId && (
                      <div className="error-message">{errors.employeeId}</div>
                    )}
                  </div>

                  <div className="form-group-custom full-width">
                    <label className="form-label-custom">
                      Why is this team member a good fit?{" "}
                      <span className="required-mark">*</span>
                    </label>
                    <textarea
                      name="justification"
                      className={`form-textarea-custom ${
                        errors.justification ? "is-invalid" : ""
                      }`}
                      placeholder="Explain why you believe this team member is perfect for this role..."
                      value={formData.justification}
                      onChange={handleChange}
                      rows={5}
                      maxLength={1000}
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
                      Nominating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle"></i>
                      Nominate
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

export default ManagerNominateModal;

