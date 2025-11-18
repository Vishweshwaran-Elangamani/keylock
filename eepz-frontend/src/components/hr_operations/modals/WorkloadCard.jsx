import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import workloadService from "../../../services/hr_operations/hr/workloadService";

const WorkloadCard = ({ project, fairnessStatus, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("details");

  const handleViewDetails = () => {
    setModalType("details");
    setShowModal(true);
  };

  const handleAllocateWorkload = () => {
    setModalType("allocate");
    setShowModal(true);
  };

  const getFairnessInfo = () => {
    switch (fairnessStatus) {
      case "high":
        return {
          color: "#10b981",
          bgColor: "#d1fae5",
          label: "High Fairness",
          icon: "check-circle-fill",
        };
      case "low":
        return {
          color: "#ef4444",
          bgColor: "#fee2e2",
          label: "Low Fairness",
          icon: "exclamation-circle-fill",
        };
      default:
        return {
          color: "#f59e0b",
          bgColor: "#fef3c7",
          label: "Medium Fairness",
          icon: "dash-circle-fill",
        };
    }
  };

  const fairnessInfo = getFairnessInfo();
  const teamMembersCount = project.teamMembers?.length || 0;
  const avgWorkload = project.avgWorkload || 0;
  const workloadVariance = project.workloadVariance || 0;
  const tasksDistributed = project.tasksDistributed || 0;

  return (
    <>
      <div className="workload-card">
        <div className="workload-card-header">
          <div className="workload-card-title-section">
            <h5 className="workload-card-title">{project.projectName}</h5>
            <p className="workload-card-subtitle">
              <i className="bi bi-person-fill"></i>
              {project.reportingManagerName || "N/A"}
            </p>
            <p className="workload-card-members">
              <i className="bi bi-people-fill"></i>
              {teamMembersCount} Team Members
            </p>
          </div>

          <div
            className="workload-fairness-badge"
            style={{
              backgroundColor: fairnessInfo.bgColor,
              borderRadius: "20px",
              padding: "8px 16px",
            }}
          >
            <i
              className={`bi bi-${fairnessInfo.icon}`}
              style={{ color: fairnessInfo.color, marginRight: "8px" }}
            ></i>
            <span style={{ color: fairnessInfo.color, fontWeight: "600" }}>
              {fairnessInfo.label}
            </span>
          </div>
        </div>

        <div className="workload-card-metrics">
          <div className="metric-item">
            <label className="metric-label">Avg Workload</label>
            <div className="metric-progress">
              <div
                className="metric-progress-bar"
                style={{
                  width: `${Math.min(avgWorkload, 100)}%`,
                  backgroundColor: fairnessInfo.color,
                }}
              ></div>
            </div>
            <p className="metric-value">{avgWorkload}%</p>
          </div>

          <div className="metric-item">
            <label className="metric-label">Workload Variance</label>
            <p className="metric-value metric-variance">{workloadVariance}%</p>
          </div>

          <div className="metric-item">
            <label className="metric-label">Tasks Distributed</label>
            <p className="metric-value">{tasksDistributed}</p>
          </div>
        </div>

        {fairnessStatus === "low" && (
          <div className="workload-alert-message alert alert-danger">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <span>
              Workload variance is high. Consider redistributing tasks.
            </span>
          </div>
        )}

        {fairnessStatus === "high" && (
          <div className="workload-alert-message alert alert-success">
            <i className="bi bi-check-circle-fill"></i>
            <span>Excellent! Workload is fairly distributed.</span>
          </div>
        )}

        {fairnessStatus === "medium" && (
          <div className="workload-alert-message alert alert-warning">
            <i className="bi bi-dash-circle-fill"></i>
            <span>Workload variance is moderate. Monitor closely.</span>
          </div>
        )}

        <div className="workload-card-actions">
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={handleViewDetails}
          >
            <i className="bi bi-eye"></i>
            View Team Details
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleAllocateWorkload}
          >
            <i className="bi bi-pencil"></i>
            Allocate Workload
          </button>
        </div>
      </div>

      {showModal && (
        <WorkloadModal
          show={showModal}
          onHide={() => setShowModal(false)}
          project={project}
          modalType={modalType}
          onRefresh={onRefresh}
        />
      )}
    </>
  );
};

const WorkloadModal = ({ show, onHide, project, modalType, onRefresh }) => {
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAllocate = async () => {
    if (selectedEmployees.length === 0) {
      alert("Please select at least one employee");
      return;
    }

    setLoading(true);
    try {
      await workloadService.mapEmployeesToProject(
        project.projectId,
        selectedEmployees
      );
      alert("Workload allocated successfully!");
      onHide();
      onRefresh();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {modalType === "details" ? "Team Details" : "Allocate Workload"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {modalType === "details" ? (
          <div className="modal-details">
            <h6>Project Information</h6>
            <p>
              <strong>Project Name:</strong> {project.projectName}
            </p>
            <p>
              <strong>Manager:</strong> {project.reportingManagerName}
            </p>
            <p>
              <strong>Team Members:</strong> {project.teamMembers?.length || 0}
            </p>

            {project.teamMembers && project.teamMembers.length > 0 && (
              <>
                <h6 className="mt-4">Team Members</h6>
                <ul className="list-group">
                  {project.teamMembers.map((member, idx) => (
                    <li key={idx} className="list-group-item">
                      {member.employeeName} - {member.workload}% workload
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ) : (
          <div className="modal-allocate">
            <h6>Select Employees to Allocate</h6>
            <p className="text-muted">
              Check the employees you want to assign to this project
            </p>
            <div className="employee-list">
              <p className="text-muted">Employee allocation interface</p>
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <button type="button" className="btn btn-secondary" onClick={onHide}>
          Close
        </button>
        {modalType === "allocate" && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAllocate}
            disabled={loading}
          >
            {loading ? "Allocating..." : "Allocate"}
          </button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default WorkloadCard;
