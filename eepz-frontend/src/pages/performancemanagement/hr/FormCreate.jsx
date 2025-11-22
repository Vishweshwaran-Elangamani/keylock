import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/performancemanagement/hr/api";
import { toast } from "sonner";
import { useAuth } from "../../../contexts/auth/AuthContext";
import "../../../styles/performancemanagement/hr/FormCreate.css";

function FormCreate() {
  // ========================
  // HOOKS & CONTEXT
  // ========================
  const { user, loading } = useAuth();
  const { formId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!formId;

  // ========================
  // STATE MANAGEMENT
  // ========================

  const [model, setModel] = useState({
    name: "",
    type: "",
    createdBy: null,
    deliveryEnablement: "",
    competencies: [],
  });

  const [busy, setBusy] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // ========================
  // EFFECTS
  // ========================

  useEffect(() => {
    if (user?.userId) {
      setModel((m) => ({ ...m, createdBy: user.userId }));
    }
  }, [user]);

  useEffect(() => {
    if (!isEditMode) return;

    const loadFormData = async () => {
      try {
        setBusy(true);
        toast.loading("Loading form data...");
        const { data } = await api.get(`/FormManagement/${formId}`);
        const payload = data?.data ?? {};
        setModel({
          ...payload,
          competencies: payload.competencies ?? [],
        });
        toast.dismiss();
        toast.success("Form data loaded successfully");
      } catch (error) {
        toast.dismiss();
        toast.error("Failed to load form for editing.");
        console.error(error);
      } finally {
        setBusy(false);
      }
    };

    loadFormData();
  }, [formId, isEditMode]);

  // ========================
  // COMPETENCY HANDLERS
  // ========================

  const addCompetency = () => {
    setModel((m) => ({
      ...m,
      competencies: [
        ...m.competencies,
        {
          name: "",
          description: "",
          displayOrder: m.competencies.length + 1,
        },
      ],
    }));
    toast.success("Competency added");
  };

  const updateComp = (index, key, value) => {
    setModel((m) => {
      const next = structuredClone(m);
      next.competencies[index][key] = key === "displayOrder" ? Number(value) : value;
      return next;
    });
  };

  const removeComp = (index) => {
    setModel((m) => {
      const next = structuredClone(m);
      next.competencies.splice(index, 1);
      next.competencies.forEach((c, idx) => (c.displayOrder = idx + 1));
      return next;
    });
    toast.info("Competency removed");
  };

  const moveCompUp = (index) => {
    if (index === 0) return;
    setModel((m) => {
      const next = structuredClone(m);
      [next.competencies[index - 1], next.competencies[index]] = [
        next.competencies[index],
        next.competencies[index - 1],
      ];
      next.competencies.forEach((c, idx) => (c.displayOrder = idx + 1));
      return next;
    });
  };

  const moveCompDown = (index) => {
    if (index === model.competencies.length - 1) return;
    setModel((m) => {
      const next = structuredClone(m);
      [next.competencies[index], next.competencies[index + 1]] = [
        next.competencies[index + 1],
        next.competencies[index],
      ];
      next.competencies.forEach((c, idx) => (c.displayOrder = idx + 1));
      return next;
    });
  };

  // ========================
  // VALIDATION
  // ========================

  const validateForm = () => {
    const errors = {};

    if (!model.name?.trim()) {
      errors.name = "Form name is required";
    }
    if (!model.type) {
      errors.type = "Form type is required";
    }
    if (!model.deliveryEnablement) {
      errors.deliveryEnablement = "Delivery/Enablement selection is required";
    }
    if (model.competencies.length === 0) {
      errors.competencies = "At least one competency is required";
    }
    model.competencies.forEach((comp, idx) => {
      if (!comp.name?.trim()) {
        errors[`comp_${idx}_name`] = `Competency name is required`;
      }
    });

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Please fix validation errors");
      return false;
    }
    return true;
  };

  // ========================
  // SUBMIT HANDLER
  // ========================

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) {
      toast.error("Authentication loading. Please wait.");
      return;
    }
    if (!user || !user.userId || !model.createdBy) {
      toast.error("User not loaded. Please login again.");
      return;
    }
    if (!validateForm()) {
      return;
    }
    setBusy(true);

    const toPascalCase = (obj) => ({
      Name: obj.name,
      Type: obj.type,
      DeliveryEnablement: obj.deliveryEnablement,
      CreatedBy: obj.createdBy,
      Competencies: obj.competencies.map((c) => ({
        Name: c.name,
        Description: c.description,
        DisplayOrder: c.displayOrder,
      })),
    });

    const payload = toPascalCase(model);

    try {
      toast.loading(isEditMode ? "Updating form..." : "Creating form...");
      const endpoint = isEditMode
        ? `/FormManagement/${formId}`
        : "/FormManagement/create";
      const method = isEditMode ? api.put : api.post;
      const { data } = await method(endpoint, payload);

      toast.dismiss();
      toast.success(
        data.message || (isEditMode ? "Form updated successfully!" : "Form created successfully!")
      );
      setTimeout(() => {
        navigate("/hr/dashboard/performance/formslist");
      }, 500);

    } catch (error) {
      toast.dismiss();
      toast.error(
        error.response?.data?.message ||
          (isEditMode ? "Failed to update form." : "Failed to create form.")
      );
      console.error(error);
    } finally {
      setBusy(false);
    }
  };

  // ========================
  // RENDER - LOADING STATE
  // ========================

  if (loading) {
    return (
      <div className="hrfcper-loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user || !user.userId) {
    return (
      <div className="hrfcper-error-container">
        <div className="hrfcper-error-icon">
          <i className="bi bi-exclamation-triangle"></i>
        </div>
        <h4>Authentication Required</h4>
        <p>User not loaded. Please login again.</p>
      </div>
    );
  }

  // ========================
  // MAIN RENDER
  // ========================

  return (
    <div className="hrfcper-page">
      {/* Top Bar */}
      <div className="hrfcper-top-bar">
       <ol className="hrfcper-breadcrumb">
  <li className="hrfcper-breadcrumb-item" onClick={() => navigate("/dashboard")}>
    <i className="bi bi-house-door"></i>
  </li>
  <li className="hrfcper-breadcrumb-item" onClick={() => navigate("/hr/dashboard/performance")}>
    <span>Performance</span>
  </li>
  <li className="hrfcper-breadcrumb-item active" aria-current="page">
    {isEditMode ? "Edit Form" : "Create Form"}
  </li>
</ol>

        <button
  type="button"
  className="hrfcper-btn-back"
  onClick={() => navigate("/hr/dashboard/performance/formslist")}
  disabled={busy}
>
  <i className="bi bi-arrow-left"></i>
  Back to Forms
</button>

      </div>

    

      {/* FORM CONTAINER */}
      <form onSubmit={onSubmit} className="hrfcper-form-container">
        {/* LEFT COLUMN - details and actions */}
        <div className="hrfcper-left-column">
          {/* General Details */}
          <div className="hrfcper-section hrfcper-general-details">
            <div className="hrfcper-section-header">
              <i className="bi bi-info-circle"></i>
              <h3 className="hrfcper-section-title">General Details</h3>
            </div>
            <div className="hrfcper-section-body">
              {/* Form Name */}
              <div className="hrfcper-form-group hrfcper-full-width">
                <label className="hrfcper-label">
                  Form Name <span className="hrfcper-required">*</span>
                </label>
                <div className="hrfcper-error-wrapper">
                  <input
                    type="text"
                    className={`hrfcper-input ${validationErrors.name ? "hrfcper-input-error" : ""}`}
                    placeholder="Enter form name (e.g., Annual Performance Review 2024)"
                    value={model.name}
                    onChange={(e) => {
                      setModel({ ...model, name: e.target.value });
                      setValidationErrors({ ...validationErrors, name: null });
                    }}
                    disabled={busy}
                  />
                  {validationErrors.name && (
                    <span className="hrfcper-error-text">
                      <i className="bi bi-exclamation-circle"></i>
                      {validationErrors.name}
                    </span>
                  )}
                </div>
              </div>
              {/* Form Type & Category */}
              <div className="hrfcper-form-row-two">
                <div className="hrfcper-form-group">
                  <label className="hrfcper-label">
                    Form Type <span className="hrfcper-required">*</span>
                  </label>
                  <div className="hrfcper-error-wrapper">
                    <select
                      className={`hrfcper-select ${validationErrors.type ? "hrfcper-input-error" : ""}`}
                      value={model.type}
                      onChange={(e) => {
                        setModel({ ...model, type: e.target.value });
                        setValidationErrors({ ...validationErrors, type: null });
                      }}
                      disabled={busy}
                    >
                      <option value="">Select form type</option>
                      <option value="Self">Self</option>
                      <option value="Manager">Manager</option>
                      <option value="HR Summary">HR Summary</option>
                    </select>
                    {validationErrors.type && (
                      <span className="hrfcper-error-text">
                        <i className="bi bi-exclamation-circle"></i>
                        {validationErrors.type}
                      </span>
                    )}
                  </div>
                </div>
                <div className="hrfcper-form-group">
                  <label className="hrfcper-label">
                    Category <span className="hrfcper-required">*</span>
                  </label>
                  <div className="hrfcper-error-wrapper">
                    <select
                      className={`hrfcper-select ${
                        validationErrors.deliveryEnablement ? "hrfcper-input-error" : ""
                      }`}
                      value={model.deliveryEnablement}
                      onChange={(e) => {
                        setModel({ ...model, deliveryEnablement: e.target.value });
                        setValidationErrors({ ...validationErrors, deliveryEnablement: null });
                      }}
                      disabled={busy}
                    >
                      <option value="">Select category</option>
                      <option value="Delivery">Delivery</option>
                      <option value="Enablement">Enablement</option>
                    </select>
                    {validationErrors.deliveryEnablement && (
                      <span className="hrfcper-error-text">
                        <i className="bi bi-exclamation-circle"></i>
                        {validationErrors.deliveryEnablement}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="hrfcper-form-actions">
            <button
              type="button"
              className="hrfcper-btn-cancel"
              onClick={() => navigate("/hr/dashboard/performance/formslist")}
              disabled={busy}
            >
              Cancel
            </button>
            <button type="submit" className="hrfcper-btn-submit" disabled={busy}>
              {busy ? (
                <>
                  <span className="hrfcper-spinner"></span>
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  {isEditMode ? "Update Form" : "Create Form"}
                </>
              )}
            </button>
          </div>
        </div>
        {/* RIGHT COLUMN - Competencies with fixed header and scrollable cards */}
        <div className="hrfcper-section hrfcper-competencies-section">
          <div className="hrfcper-section-header">
            <div className="hrfcper-section-header-left">
              <i className="bi bi-list-check"></i>
              <h3 className="hrfcper-section-title">Competencies</h3>
              <span className="hrfcper-count-badge">{model.competencies.length} Competencies</span>
            </div>
            <button
              type="button"
              className="hrfcper-btn-add-comp"
              onClick={addCompetency}
              disabled={busy}
            >
             
              Add Competency
            </button>
          </div>
          <div className="hrfcper-section-body">
            {validationErrors.competencies && (
              <div className="hrfcper-alert-warning">
                <i className="bi bi-exclamation-triangle"></i>
                <span>At least one competency is required</span>
              </div>
            )}
            {model.competencies.map((comp, index) => (
              <div key={index} className="hrfcper-comp-card">
                <div className="hrfcper-comp-header">
                  <div className="hrfcper-comp-left">
                    <span className="hrfcper-comp-number">{comp.displayOrder}</span>
                    <span className="hrfcper-comp-label">{comp.name || "Untitled Competency"}</span>
                  </div>
                  <div className="hrfcper-comp-actions">
                    <button
                      type="button"
                      className="hrfcper-btn-icon hrfcper-btn-up"
                      onClick={() => moveCompUp(index)}
                      disabled={index === 0 || busy}
                      title="Move Up"
                    >
                      <i className="bi bi-arrow-up"></i>
                    </button>
                    <button
                      type="button"
                      className="hrfcper-btn-icon hrfcper-btn-down"
                      onClick={() => moveCompDown(index)}
                      disabled={index === model.competencies.length - 1 || busy}
                      title="Move Down"
                    >
                      <i className="bi bi-arrow-down"></i>
                    </button>
                    <button
                      type="button"
                      className="hrfcper-btn-icon hrfcper-btn-delete"
                      onClick={() => removeComp(index)}
                      disabled={busy}
                      title="Delete"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
                <div className="hrfcper-comp-body">
                  <div className="hrfcper-form-group hrfcper-full-width">
                    <label className="hrfcper-label">
                      Competency Name <span className="hrfcper-required">*</span>
                    </label>
                    <div className="hrfcper-error-wrapper">
                      <input
                        type="text"
                        className={`hrfcper-input ${
                          validationErrors[`comp_${index}_name`] ? "hrfcper-input-error" : ""
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
                        <span className="hrfcper-error-text">
                          <i className="bi bi-exclamation-circle"></i>
                          {validationErrors[`comp_${index}_name`]}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="hrfcper-form-group hrfcper-full-width">
                    <label className="hrfcper-label">Description (Optional)</label>
                    <textarea
                      className="hrfcper-textarea"
                      placeholder="Enter competency description..."
                      rows="2"
                      value={comp.description || ""}
                      onChange={(e) => updateComp(index, "description", e.target.value)}
                      disabled={busy}
                    ></textarea>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}

export default FormCreate;
