// src/components/SLA/SLACard.jsx
import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { FaExclamationTriangle, FaClock, FaCheckCircle } from 'react-icons/fa';
import {
  calculateDaysUntilDeadline,
  calculateUrgencyStatus,
  getStatusBadge
} from '@/utils/slaCalculations';
import './SLACard.css';

const SLACard = ({ sla, onViewDetails, onEscalate }) => {
  const daysUntil = calculateDaysUntilDeadline(sla.deadline);
  const urgency = calculateUrgencyStatus(sla.deadline, sla.status, sla.complianceStatus);
  const statusBadge = getStatusBadge(sla.status);

  const getUrgencyBadge = () => {
    switch (urgency) {
      case 'Overdue':
        return { bg: 'danger', icon: <FaExclamationTriangle /> };
      case 'Due Soon':
        return { bg: 'warning', icon: <FaClock /> };
      case 'Upcoming':
        return { bg: 'info', icon: <FaClock /> };
      default:
        return { bg: 'success', icon: <FaCheckCircle /> };
    }
  };

  const urgencyBadge = getUrgencyBadge();

  return (
    <Card className="sla-card h-100 shadow-sm">
      {/* Card Header */}
      <Card.Header className="bg-light d-flex justify-content-between align-items-start">
        <div>
          <h6 className="mb-0 fw-bold">{sla.slatype}</h6>
          <small className="text-muted">ID: {sla.slaid}</small>
        </div>
        <Badge bg={statusBadge.bg}>{sla.status}</Badge>
      </Card.Header>

      {/* Card Body */}
      <Card.Body>
        {/* Employee Info */}
        <div className="mb-3">
          <small className="text-muted d-block">Assigned to</small>
          <strong>{sla.assignedToName || 'Unassigned'}</strong>
          {sla.assignedToName && (
            <small className="text-muted d-block">{sla.assignedToEmployeeId}</small>
          )}
        </div>

        {/* Department */}
        <div className="mb-3">
          <small className="text-muted d-block">Department</small>
          <strong>{sla.departmentName}</strong>
        </div>

        {/* Deadline */}
        <div className="mb-3">
          <small className="text-muted d-block">Deadline</small>
          <strong>{new Date(sla.deadline).toLocaleDateString('en-IN')}</strong>
          <small className={`d-block mt-1 ${daysUntil < 0 ? 'text-danger' : 'text-muted'}`}>
            {daysUntil < 0
              ? `🔴 ${Math.abs(daysUntil)} days overdue`
              : `⏳ ${daysUntil} days remaining`}
          </small>
        </div>

        {/* Urgency */}
        <div className="mb-3">
          <Badge bg={urgencyBadge.bg} className="me-2">
            {urgencyBadge.icon} {urgency}
          </Badge>
        </div>

        {/* Status Info */}
        {sla.status === 'Closed' && (
          <div className="mb-3">
            <small className="text-muted d-block">Compliance Status</small>
            <Badge bg={
              sla.complianceStatus === 'OnTime' ? 'success' :
                sla.complianceStatus === 'Breached' ? 'danger' :
                  'warning'
            }>
              {sla.complianceStatus}
            </Badge>
          </div>
        )}
      </Card.Body>

      {/* Card Footer */}
      <Card.Footer className="bg-light d-flex gap-2">
        <Button
          variant="outline-primary"
          size="sm"
          className="flex-grow-1"
          onClick={onViewDetails}
        >
          View Details
        </Button>
        {sla.status === 'Open' && (
          <Button
            variant="outline-danger"
            size="sm"
            className="flex-grow-1"
            onClick={onEscalate}
          >
            Escalate
          </Button>
        )}
      </Card.Footer>
    </Card>
  );
};

export default SLACard;
