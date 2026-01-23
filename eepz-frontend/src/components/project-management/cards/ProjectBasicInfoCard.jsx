import React from "react";
import {
  FileText,
  Target,
  User,
  Activity,
  Building,
  Briefcase,
} from "lucide-react";
import { getStatusColor } from "../../../common/constants/statusColorConstants";

const ProjectBasicInfoCard = ({ project }) => {
  const clientName = project.clientName || project.ClientName || "N/A";

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-white border-0 py-3">
        <h5 className="mb-0 d-flex align-items-center gap-2">
          <FileText size={20} className="text-primary" />
          Basic Information
        </h5>
      </div>

      <div className="card-body">
        <div className="row g-4">
          <div className="col-md-6">
            <div className="d-flex align-items-start gap-3">
              <div className="bg-primary-subtle rounded p-2">
                <Target size={20} className="text-primary" />
              </div>
              <div>
                <label className="text-muted small mb-1">Project Name</label>
                <p className="mb-0 fw-semibold">{project.projectName}</p>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="d-flex align-items-start gap-3">
              <div className="bg-secondary-subtle rounded p-2">
                <User size={20} className="text-secondary" />
              </div>
              <div>
                <label className="text-muted small mb-1">Client Name</label>
                <p className="mb-0 fw-semibold">{clientName}</p>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="d-flex align-items-start gap-3">
              <div className="bg-info-subtle rounded p-2">
                <Activity size={20} className="text-info" />
              </div>
              <div>
                <label className="text-muted small mb-1">Status</label>
                <div>
                  <span
                    className={`badge bg-${getStatusColor(project.status)}`}
                  >
                    {project.status || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="d-flex align-items-start gap-3">
              <div className="bg-success-subtle rounded p-2">
                <Building size={20} className="text-success" />
              </div>
              <div>
                <label className="text-muted small mb-1">Business Unit</label>
                <p className="mb-0 fw-semibold">
                  {project.businessUnit || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="d-flex align-items-start gap-3">
              <div className="bg-warning-subtle rounded p-2">
                <Briefcase size={20} className="text-warning" />
              </div>
              <div>
                <label className="text-muted small mb-1">Department</label>
                <p className="mb-0 fw-semibold">
                  {project.department || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="d-flex align-items-start gap-3">
              <div className="bg-secondary-subtle rounded p-2">
                <Target size={20} className="text-secondary" />
              </div>
              <div>
                <label className="text-muted small mb-1">
                  Engagement Model
                </label>
                <p className="mb-0 fw-semibold">
                  {project.engagementModel || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="d-flex align-items-start gap-3">
              <div className="bg-info-subtle rounded p-2">
                <FileText size={20} className="text-info" />
              </div>
              <div className="flex-grow-1">
                <label className="text-muted small mb-1">Description</label>
                <p className="mb-0">
                  {project.description || "No description provided"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectBasicInfoCard;
