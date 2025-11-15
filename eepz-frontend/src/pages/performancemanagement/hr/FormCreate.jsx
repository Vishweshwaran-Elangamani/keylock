// import React, { useState, useEffect } from "react";
// import { useParams } from "react-router-dom";
// import api from "../../../services/performancemanagement/hr/api";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import "../../../styles/performancemanagement/form-create.css";
// import { useAuth } from "../../../contexts/auth/AuthContext";
 
// function FormCreate() {
//   const { user, loading } = useAuth();
//   const { formId } = useParams();
//   const isEditMode = !!formId;
 
//   const [model, setModel] = useState({
//     name: "",
//     type: "",
//     createdBy: null,
//     deliveryEnablement: "",
//     competencies: [],
//   });
 
//   const [busy, setBusy] = useState(false);
 
//   // Debug: show user and model
//   useEffect(() => {
//     console.log("User context in FormCreate:", user);
//     console.log("Model in FormCreate:", model);
//   }, [user, model]);
 
//   // Set createdBy from user.userId as soon as available
//   useEffect(() => {
//     if (user?.userId) {
//       setModel((m) => ({ ...m, createdBy: user.userId }));
//     }
//   }, [user]);
 
//   // Load form data if edit mode
//   useEffect(() => {
//     if (!isEditMode) return;
//     api.get(`/FormManagement/${formId}`)
//       .then(({ data }) => {
//         const payload = data?.data ?? {};
//         setModel({
//           ...payload,
//           competencies: payload.competencies ?? [],
//         });
//       })
//       .catch(() => {
//         toast.error("Failed to load form for editing.");
//       });
//   }, [formId, isEditMode]);
 
//   const addCompetency = () => {
//     setModel((m) => ({
//       ...m,
//       competencies: [
//         ...m.competencies,
//         { name: "", description: "", displayOrder: m.competencies.length + 1 },
//       ],
//     }));
//   };
 
//   const updateComp = (index, key, value) => {
//     setModel((m) => {
//       const next = structuredClone(m);
//       next.competencies[index][key] = key === "displayOrder" ? Number(value) : value;
//       return next;
//     });
//   };
 
//   const removeComp = (index) => {
//     setModel((m) => {
//       const next = structuredClone(m);
//       next.competencies.splice(index, 1);
//       next.competencies.forEach((c, idx) => (c.displayOrder = idx + 1));
//       return next;
//     });
//   };
 
//   const onSubmit = async (e) => {
//     e.preventDefault();
//     setBusy(true);
 
//     // Debug: log user and model
//     console.log("Form submit: user context", user);
//     console.log("Form submit: model", model);
 
//     if (loading) {
//       toast.error("Authentication loading. Please wait.");
//       setBusy(false);
//       return;
//     }
//     if (!user || !user.userId || !model.createdBy) {
//       toast.error("User not loaded. Please login again.");
//       setBusy(false);
//       return;
//     }
//     if (!model.name) {
//       toast.error("Form name is required.");
//       setBusy(false);
//       return;
//     }
//     if (!model.type) {
//       toast.error("Form type is required.");
//       setBusy(false);
//       return;
//     }
//     if (!model.deliveryEnablement) {
//       toast.error("Delivery/Enablement is required.");
//       setBusy(false);
//       return;
//     }
//     if (!model.competencies.length) {
//       toast.error("At least one competency is required.");
//       setBusy(false);
//       return;
//     }
 
//     // PascalCase mapping for backend (raw, not nested)
//     const toPascalCase = (obj) => ({
//       Name: obj.name,
//       Type: obj.type,
//       DeliveryEnablement: obj.deliveryEnablement,
//       CreatedBy: obj.createdBy,
//       Competencies: obj.competencies.map((c) => ({
//         Name: c.name,
//         Description: c.description,
//         DisplayOrder: c.displayOrder,
//       })),
//     });
//     const payload = toPascalCase(model);
//     console.log("Submitting payload:", payload);
 
//     try {
//       const endpoint = isEditMode ? `/FormManagement/${formId}` : "/FormManagement/create";
//       const method = isEditMode ? api.put : api.post;
 
//       const { data } = await method(endpoint, payload);
//       toast.success(data.message || (isEditMode ? "Form updated" : "Form created"));
//     } catch (error) {
//       toast.error(isEditMode ? "Failed to update form." : "Failed to create form.");
//       console.error(error);
//     } finally {
//       setBusy(false);
//     }
//   };
 
//   if (loading) {
//     return <div>Loading user authentication...</div>;
//   }
//   if (!user || !user.userId) {
//     return <div>User not loaded. Please login again.</div>;
//   }
 
//   return (
//     <div className="fc-main-wrap">
//       <div className="fc-form-max">
//         <div className="fc-header-bar">
//           <h3 className="fc-title">{isEditMode ? "Edit Form" : "Create Form"}</h3>
//         </div>
 
//         <form className="fc-form-section" onSubmit={onSubmit}>
//           <div className="fc-section-title">General Details</div>
 
//           <div className="fc-form-group">
//             <label className="fc-label">Form Name</label>
//             <input
//               className="fc-input"
//               value={model.name}
//               onChange={(e) => setModel({ ...model, name: e.target.value })}
//               required
//               disabled={busy}
//             />
//           </div>
 
//           <div className="fc-form-row">
//             <div className="fc-col">
//               <label className="fc-label">Type</label>
//               <select
//                 className="fc-select"
//                 value={model.type}
//                 onChange={(e) => setModel({ ...model, type: e.target.value })}
//                 required
//                 disabled={busy}
//               >
//                 <option value="">Select type</option>
//                 <option value="Self">Self</option>
//                 <option value="Manager">Manager</option>
//                 <option value="HR Summary">HR Summary</option>
//               </select>
//             </div>
 
//             <div className="fc-col">
//               <label className="fc-label">Delivery / Enablement</label>
//               <select
//                 className="fc-select"
//                 value={model.deliveryEnablement}
//                 onChange={(e) => setModel({ ...model, deliveryEnablement: e.target.value })}
//                 required
//                 disabled={busy}
//               >
//                 <option value="">Select option</option>
//                 <option value="Delivery">Delivery</option>
//                 <option value="Enablement">Enablement</option>
//               </select>
//             </div>
//           </div>
 
//           <hr className="fc-divider" />
 
//           <div className="fc-section-competencies">
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//                 marginBottom: 6,
//               }}
//             >
//               <span className="fc-section-title" style={{ marginBottom: 0 }}>
//                 Competencies
//               </span>
//               <button
//                 type="button"
//                 className="fc-btn-add"
//                 onClick={addCompetency}
//                 disabled={busy}
//               >
//                 + Add Competency
//               </button>
//             </div>
 
//             {model.competencies.length === 0 && <p>Please add at least one competency.</p>}
 
//             {model.competencies.map((c, i) => (
//               <div key={i} className="fc-card" tabIndex={0}>
//                 <div className="fc-competency-row">
//                   <div className="fc-competency-col">
//                     <label className="fc-label">Name</label>
//                     <input
//                       className="fc-input"
//                       value={c.name}
//                       onChange={(e) => updateComp(i, "name", e.target.value)}
//                       required
//                       disabled={busy}
//                     />
//                   </div>
//                   <div className="fc-competency-col-large">
//                     <label className="fc-label">Description</label>
//                     <input
//                       className="fc-input"
//                       value={c.description || ""}
//                       onChange={(e) => updateComp(i, "description", e.target.value)}
//                       disabled={busy}
//                     />
//                   </div>
//                   <div className="fc-competency-col-small">
//                     <label className="fc-label">Order</label>
//                     <input
//                       type="number"
//                       min="1"
//                       className="fc-input"
//                       value={c.displayOrder || 0}
//                       onChange={(e) => updateComp(i, "displayOrder", e.target.value)}
//                       disabled={busy}
//                     />
//                   </div>
//                 </div>
//                 <div className="fc-remove-btn-container">
//                   <button
//                     type="button"
//                     className="fc-btn-remove"
//                     onClick={() => removeComp(i)}
//                     disabled={busy}
//                   >
//                     Remove
//                   </button>
//                 </div>
//               </div>
//             ))}
 
//             <button type="submit" className="fc-btn-submit" disabled={busy}>
//               {busy
//                 ? isEditMode
//                   ? "Updating..."
//                   : "Creating..."
//                 : isEditMode
//                 ? "Update Form"
//                 : "Create Form"}
//             </button>
//           </div>
//         </form>
 
//         <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
//       </div>
//     </div>
//   );
// }
 
// export default FormCreate;
 
 /**
 * FormCreate Component
 * 
 * Create/Edit performance evaluation forms with competencies.
 * Features:
 * - Create new forms or edit existing ones
 * - Add/Remove/Reorder competencies
 * - Form type selection (Self/Manager/HR Summary)
 * - Delivery/Enablement classification
 * - Real-time validation
 * - Toast notifications using Sonner
 * - Professional UI with Bootstrap icons
 * 
 * @component
 */
/**
 * FormCreate Component
 * 
 * Create/Edit performance evaluation forms with competencies.
 * Features:
 * - Create new forms or edit existing ones
 * - Add/Remove/Reorder competencies
 * - Form type selection (Self/Manager/HR Summary)
 * - Delivery/Enablement classification
 * - Real-time validation
 * - Toast notifications using Sonner
 * - Professional UI matching template design
 * 
 * @component
 */
/**
 * FormCreate Component
 * 
 * Create/Edit performance evaluation forms with competencies.
 * Features:
 * - Create new forms or edit existing ones
 * - Add/Remove/Reorder competencies
 * - Inline label layout (labels on left)
 * - Narrow input boxes
 * - Add Competency button on left
 * 
 * @component
 */
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
      <div className="fc-loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user || !user.userId) {
    return (
      <div className="fc-error-container">
        <div className="fc-error-icon">
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
    <div className="fc-page">
      {/* Top Bar */}
      <div className="fc-top-bar">
        <nav className="fc-breadcrumb-nav" aria-label="breadcrumb">
          <ol className="fc-breadcrumb">
            <li className="fc-breadcrumb-item" onClick={() => navigate("/dashboard")}>
              <i className="bi bi-house-door"></i>
              <span>Dashboard</span>
            </li>
            <li className="fc-breadcrumb-item" onClick={() => navigate("/performance/forms")}>
              <span>Forms</span>
            </li>
            <li className="fc-breadcrumb-item active" aria-current="page">
              Create Form
            </li>
          </ol>
        </nav>
        <button
          type="button"
          className="fc-btn-back"
          onClick={() => navigate("/performance/forms")}
          disabled={busy}
        >
          <i className="bi bi-arrow-left"></i>
          Back to Forms
        </button>
      </div>

      {/* Page Header */}
      <div className="fc-page-header">
        <h2 className="fc-page-title">
          <i className="bi bi-file-earmark-plus"></i>
          Create New Form
        </h2>
        <p className="fc-page-description">
          Design a new performance evaluation form with competencies
        </p>
      </div>

      {/* FORM CONTAINER */}
      <form onSubmit={onSubmit} className="fc-form-container">
        {/* LEFT COLUMN - details and actions */}
        <div className="fc-left-column">
          {/* General Details */}
          <div className="fc-section fc-general-details">
            <div className="fc-section-header">
              <i className="bi bi-info-circle"></i>
              <h3 className="fc-section-title">General Details</h3>
            </div>
            <div className="fc-section-body">
              {/* Form Name */}
              <div className="fc-form-group fc-full-width">
                <label className="fc-label">
                  Form Name <span className="fc-required">*</span>
                </label>
                <div className="fc-error-wrapper">
                  <input
                    type="text"
                    className={`fc-input ${validationErrors.name ? "fc-input-error" : ""}`}
                    placeholder="Enter form name (e.g., Annual Performance Review 2024)"
                    value={model.name}
                    onChange={(e) => {
                      setModel({ ...model, name: e.target.value });
                      setValidationErrors({ ...validationErrors, name: null });
                    }}
                    disabled={busy}
                  />
                  {validationErrors.name && (
                    <span className="fc-error-text">
                      <i className="bi bi-exclamation-circle"></i>
                      {validationErrors.name}
                    </span>
                  )}
                </div>
              </div>
              {/* Form Type & Category */}
              <div className="fc-form-row-two">
                <div className="fc-form-group">
                  <label className="fc-label">
                    Form Type <span className="fc-required">*</span>
                  </label>
                  <div className="fc-error-wrapper">
                    <select
                      className={`fc-select ${validationErrors.type ? "fc-input-error" : ""}`}
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
                      <span className="fc-error-text">
                        <i className="bi bi-exclamation-circle"></i>
                        {validationErrors.type}
                      </span>
                    )}
                  </div>
                </div>
                <div className="fc-form-group">
                  <label className="fc-label">
                    Category <span className="fc-required">*</span>
                  </label>
                  <div className="fc-error-wrapper">
                    <select
                      className={`fc-select ${
                        validationErrors.deliveryEnablement ? "fc-input-error" : ""
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
                      <span className="fc-error-text">
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
          <div className="fc-form-actions">
            <button
              type="button"
              className="fc-btn-cancel"
              onClick={() => navigate("/performance/forms")}
              disabled={busy}
            >
              Cancel
            </button>
            <button type="submit" className="fc-btn-submit" disabled={busy}>
              {busy ? (
                <>
                  <span className="fc-spinner"></span>
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
        <div className="fc-section fc-competencies-section">
          <div className="fc-section-header">
            <div className="fc-section-header-left">
              <i className="bi bi-list-check"></i>
              <h3 className="fc-section-title">Competencies</h3>
              <span className="fc-count-badge">{model.competencies.length} Competencies</span>
            </div>
            <button
              type="button"
              className="fc-btn-add-comp"
              onClick={addCompetency}
              disabled={busy}
            >
              <i className="bi bi-plus-circle"></i>
              Add Competency
            </button>
          </div>
          <div className="fc-section-body">
            {validationErrors.competencies && (
              <div className="fc-alert-warning">
                <i className="bi bi-exclamation-triangle"></i>
                <span>At least one competency is required</span>
              </div>
            )}
            {model.competencies.map((comp, index) => (
              <div key={index} className="fc-comp-card">
                <div className="fc-comp-header">
                  <div className="fc-comp-left">
                    <span className="fc-comp-number">#{comp.displayOrder}</span>
                    <span className="fc-comp-label">{comp.name || "Sample"}</span>
                  </div>
                  <div className="fc-comp-actions">
                    <button
                      type="button"
                      className="fc-btn-icon fc-btn-up"
                      onClick={() => moveCompUp(index)}
                      disabled={index === 0 || busy}
                      title="Move Up"
                    >
                      <i className="bi bi-arrow-up"></i>
                    </button>
                    <button
                      type="button"
                      className="fc-btn-icon fc-btn-down"
                      onClick={() => moveCompDown(index)}
                      disabled={index === model.competencies.length - 1 || busy}
                      title="Move Down"
                    >
                      <i className="bi bi-arrow-down"></i>
                    </button>
                    <button
                      type="button"
                      className="fc-btn-icon fc-btn-delete"
                      onClick={() => removeComp(index)}
                      disabled={busy}
                      title="Delete"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
                <div className="fc-comp-body">
                  <div className="fc-form-group fc-full-width">
                    <label className="fc-label">
                      Competency Name <span className="fc-required">*</span>
                    </label>
                    <div className="fc-error-wrapper">
                      <input
                        type="text"
                        className={`fc-input ${
                          validationErrors[`comp_${index}_name`] ? "fc-input-error" : ""
                        }`}
                        placeholder="Sample"
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
                        <span className="fc-error-text">
                          <i className="bi bi-exclamation-circle"></i>
                          {validationErrors[`comp_${index}_name`]}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="fc-form-group fc-full-width">
                    <label className="fc-label">Description (Optional)</label>
                    <textarea
                      className="fc-textarea"
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
