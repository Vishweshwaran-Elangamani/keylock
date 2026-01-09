import React from "react";

function StepTwoCompetencies({
  model,
  busy,
  validationErrors,
  setValidationErrors,
  competencyRefs,
  competencySectionRef,
  addCompetency,
  updateComp,
  removeComp,
  moveCompUp,
  moveCompDown,
  isStep2Complete,
  goBackToStep1,
  onSubmit,
  isEditMode,
}) {
  return (
    <form onSubmit={onSubmit} className="pmhr-fc-form-container">
      <div className="pmhr-fc-form-content">
        <div className="pmhr-fc-section pmhr-fc-competencies-section">
          <div className="pmhr-fc-section-header">
            <div className="pmhr-fc-section-header-left">
              <i className="bi bi-list-check"></i>
              <h3 className="pmhr-fc-section-title">Competencies</h3>
              <span className="pmhr-fc-count-badge">
                {model.competencies.length} Competencies
              </span>
            </div>
            <button
              type="button"
              className="pmhr-fc-btn-add-comp"
              onClick={addCompetency}
              disabled={busy}
            >
              Add Competency
            </button>
          </div>
          <div className="pmhr-fc-section-body" ref={competencySectionRef}>
            {validationErrors.competencies && (
              <div className="pmhr-fc-alert-warning">
                <i className="bi bi-exclamation-triangle"></i>
                <span>At least one competency is required</span>
              </div>
            )}
            {model.competencies.map((comp, index) => (
              <div
                key={index}
                className="pmhr-fc-comp-card"
                ref={(el) => (competencyRefs.current[index] = el)}
              >
                <div className="pmhr-fc-comp-header">
                  <div className="pmhr-fc-comp-left">
                    <span className="pmhr-fc-comp-number">
                      {comp.displayOrder}
                    </span>
                    <span className="pmhr-fc-comp-label">
                      {comp.name || "Untitled Competency"}
                    </span>
                  </div>
                  <div className="pmhr-fc-comp-actions">
                    <button
                      type="button"
                      className="pmhr-fc-btn-icon pmhr-fc-btn-up"
                      onClick={() => moveCompUp(index)}
                      disabled={index === 0 || busy}
                      title="Move Up"
                    >
                      <i className="bi bi-arrow-up"></i>
                    </button>
                    <button
                      type="button"
                      className="pmhr-fc-btn-icon pmhr-fc-btn-down"
                      onClick={() => moveCompDown(index)}
                      disabled={
                        index === model.competencies.length - 1 || busy
                      }
                      title="Move Down"
                    >
                      <i className="bi bi-arrow-down"></i>
                    </button>
                    <button
                      type="button"
                      className="pmhr-fc-btn-icon pmhr-fc-btn-delete"
                      onClick={() => removeComp(index)}
                      disabled={busy}
                      title="Delete"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
                <div className="pmhr-fc-comp-body">
                  <div className="pmhr-fc-form-group pmhr-fc-full-width">
                    <label className="pmhr-fc-label">
                      Competency Name{" "}
                      <span className="pmhr-fc-required">*</span>
                    </label>
                    <div className="pmhr-fc-error-wrapper">
                      <input
                        type="text"
                        className={`pmhr-fc-input ${
                          validationErrors[`comp_${index}_name`]
                            ? "pmhr-fc-input-error"
                            : ""
                        }`}
                        placeholder="e.g., Communication Skills, Technical Expertise"
                        value={comp.name}
                        onChange={(e) => {
                          updateComp(index, "name", e.target.value);
                          setValidationErrors({
                            ...validationErrors,
                            [`comp_${index}_name`]: null,
                          });
                        }}
                        disabled={busy}
                      />
                      {validationErrors[`comp_${index}_name`] && (
                        <span className="pmhr-fc-error-text">
                          <i className="bi bi-exclamation-circle"></i>
                          {validationErrors[`comp_${index}_name`]}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="pmhr-fc-form-group pmhr-fc-full-width">
                    <label className="pmhr-fc-label">
                      Description <span className="pmhr-fc-required">*</span>
                    </label>
                    <div className="pmhr-fc-error-wrapper">
                      <textarea
                        className={`pmhr-fc-textarea ${
                          validationErrors[`comp_${index}_description`]
                            ? "pmhr-fc-input-error"
                            : ""
                        }`}
                        placeholder="Enter competency description..."
                        rows="2"
                        value={comp.description || ""}
                        onChange={(e) => {
                          updateComp(index, "description", e.target.value);
                          setValidationErrors({
                            ...validationErrors,
                            [`comp_${index}_description`]: null,
                          });
                        }}
                        disabled={busy}
                      ></textarea>
                      {validationErrors[`comp_${index}_description`] && (
                        <span className="pmhr-fc-error-text">
                          <i className="bi bi-exclamation-circle"></i>
                          {validationErrors[`comp_${index}_description`]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pmhr-fc-form-actions pmhr-fc-form-actions-inline">
          <button
            type="button"
            className="pmhr-fc-btn-cancel"
            onClick={goBackToStep1}
            disabled={busy}
          >
            Back
          </button>
          <button
            type="submit"
            className="pmhr-fc-btn-submit"
            disabled={busy || !isStep2Complete()}
          >
            {busy ? (
              <>
                <span className="pmhr-fc-spinner"></span>
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{isEditMode ? "Update Form" : "Create Form"}</>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

export default StepTwoCompetencies;