// src/components/sla/UrgencyIndicator.jsx
import React from 'react';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';

const UrgencyIndicator = ({ urgencyStatus, daysUntilDeadline, showLabel = true }) => {
  const urgencyConfig = {
    'Overdue': {
      icon: AlertTriangle,
      color: '#E01950',
      bgColor: '#E0195015',
      label: 'Overdue',
      text: `Overdue by ${Math.abs(daysUntilDeadline)} day(s)`
    },
    'Due Soon': {
      icon: Clock,
      color: '#E2B93B',
      bgColor: '#E2B93B15',
      label: 'Due Soon',
      text: `${daysUntilDeadline} day(s) left`
    },
    'On Track': {
      icon: CheckCircle,
      color: '#24A148',
      bgColor: '#24A14815',
      label: 'On Track',
      text: `${daysUntilDeadline} day(s) left`
    }
  };

  const config = urgencyConfig[urgencyStatus] || urgencyConfig['On Track'];
  const IconComponent = config.icon;

  return (
    <div 
      className="d-inline-flex align-items-center gap-2 px-3 py-2"
      style={{ 
        backgroundColor: config.bgColor,
        borderRadius: '8px',
        border: `1px solid ${config.color}30`
      }}
    >
      <IconComponent size={16} color={config.color} strokeWidth={2.5} />
      {showLabel && (
        <span style={{ color: config.color, fontWeight: 600, fontSize: '0.875rem' }}>
          {config.text}
        </span>
      )}
    </div>
  );
};

export default UrgencyIndicator;
