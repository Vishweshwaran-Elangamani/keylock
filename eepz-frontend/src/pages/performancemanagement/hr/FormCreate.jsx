import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../../services/performancemanagement/hr/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../../styles/performancemanagement/form-create.css";
import { useAuth } from "../../../contexts/auth/AuthContext";
 
function FormCreate() {
  const { user, loading } = useAuth();
  const { formId } = useParams();
  const isEditMode = !!formId;
 
  const [model, setModel] = useState({
    name: "",
    type: "",
    createdBy: null,
    deliveryEnablement: "",
    competencies: [],
  });
 
  const [busy, setBusy] = useState(false);
 
  // Debug: show user and model
  useEffect(() => {
    console.log("User context in FormCreate:", user);
    console.log("Model in FormCreate:", model);
  }, [user, model]);
 
  // Set createdBy from user.userId as soon as available
  useEffect(() => {
    if (user?.userId) {
      setModel((m) => ({ ...m, createdBy: user.userId }));
    }
  }, [user]);
 
  // Load form data if edit mode
  useEffect(() => {
    if (!isEditMode) return;
    api.get(`/FormManagement/${formId}`)
      .then(({ data }) => {
        const payload = data?.data ?? {};
        setModel({
          ...payload,
          competencies: payload.competencies ?? [],
        });
      })
      .catch(() => {
        toast.error("Failed to load form for editing.");
      });
  }, [formId, isEditMode]);
 
  const addCompetency = () => {
    setModel((m) => ({
      ...m,
      competencies: [
        ...m.competencies,
        { name: "", description: "", displayOrder: m.competencies.length + 1 },
      ],
    }));
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
  };
 
  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
 
    // Debug: log user and model
    console.log("Form submit: user context", user);
    console.log("Form submit: model", model);
 
    if (loading) {
      toast.error("Authentication loading. Please wait.");
      setBusy(false);
      return;
    }
    if (!user || !user.userId || !model.createdBy) {
      toast.error("User not loaded. Please login again.");
      setBusy(false);
      return;
    }
    if (!model.name) {
      toast.error("Form name is required.");
      setBusy(false);
      return;
    }
    if (!model.type) {
      toast.error("Form type is required.");
      setBusy(false);
      return;
    }
    if (!model.deliveryEnablement) {
      toast.error("Delivery/Enablement is required.");
      setBusy(false);
      return;
    }
    if (!model.competencies.length) {
      toast.error("At least one competency is required.");
      setBusy(false);
      return;
    }
 
    // PascalCase mapping for backend (raw, not nested)
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
    console.log("Submitting payload:", payload);
 
    try {
      const endpoint = isEditMode ? `/FormManagement/${formId}` : "/FormManagement/create";
      const method = isEditMode ? api.put : api.post;
 
      const { data } = await method(endpoint, payload);
      toast.success(data.message || (isEditMode ? "Form updated" : "Form created"));
    } catch (error) {
      toast.error(isEditMode ? "Failed to update form." : "Failed to create form.");
      console.error(error);
    } finally {
      setBusy(false);
    }
  };
 
  if (loading) {
    return <div>Loading user authentication...</div>;
  }
  if (!user || !user.userId) {
    return <div>User not loaded. Please login again.</div>;
  }
 
  return (
    <div className="fc-main-wrap">
      <div className="fc-form-max">
        <div className="fc-header-bar">
          <h3 className="fc-title">{isEditMode ? "Edit Form" : "Create Form"}</h3>
        </div>
 
        <form className="fc-form-section" onSubmit={onSubmit}>
          <div className="fc-section-title">General Details</div>
 
          <div className="fc-form-group">
            <label className="fc-label">Form Name</label>
            <input
              className="fc-input"
              value={model.name}
              onChange={(e) => setModel({ ...model, name: e.target.value })}
              required
              disabled={busy}
            />
          </div>
 
          <div className="fc-form-row">
            <div className="fc-col">
              <label className="fc-label">Type</label>
              <select
                className="fc-select"
                value={model.type}
                onChange={(e) => setModel({ ...model, type: e.target.value })}
                required
                disabled={busy}
              >
                <option value="">Select type</option>
                <option value="Self">Self</option>
                <option value="Manager">Manager</option>
                <option value="HR Summary">HR Summary</option>
              </select>
            </div>
 
            <div className="fc-col">
              <label className="fc-label">Delivery / Enablement</label>
              <select
                className="fc-select"
                value={model.deliveryEnablement}
                onChange={(e) => setModel({ ...model, deliveryEnablement: e.target.value })}
                required
                disabled={busy}
              >
                <option value="">Select option</option>
                <option value="Delivery">Delivery</option>
                <option value="Enablement">Enablement</option>
              </select>
            </div>
          </div>
 
          <hr className="fc-divider" />
 
          <div className="fc-section-competencies">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <span className="fc-section-title" style={{ marginBottom: 0 }}>
                Competencies
              </span>
              <button
                type="button"
                className="fc-btn-add"
                onClick={addCompetency}
                disabled={busy}
              >
                + Add Competency
              </button>
            </div>
 
            {model.competencies.length === 0 && <p>Please add at least one competency.</p>}
 
            {model.competencies.map((c, i) => (
              <div key={i} className="fc-card" tabIndex={0}>
                <div className="fc-competency-row">
                  <div className="fc-competency-col">
                    <label className="fc-label">Name</label>
                    <input
                      className="fc-input"
                      value={c.name}
                      onChange={(e) => updateComp(i, "name", e.target.value)}
                      required
                      disabled={busy}
                    />
                  </div>
                  <div className="fc-competency-col-large">
                    <label className="fc-label">Description</label>
                    <input
                      className="fc-input"
                      value={c.description || ""}
                      onChange={(e) => updateComp(i, "description", e.target.value)}
                      disabled={busy}
                    />
                  </div>
                  <div className="fc-competency-col-small">
                    <label className="fc-label">Order</label>
                    <input
                      type="number"
                      min="1"
                      className="fc-input"
                      value={c.displayOrder || 0}
                      onChange={(e) => updateComp(i, "displayOrder", e.target.value)}
                      disabled={busy}
                    />
                  </div>
                </div>
                <div className="fc-remove-btn-container">
                  <button
                    type="button"
                    className="fc-btn-remove"
                    onClick={() => removeComp(i)}
                    disabled={busy}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
 
            <button type="submit" className="fc-btn-submit" disabled={busy}>
              {busy
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                ? "Update Form"
                : "Create Form"}
            </button>
          </div>
        </form>
 
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      </div>
    </div>
  );
}
 
export default FormCreate;
 
 