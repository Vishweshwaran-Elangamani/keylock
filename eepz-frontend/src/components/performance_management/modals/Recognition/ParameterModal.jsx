import React from "react";
import "../../../../styles/performancemanagement/components/ParameterModal.module.css";

const ParameterModal = ({
  show, onClose, parameterForm, setParameterForm, onSubmit
}) => {
  if (!show) return null;

  return (
    <div className="parameter-modal-overlay" onClick={onClose}>
      <div className="parameter-modal" onClick={e => e.stopPropagation()}>
        <div className="parameter-modal-header">
          <span className="parameter-modal-header-title">Add Parameter</span>
          <button 
            type="button" 
            className="parameter-modal-close-btn" 
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="parameter-modal-body">
          <form onSubmit={onSubmit} autoComplete="off">
            <label className="parameter-modal-label">
              Parameter Name <span className="parameter-modal-required">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Goal Achievement Rating"
              value={parameterForm.parameterName}
              onChange={e =>
                setParameterForm({ ...parameterForm, parameterName: e.target.value })
              }
              required
              className="parameter-modal-input"
            />

            <label className="parameter-modal-label">
              Type <span className="parameter-modal-required">*</span>
            </label>
            <select
              value={parameterForm.parameterType}
              onChange={e =>
                setParameterForm({ ...parameterForm, parameterType: e.target.value })
              }
              required
              className="parameter-modal-select"
            >
              <option value="Text">Text</option>
              <option value="TextArea">Text Area</option>
              <option value="Number">Number</option>
              <option value="Rating">Rating</option>
              <option value="Date">Date</option>
            </select>

            <label className="parameter-modal-checkbox-label">
              <input
                type="checkbox"
                checked={parameterForm.isRequired}
                onChange={e =>
                  setParameterForm({ ...parameterForm, isRequired: e.target.checked })
                }
                className="parameter-modal-checkbox"
              /> Required Field
            </label>

            <label className="parameter-modal-label">Placeholder Text</label>
            <input
              type="text"
              placeholder="Hint text for the field..."
              value={parameterForm.placeholderText}
              onChange={e =>
                setParameterForm({ ...parameterForm, placeholderText: e.target.value })
              }
              className="parameter-modal-input"
            />

            {(parameterForm.parameterType === "Number" || parameterForm.parameterType === "Rating") && (
              <>
                <label className="parameter-modal-label">Min Value</label>
                <input
                  type="number"
                  value={parameterForm.minimumValue}
                  onChange={e =>
                    setParameterForm({ ...parameterForm, minimumValue: e.target.value })
                  }
                  className="parameter-modal-input"
                />
                <label className="parameter-modal-label">Max Value</label>
                <input
                  type="number"
                  value={parameterForm.maximumValue}
                  onChange={e =>
                    setParameterForm({ ...parameterForm, maximumValue: e.target.value })
                  }
                  className="parameter-modal-input"
                />
              </>
            )}

            <label className="parameter-modal-label">Sort Order <span className="parameter-modal-required">*</span></label>
            <input
              type="number"
              min="1"
              value={parameterForm.sortOrder}
              onChange={e =>
                setParameterForm({ ...parameterForm, sortOrder: parseInt(e.target.value) })
              }
              required
              className="parameter-modal-input"
            />

            <div className="parameter-modal-action-row">
              <button
                type="button"
                onClick={onClose}
                className="parameter-modal-cancel-btn"
              >Cancel</button>
              <button
                type="submit"
                className="parameter-modal-submit-btn"
              >Add Parameter</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ParameterModal;
