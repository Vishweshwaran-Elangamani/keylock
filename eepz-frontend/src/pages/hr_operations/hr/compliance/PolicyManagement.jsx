import { useState, useEffect } from "react";
import policyService from "../../../../services/hr_operations/hr/policyService";
import AddPolicyModal from "../modals/AddPolicyModal";
import EditPolicyModal from "../modals/EditPolicyModal";
import { Alert, Spinner, Toast } from "react-bootstrap";
import "../../../../styles/hr_operations/hr/policyManagement.css";

const PolicyManagement = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [alert, setAlert] = useState(null);

  // Centralized toasts
  const [toasts, setToasts] = useState([]);

  const enqueueToast = (variant, message) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, variant, message }]);
    setTimeout(() => {
      setToasts((t) => t.filter((tt) => tt.id !== id));
    }, 3000);
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await policyService.getAllPolicies();
      setPolicies(response || []);
    } catch (error) {
      console.error("Error fetching policies:", error);
      showAlert("danger", "Failed to load policies");
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuccess = () => {
    setShowAddModal(false);
    fetchPolicies();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedPolicy(null);
    fetchPolicies();
  };

  const handleView = (policy) => {
    setSelectedPolicy(policy);
    setShowEditModal(true);
  };

  const handleDelete = async (policyId) => {
    try {
      await policyService.deletePolicy(policyId);
      enqueueToast("success", "Policy deleted successfully!");
      fetchPolicies();
    } catch (error) {
      enqueueToast("danger", "Failed to delete policy");
    }
  };

  //  PUBLISH POLICY
  const handlePublish = async (policyId) => {
    try {
      await policyService.publishPolicy(policyId);
      enqueueToast("success", " Policy published successfully!");
      fetchPolicies();
    } catch (error) {
      console.error("Error publishing policy:", error);
      enqueueToast("danger", "Failed to publish policy");
    }
  };

  //  NEW: UNPUBLISH POLICY
  const handleUnpublish = async (policyId) => {
    try {
      await policyService.unpublishPolicy(policyId);
      enqueueToast(
        "warning",
        " Policy unpublished - Now hidden from employees"
      );
      fetchPolicies();
    } catch (error) {
      console.error("Error unpublishing policy:", error);
      enqueueToast("danger", "Failed to unpublish policy");
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "pm-status-active";
      case "inactive":
        return "pm-status-inactive";
      case "draft":
        return "pm-status-draft";
      default:
        return "pm-status-inactive";
    }
  };

  if (loading) {
    return (
      <div className="pm-loading-container">
        <Spinner animation="border" variant="primary" />
        <p>Loading policies...</p>
      </div>
    );
  }

  return (
    <div className="pm-root">
      {alert && (
        <Alert
          variant={alert.type}
          dismissible
          onClose={() => setAlert(null)}
          className="pm-alert"
        >
          {alert.message}
        </Alert>
      )}

      {/* Header */}
      <div className="pm-header">
        <div className="pm-header-left">
          <h2 className="pm-title">
            <i className="bi bi-shield-check me-2"></i>
            Policy Management
          </h2>
          <p className="pm-subtitle">
            Manage organizational policies and compliance rules
          </p>
        </div>
        <button className="pm-btn-add" onClick={() => setShowAddModal(true)}>
          <i className="bi bi-plus-circle me-2"></i>
          Add New Policy
        </button>
      </div>

      {/* Policies Table */}
      <div className="pm-table-container">
        <table className="pm-table">
          <thead>
            <tr>
              <th>POLICY NAME</th>
              <th>CATEGORY</th>
              <th>DESCRIPTION</th>
              <th>STATUS</th>
              <th className="pm-table-actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {policies.length === 0 ? (
              <tr>
                <td colSpan="5" className="pm-table-empty">
                  <i className="bi bi-inbox"></i>
                  <p>No policies found</p>
                  <button
                    className="pm-btn-add-small"
                    onClick={() => setShowAddModal(true)}
                  >
                    Create Your First Policy
                  </button>
                </td>
              </tr>
            ) : (
              policies.map((policy) => (
                <tr key={policy.policyId}>
                  <td>
                    <div className="pm-policy-name">
                      <strong>{policy.policyName}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="pm-category-badge">
                      {policy.category || "General"}
                    </span>
                  </td>
                  <td>
                    <div className="pm-description">
                      {policy.description?.substring(0, 60)}
                      {policy.description?.length > 60 && "..."}
                    </div>
                  </td>
                  <td>
                    {policy.isPublished ? (
                      <span className="pm-status-badge pm-status-active">
                        Published
                      </span>
                    ) : (
                      <span className="pm-status-badge pm-status-draft">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="pm-table-actions">
                    {/*  PUBLISH BUTTON - Only for Draft */}
                    {!policy.isPublished && (
                      <button
                        className="pm-btn-icon pm-btn-publish"
                        onClick={() => handlePublish(policy.policyId)}
                        title="Publish Policy"
                      >
                        <i className="bi bi-send"></i>
                      </button>
                    )}

                    {/*  UNPUBLISH BUTTON - Only for Published */}
                    {policy.isPublished && (
                      <button
                        className="pm-btn-icon pm-btn-unpublish"
                        onClick={() => handleUnpublish(policy.policyId)}
                        title="Unpublish Policy (Hide from Employees)"
                      >
                        <i className="bi bi-eye-slash"></i>
                      </button>
                    )}

                    <button
                      className="pm-btn-icon pm-btn-view"
                      onClick={() => handleView(policy)}
                      title="View/Edit Policy"
                    >
                      <i className="bi bi-eye"></i>
                    </button>
                    <button
                      className="pm-btn-icon pm-btn-delete"
                      onClick={() => handleDelete(policy.policyId)}
                      title="Delete Policy"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Blur overlay when modal is open */}
      {(showAddModal || showEditModal) && (
        <div className="pm-blur-backdrop"></div>
      )}

      {/* Add Policy Modal */}
      {showAddModal && (
        <AddPolicyModal
          show={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
          onToast={enqueueToast}
        />
      )}

      {/* Edit Policy Modal */}
      {showEditModal && selectedPolicy && (
        <EditPolicyModal
          show={showEditModal}
          policy={selectedPolicy}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPolicy(null);
          }}
          onSuccess={handleEditSuccess}
          onDelete={handleDelete}
          onToast={enqueueToast}
        />
      )}

      {/* TOP-RIGHT TOAST CONTAINER - FIXED POSITION */}
      <div className="pm-toast-container">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            bg={t.variant}
            onClose={() =>
              setToasts((list) => list.filter((x) => x.id !== t.id))
            }
            autohide
            delay={3000}
          >
            <Toast.Body className="text-white">{t.message}</Toast.Body>
          </Toast>
        ))}
      </div>
    </div>
  );
};

export default PolicyManagement;
