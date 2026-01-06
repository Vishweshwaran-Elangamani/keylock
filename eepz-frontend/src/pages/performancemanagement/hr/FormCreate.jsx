import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/performancemanagement/api/api";
import { toast } from "sonner";
import { useAuth } from "../../../contexts/auth/AuthContext";
import "../../../styles/performancemanagement/hr/FormCreate.css";
import Breadcrumb from "../../../components/common/Breadcrumb";


const CustomDropdown = ({ value, onChange, options, placeholder, disabled, error }) => {
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value) || { label: placeholder, value: "" };

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div
      className={`custom-fc-dropdown ${error ? 'custom-fc-dropdown-error' : ''}`}
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
      style={{ position: "relative" }}
    >
      <div
        className={`custom-fc-selected ${disabled ? 'custom-fc-disabled' : ''}`}
        onClick={() => !disabled && setOpen((prev) => !prev)}
      >
        {selected.label}
        <span className="custom-fc-arrow" />
      </div>

      {open && !disabled && (
        <div className="custom-fc-menu">
          {options.map((opt) => (
            <div
              key={opt.value || "default"}
              className={
                "custom-fc-option" +
                (opt.value === value ? " custom-fc-option-active" : "")
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

function FormCreate() {
  const { user, loading } = useAuth();
  const { formId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!formId;

  const [currentStep, setCurrentStep] = useState(1);

 
  const competencyRefs = useRef([]);
  const competencySectionRef = useRef(null);

  
  const [model, setModel] = useState({
    name: "",
    type: "",
    createdBy: null,
    deliveryEnablement: "",
    competencies: [
      {
        name: "",
        description: "",
        displayOrder: 1,
      },
    ],
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

       
        const loadedCompetencies =
          payload.competencies && payload.competencies.length > 0
            ? payload.competencies
            : [
                {
                  name: "",
                  description: "",
                  displayOrder: 1,
                },
              ];

        setModel({
          ...payload,
          competencies: loadedCompetencies,
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
    const newIndex = model.competencies.length;

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

   
    setTimeout(() => {
      const container = competencySectionRef.current;
      if (container && competencyRefs.current[newIndex]) {
        const element = competencyRefs.current[newIndex];
        const elementTop = element.offsetTop;
        const elementHeight = element.offsetHeight;
        const containerHeight = container.clientHeight;
        
        
        container.scrollTo({
          top: elementTop - containerHeight + elementHeight + 50,
          behavior: 'smooth'
        });
      }
    }, 100);
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

   
    setTimeout(() => {
      const container = competencySectionRef.current;
      if (container && competencyRefs.current[index - 1]) {
        const element = competencyRefs.current[index - 1];
        container.scrollTo({
          top: element.offsetTop - 100,
          behavior: 'smooth'
        });
      }
    }, 100);
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

    
    setTimeout(() => {
      const container = competencySectionRef.current;
      if (container && competencyRefs.current[index + 1]) {
        const element = competencyRefs.current[index + 1];
        container.scrollTo({
          top: element.offsetTop - 100,
          behavior: 'smooth'
        });
      }
    }, 100);
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

  // Dropdown options
  const formTypeOptions = [
    { label: "Select form type", value: "" },
    { label: "Self", value: "Self" },
    { label: "Manager", value: "Manager" },
  ];

  const categoryOptions = [
    { label: "Select category", value: "" },
    { label: "Delivery", value: "Delivery" },
    { label: "Enablement", value: "Enablement" },
  ];

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
    <div className="pmhr-fc-layout">
      <div className="pmhr-fc-header">
        <div className="pmhr-fc-header-left">
          <Breadcrumb
            items={[
              { label: "Performance", path: "/hr/dashboard/performance" },
              {
                label: isEditMode ? "Edit Form" : "Create Form",
                path: null,
              },
            ]}
          />
        </div>

        
        <div className="pmhr-fc-step-center">
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
                  isStep1Complete() ? "Add Competencies" : "Complete Step 1 first"
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
      </div>

     
      <div className="pmhr-fc-content">
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
                <div className="pmhr-fc-section-body pmhr-fc-section-body-compact">
                  <div className="pmhr-fc-form-group pmhr-fc-full-width">
                    <label className="pmhr-fc-label">
                      FORM NAME <span className="pmhr-fc-required">*</span>
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

                  <div className="pmhr-fc-form-row-two pmhr-fc-form-row-inline">
                    <div className="pmhr-fc-form-group">
                      <label className="pmhr-fc-label">
                        FORM TYPE <span className="pmhr-fc-required">*</span>
                      </label>
                      <div className="pmhr-fc-error-wrapper">
                        <CustomDropdown
                          value={model.type}
                          onChange={(val) => {
                            setModel({ ...model, type: val });
                            setValidationErrors({
                              ...validationErrors,
                              type: null,
                            });
                          }}
                          options={formTypeOptions}
                          placeholder="Select form type"
                          disabled={busy}
                          error={validationErrors.type}
                        />
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
                        CATEGORY <span className="pmhr-fc-required">*</span>
                      </label>
                      <div className="pmhr-fc-error-wrapper">
                        <CustomDropdown
                          value={model.deliveryEnablement}
                          onChange={(val) => {
                            setModel({
                              ...model,
                              deliveryEnablement: val,
                            });
                            setValidationErrors({
                              ...validationErrors,
                              deliveryEnablement: null,
                            });
                          }}
                          options={categoryOptions}
                          placeholder="Select category"
                          disabled={busy}
                          error={validationErrors.deliveryEnablement}
                        />
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

              <div className="pmhr-fc-form-actions pmhr-fc-form-actions-inline">
                <button
                  type="button"
                  className="pmhr-fc-btn-cancel"
                  onClick={() =>
                    navigate("/hr/dashboard/performance/formslist")
                  }
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
                    <>Add Competencies</>
                  )}
                </button>
              </div>
              <p className="pmhr-fc-info-text">
                After completing the general details, continue to the next step
                to add competencies and finish setting up this appraisal form.
              </p>
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
                                {
                                  validationErrors[
                                    `comp_${index}_description`
                                  ]
                                }
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
          )}
        </form>
      </div>
    </div>
  );
}

export default FormCreate;
