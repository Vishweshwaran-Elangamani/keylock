import React, { useState } from "react";
import "../../../../styles/performancemanagement/components/ParameterModall.css";

const ParameterModal = ({
  show,
  onClose,
  parameterForm,
  setParameterForm,
  onSubmit,
}) => {
  const [errors, setErrors] = useState({});

  if (!show) return null;

  const validateForm = () => {
    const newErrors = {};
    if (!parameterForm.parameterName?.trim()) {
      newErrors.parameterName = "Parameter name is required.";
    }
    if (!parameterForm.parameterType?.trim()) {
      newErrors.parameterType = "Parameter type is required.";
    }
    if (!parameterForm.sortOrder || parameterForm.sortOrder < 1) {
      newErrors.sortOrder = "Sort order must be at least 1.";
    }
    if (
      (parameterForm.parameterType === "Number" ||
        parameterForm.parameterType === "Rating") &&
      (parameterForm.minimumValue === "" || parameterForm.maximumValue === "")
    ) {
      newErrors.range = "Min and Max values are required for Number/Rating.";
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    onSubmit(e);
  };

  return (
    <div className="parameter-modal-overlay" onClick={onClose}>
      <div className="parameter-modal" onClick={(e) => e.stopPropagation()}>
        <div className="parameter-modal-header">
          <span className="parameter-modal-header-title">Add Parameter</span>
        </div>
        <div className="parameter-modal-body">
          <form onSubmit={handleSubmit} autoComplete="off">

            <label className="parameter-modal-label">
              Parameter Name <span className="parameter-modal-required">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Goal Achievement Rating"
              value={parameterForm.parameterName}
              onChange={(e) =>
                setParameterForm({
                  ...parameterForm,
                  parameterName: e.target.value,
                })
              }
              className="parameter-modal-input"
            />
            {errors.parameterName && (
              <div className="parameter-modal-error">{errors.parameterName}</div>
            )}

            <label className="parameter-modal-label">
              Type <span className="parameter-modal-required">*</span>
            </label>
            <select
              value={parameterForm.parameterType}
              onChange={(e) =>
                setParameterForm({
                  ...parameterForm,
                  parameterType: e.target.value,
                })
              }
              className="parameter-modal-select"
            >
              <option value="">Select type</option>
              <option value="Text">Text</option>
              <option value="TextArea">Text Area</option>
              <option value="Number">Number</option>
              <option value="Rating">Rating</option>
              <option value="Date">Date</option>
            </select>
            {errors.parameterType && (
              <div className="parameter-modal-error">{errors.parameterType}</div>
            )}

            <label className="parameter-modal-checkbox-label">
              <input
                type="checkbox"
                checked={parameterForm.isRequired}
                onChange={(e) =>
                  setParameterForm({
                    ...parameterForm,
                    isRequired: e.target.checked,
                  })
                }
                className="parameter-modal-checkbox"
              />{" "}
              Required Field
            </label>

            <label className="parameter-modal-label">Placeholder Text</label>
            <input
              type="text"
              placeholder="Hint text for the field..."
              value={parameterForm.placeholderText}
              onChange={(e) =>
                setParameterForm({
                  ...parameterForm,
                  placeholderText: e.target.value,
                })
              }
              className="parameter-modal-input"
            />

            {(parameterForm.parameterType === "Number" ||
              parameterForm.parameterType === "Rating") && (
              <>
                <label className="parameter-modal-label">Min Value</label>
                <input
                  type="number"
                  value={parameterForm.minimumValue}
                  onChange={(e) =>
                    setParameterForm({
                      ...parameterForm,
                      minimumValue: e.target.value,
                    })
                  }
                  className="parameter-modal-input"
                />
                <label className="parameter-modal-label">Max Value</label>
                <input
                  type="number"
                  value={parameterForm.maximumValue}
                  onChange={(e) =>
                    setParameterForm({
                      ...parameterForm,
                      maximumValue: e.target.value,
                    })
                  }
                  className="parameter-modal-input"
                />
                {errors.range && (
                  <div className="parameter-modal-error">{errors.range}</div>
                )}
              </>
            )}

            <label className="parameter-modal-label">
              Sort Order <span className="parameter-modal-required">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={parameterForm.sortOrder}
              onChange={(e) =>
                setParameterForm({
                  ...parameterForm,
                  sortOrder: parseInt(e.target.value),
                })
              }
              className="parameter-modal-input"
            />
            {errors.sortOrder && (
              <div className="parameter-modal-error">{errors.sortOrder}</div>
            )}

            <div className="parameter-modal-action-row">
              <button
                type="button"
                onClick={onClose}
                className="parameter-modal-cancel-btn"
              >
                Cancel
              </button>
              <button type="submit" className="parameter-modal-submit-btn">
                Add Parameter
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ParameterModal;
