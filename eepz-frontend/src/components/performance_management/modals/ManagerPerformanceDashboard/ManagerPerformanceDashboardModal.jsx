import React, { useState } from "react";
import logoImage from "../../../../assets/logodark.png";
import "../../../../styles/performancemanagement/components/ManagerPerformanceDashboard.css";

const RatingDropdown = ({ value, onChange, disabled }) => {
  const [open, setOpen] = useState(false);

  const options = [
    { value: "", label: "-" },
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5" },
  ];

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || "-";

  if (disabled) {
    return (
      <div className="manevap-modal-cell-view">
        {value ? `${value} / 5` : "-"}
      </div>
    );
  }

  return (
    <div
      className="custom-modal-rating-dropdown"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
    >
      <div
        className="custom-modal-rating-selected"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selectedLabel}
        <span className="custom-modal-rating-arrow" />
      </div>

      {open && (
        <div className="custom-modal-rating-menu">
          {options.map((opt) => (
            <div
              key={opt.value}
              className={
                "custom-modal-rating-option" +
                (opt.value === value
                  ? " custom-modal-rating-option-active"
                  : "")
              }
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ManagerPerformanceDashboardModal = ({
  showModal,
  setShowModal,
  currentAssignment,
  assessmentData,
  modalMode,
  submitting,
  handleSubmitAssessment,
  updateAssessmentData,
}) => {
  if (!showModal || !currentAssignment) return null;

  return (
    <div className="manevap-modal-overlay" onClick={() => setShowModal(false)}>
      <div
        className="manevap-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="manevap-form-header-strict">
          <div className="manevap-form-header-inner">
            <div className="manevap-form-logo-wrap">
              <img
                src={logoImage}
                alt="EEPZ Logo"
                className="manevap-modal-logo"
              />
              <div className="manevap-form-logo-label">APPRAISAL FORM</div>
            </div>
            <div className="manevap-form-title-wrap">
              <div className="manevap-form-title-main">Appraisal Form</div>
              <div className="manevap-form-title-small">
                {currentAssignment?.formName || ""}
              </div>
            </div>
          </div>
        </div>

        {submitting && modalMode === "view" ? (
          <div className="manevap-modal-loading">
            <div className="spinner-border"></div>
            <p>Loading assessment...</p>
          </div>
        ) : (
          <>
            <div className="manevap-strict-form-body">
              <table className="manevap-strict-table">
                <thead>
                  <tr>
                    <th>COMPETENCY NAME</th>
                    <th>DESCRIPTION</th>
                    <th>RATING</th>
                    <th>COMMENTS</th>
                  </tr>
                </thead>
                <tbody>
                  {assessmentData.map((item, idx) => (
                    <tr key={item.competencyId || idx}>
                      <td className="manevap-cell-bold">
                        {item.competencyName}
                      </td>
                      <td>{item.competencyDescription || ""}</td>
                      <td>
                        <RatingDropdown
                          value={item.rating || ""}
                          onChange={(val) =>
                            updateAssessmentData(
                              item.competencyId,
                              "rating",
                              val
                            )
                          }
                          disabled={modalMode === "view"}
                        />
                      </td>
                      <td>
                        {modalMode === "view" ? (
                          <div className="manevap-modal-cell-view">
                            {item.comments || "-"}
                          </div>
                        ) : (
                          <input
                            className="manevap-modal-cell-input"
                            type="text"
                            value={item.comments}
                            onChange={(e) =>
                              updateAssessmentData(
                                item.competencyId,
                                "comments",
                                e.target.value
                              )
                            }
                            placeholder="-"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="manevap-modal-actions">
              <button
                onClick={() => setShowModal(false)}
                className="manevap-btn-close"
              >
                Cancel
              </button>
              {modalMode === "submit" && (
                <button
                  onClick={handleSubmitAssessment}
                  disabled={submitting}
                  className="manevap-btn-submit-form"
                >
                  {submitting ? "Submitting..." : "Submit Assessment"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ManagerPerformanceDashboardModal;
