import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/performancemanagement/hr/api";
import { toast } from "sonner";
import { useAuth } from "../../../contexts/auth/AuthContext";
import "../../../styles/performancemanagement/hr/FormCreate.css";

function FormCreate() {
  const { user, loading } = useAuth();
  const { formId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!formId;

  const [currentStep, setCurrentStep] = useState(1); 

  const [model, setModel] = useState({
    name: "",
    type: "",
    createdBy: null,
    deliveryEnablement: "",
    competencies: [],
  });

  const [busy, setBusy] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

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

  
  const isStep1Complete = () => {
    return model.name?.trim() && model.type && model.deliveryEnablement;
  };

  const isStep2Complete = () => {
    if (model.competencies.length === 0) return false;
    return model.competencies.every(
      (comp) => comp.name?.trim() && comp.description?.trim()
    );
  };

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
      next.competencies[index][key] =
        key === "displayOrder" ? Number(value) : value;
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

 
  const validateStep1 = () => {
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

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Please fill all required fields");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const errors = {};

    if (model.competencies.length === 0) {
      errors.competencies = "At least one competency is required";
    }

    model.competencies.forEach((comp, idx) => {
      if (!comp.name?.trim()) {
        errors[`comp_${idx}_name`] = `Competency name is required`;
      }
      if (!comp.description?.trim()) {
        errors[`comp_${idx}_description`] = "Description is required";
      }
    });

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Please fix validation errors");
      return false;
    }
    return true;
  };

  const proceedToStep2 = (e) => {
    e.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
      setValidationErrors({});
    }
  };

  const goBackToStep1 = () => {
    setCurrentStep(1);
    setValidationErrors({});
  };

  const navigateToStep = (step) => {
    if (step === 1) {
      goBackToStep1();
    } else if (step === 2 && isStep1Complete()) {
      setCurrentStep(2);
      setValidationErrors({});
    }
  };

  const validateForm = () => {
    return validateStep1() && validateStep2();
  };

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
        data.message ||
          (isEditMode ? "Form updated successfully!" : "Form created successfully!")
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

  if (loading) {
    return (
      <div className="pmhr-fc-loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user || !user.userId) {
    return (
      <div className="pmhr-fc-error-container">
        <div className="pmhr-fc-error-icon">
          <i className="bi bi-exclamation-triangle"></i>
        </div>
        <h4>Authentication Required</h4>
        <p>User not loaded. Please login again.</p>
      </div>
    );
  }

  return (
    <div className="pmhr-fc-page">
      <div className="pmhr-fc-top-bar">
        <ol className="pmhr-fc-breadcrumb">
          <li
            className="pmhr-fc-breadcrumb-item"
            onClick={() => navigate("/dashboard")}
          >
            <i className="bi bi-house-door"></i>
          </li>
          <span className="pmhr-fc-breadcrumb-separator">/</span>
          <li
            className="pmhr-fc-breadcrumb-item"
            onClick={() => navigate("/hr/dashboard/performance")}
          >
            Performance
          </li>
          <span className="pmhr-fc-breadcrumb-separator">/</span>
          <li className="pmhr-fc-breadcrumb-item pmhr-fc-breadcrumb-active">
            {isEditMode ? "Edit Form" : "Create Form"}
          </li>
        </ol>
      </div>

      <div className="pmhr-fc-step-indicator-wrapper">
        <div className="pmhr-fc-step-indicator">
          <div className="pmhr-fc-step-item">
            <button
              type="button"
              className={`pmhr-fc-step-number ${
                currentStep === 1 ? "pmhr-fc-step-active" : ""
              } ${isStep1Complete() ? "pmhr-fc-step-complete" : ""}`}
              onClick={() => navigateToStep(1)}
              disabled={currentStep === 1}
              title="Form Details"
            >
              {isStep1Complete() && currentStep !== 1 ? (
                <i className="bi bi-check-lg"></i>
              ) : (
                <span>1</span>
              )}
            </button>
            <div className="pmhr-fc-step-label">
              <p className="pmhr-fc-step-title">Form Details</p>
              <p className="pmhr-fc-step-desc">Basic information</p>
            </div>
          </div>

          <div
            className={`pmhr-fc-step-line ${
              isStep1Complete() ? "pmhr-fc-step-line-complete" : ""
            }`}
          ></div>

          <div className="pmhr-fc-step-item">
            <button
              type="button"
              className={`pmhr-fc-step-number ${
                currentStep === 2 ? "pmhr-fc-step-active" : ""
              } ${isStep2Complete() ? "pmhr-fc-step-complete" : ""} ${
                !isStep1Complete() ? "pmhr-fc-step-disabled" : ""
              }`}
              onClick={() => navigateToStep(2)}
              disabled={!isStep1Complete() || currentStep === 2}
              title={
                isStep1Complete()
                  ? "Add Competencies"
                  : "Complete Step 1 first"
              }
            >
              {isStep2Complete() ? (
                <i className="bi bi-check-lg"></i>
              ) : (
                <span>2</span>
              )}
            </button>
            <div className="pmhr-fc-step-label">
              <p className="pmhr-fc-step-title">Add Competencies</p>
              <p className="pmhr-fc-step-desc">Skills & abilities</p>
            </div>
          </div>
        </div>
      </div>

      <div className="pmhr-fc-form-wrapper">
        <form
          onSubmit={currentStep === 2 ? onSubmit : proceedToStep2}
          className="pmhr-fc-form-container"
        >
        
          {currentStep === 1 && (
            <div className="pmhr-fc-form-content">
              <div className="pmhr-fc-section pmhr-fc-general-details">
                <div className="pmhr-fc-section-header">
                    <div className="pmhr-fc-section-header-left">

                  <i className="bi bi-info-circle"></i>
                  <h3 className="pmhr-fc-section-title">General Details</h3>
                </div>
                </div>
                <div className="pmhr-fc-section-body">
                  <div className="pmhr-fc-form-group pmhr-fc-full-width">
                    <label className="pmhr-fc-label">
                      Form Name <span className="pmhr-fc-required">*</span>
                    </label>
                    <div className="pmhr-fc-error-wrapper">
                      <input
                        type="text"
                        className={`pmhr-fc-input ${
                          validationErrors.name ? "pmhr-fc-input-error" : ""
                        }`}
                        placeholder="Enter form name (e.g., Annual Performance Review 2024)"
                        value={model.name}
                        onChange={(e) => {
                          setModel({ ...model, name: e.target.value });
                          setValidationErrors({
                            ...validationErrors,
                            name: null,
                          });
                        }}
                        disabled={busy}
                      />
                      {validationErrors.name && (
                        <span className="pmhr-fc-error-text">
                          <i className="bi bi-exclamation-circle"></i>
                          {validationErrors.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="pmhr-fc-form-row-two">
                    <div className="pmhr-fc-form-group">
                      <label className="pmhr-fc-label">
                        Form Type <span className="pmhr-fc-required">*</span>
                      </label>
                      <div className="pmhr-fc-error-wrapper">
                        <select
                          className={`pmhr-fc-select ${
                            validationErrors.type ? "pmhr-fc-input-error" : ""
                          }`}
                          value={model.type}
                          onChange={(e) => {
                            setModel({ ...model, type: e.target.value });
                            setValidationErrors({
                              ...validationErrors,
                              type: null,
                            });
                          }}
                          disabled={busy}
                        >
                          <option value="">Select form type</option>
                          <option value="Self">Self</option>
                          <option value="Manager">Manager</option>
                        </select>
                        {validationErrors.type && (
                          <span className="pmhr-fc-error-text">
                            <i className="bi bi-exclamation-circle"></i>
                            {validationErrors.type}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="pmhr-fc-form-group">
                      <label className="pmhr-fc-label">
                        Category <span className="pmhr-fc-required">*</span>
                      </label>
                      <div className="pmhr-fc-error-wrapper">
                        <select
                          className={`pmhr-fc-select ${
                            validationErrors.deliveryEnablement
                              ? "pmhr-fc-input-error"
                              : ""
                          }`}
                          value={model.deliveryEnablement}
                          onChange={(e) => {
                            setModel({
                              ...model,
                              deliveryEnablement: e.target.value,
                            });
                            setValidationErrors({
                              ...validationErrors,
                              deliveryEnablement: null,
                            });
                          }}
                          disabled={busy}
                        >
                          <option value="">Select category</option>
                          <option value="Delivery">Delivery</option>
                          <option value="Enablement">Enablement</option>
                        </select>
                        {validationErrors.deliveryEnablement && (
                          <span className="pmhr-fc-error-text">
                            <i className="bi bi-exclamation-circle"></i>
                            {validationErrors.deliveryEnablement}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pmhr-fc-form-actions">
                <button
                  type="button"
                  className="pmhr-fc-btn-cancel"
                  onClick={() => navigate("/hr/dashboard/performance/formslist")}
                  disabled={busy}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pmhr-fc-btn-submit"
                  disabled={busy || !isStep1Complete()}
                >
                  {busy ? (
                    <>
                      <span className="pmhr-fc-spinner"></span>
                      Next...
                    </>
                  ) : (
                    <>Next: Add Competencies</>
                  )}
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
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
                <div className="pmhr-fc-section-body">
                  {validationErrors.competencies && (
                    <div className="pmhr-fc-alert-warning">
                      <i className="bi bi-exclamation-triangle"></i>
                      <span>At least one competency is required</span>
                    </div>
                  )}
                  {model.competencies.map((comp, index) => (
                    <div key={index} className="pmhr-fc-comp-card">
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
                            Description{" "}
                            <span className="pmhr-fc-required">*</span>
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
              <div className="pmhr-fc-form-actions">
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
          )}
        </form>
      </div>
    </div>
  );
}

export default FormCreate;
