// import { useState } from "react";
// import nominationService from "../../../services/internal/nominationService";
// import toastr from "toastr";
// import "../../../styles/internal/NominationModal.css";

// const SelfNominateModal = ({ show, onHide, opportunities, onNominationSubmitted }) => {
//   const [formData, setFormData] = useState({
//     opportunityId: "",
//     justification: "",
//   });
//   const [loading, setLoading] = useState(false);
//   const [errors, setErrors] = useState({});

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//     if (errors[name]) {
//       setErrors((prev) => ({
//         ...prev,
//         [name]: "",
//       }));
//     }
//   };

//   const validateForm = () => {
//     const newErrors = {};

//     if (!formData.opportunityId) {
//       newErrors.opportunityId = "Please select an opportunity";
//     }

//     if (!formData.justification.trim()) {
//       newErrors.justification = "Justification is required";
//     } else if (formData.justification.trim().length < 50) {
//       newErrors.justification = "Justification must be at least 50 characters";
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!validateForm()) {
//       toastr.error("Please fix the errors");
//       return;
//     }

//     try {
//       setLoading(true);

//       const payload = {
//         opportunityId: parseInt(formData.opportunityId),
//         justification: formData.justification.trim(),
//       };

//       const response = await nominationService.selfNominate(payload);

//       if (response.success) {
//         toastr.success("Nomination submitted successfully!");
//         onNominationSubmitted();
//         onHide();
//       } else {
//         toastr.error(response.message || "Failed to submit nomination");
//       }
//     } catch (error) {
//       console.error("Error:", error);
//       toastr.error(error.message || "Failed to submit nomination");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!show) return null;

//   return (
//     <>
//       <div className="modal-backdrop-custom"></div>
//       <div className="modal-wrapper-custom">
//         <div className="modal-dialog-custom">
//           <div className="modal-content-custom">
//             <div className="modal-header-custom">
//               <h5 className="modal-title-custom">
//                 <i className="bi bi-hand-thumbs-up"></i>
//                 Self Nominate
//               </h5>
//               <button
//                 type="button"
//                 className="modal-close-btn"
//                 onClick={onHide}
//                 disabled={loading}
//               >
//                 <i className="bi bi-x-lg"></i>
//               </button>
//             </div>

//             <form onSubmit={handleSubmit}>
//               <div className="modal-body-custom">
//                 <div className="form-grid">
//                   <div className="form-group-custom full-width">
//                     <label className="form-label-custom">
//                       Select Opportunity <span className="required-mark">*</span>
//                     </label>
//                     <select
//                       name="opportunityId"
//                       className={`form-select-custom ${
//                         errors.opportunityId ? "is-invalid" : ""
//                       }`}
//                       value={formData.opportunityId}
//                       onChange={handleChange}
//                     >
//                       <option value="">-- Choose an Opportunity --</option>
//                       {opportunities.map((opp) => (
//                         <option key={opp.opportunityId} value={opp.opportunityId}>
//                           {opp.opportunityName} ({opp.departmentName})
//                         </option>
//                       ))}
//                     </select>
//                     {errors.opportunityId && (
//                       <div className="error-message">{errors.opportunityId}</div>
//                     )}
//                   </div>

//                   <div className="form-group-custom full-width">
//                     <label className="form-label-custom">
//                       Justification <span className="required-mark">*</span>
//                     </label>
//                     <textarea
//                       name="justification"
//                       className={`form-textarea-custom ${
//                         errors.justification ? "is-invalid" : ""
//                       }`}
//                       placeholder="Explain why you are a good fit for this role..."
//                       value={formData.justification}
//                       onChange={handleChange}
//                       rows={5}
//                       maxLength={1000}
//                     />
//                     {errors.justification && (
//                       <div className="error-message">{errors.justification}</div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               <div className="modal-footer-custom">
//                 <button
//                   type="button"
//                   className="btn-cancel"
//                   onClick={onHide}
//                   disabled={loading}
//                 >
//                   Cancel
//                 </button>
//                 <button type="submit" className="btn-submit" disabled={loading}>
//                   {loading ? "Submitting..." : "Submit Nomination"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default SelfNominateModal;

import { useState } from "react";
import nominationService from "../../../services/internal/nominationService";
import toastr from "toastr";
import "../../../styles/internal/NominationModal.css";

const SelfNominateModal = ({
  show,
  onHide,
  opportunity,
  onNominationSubmitted,
}) => {
  const [formData, setFormData] = useState({
    justification: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
        justification: formData.justification.trim(),
        nominationType: "Self",
      };

      const response = await nominationService.selfNominate(payload);

      if (response.success) {
        toastr.success("Self-nomination submitted successfully!");
        onNominationSubmitted();
        onHide();
      } else {
        toastr.error(response.message || "Failed to submit nomination");
      }
    } catch (error) {
      console.error("Error:", error);
      toastr.error(error.message || "Failed to submit nomination");
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
                <i className="bi bi-hand-thumbs-up"></i>
                Self Nominate for Opportunity
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
                      Why are you interested in this role?{" "}
                      <span className="required-mark">*</span>
                    </label>
                    <textarea
                      name="justification"
                      className={`form-textarea-custom ${
                        errors.justification ? "is-invalid" : ""
                      }`}
                      placeholder="Tell us why you're a great fit for this opportunity..."
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
                      Submitting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle"></i>
                      Submit Nomination
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

export default SelfNominateModal;
