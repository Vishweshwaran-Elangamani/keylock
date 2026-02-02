import { STATUS_CONFIG } from '../../../constants/lnd/lndConstants';

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || {
    label: status,
    color: '#6c757d',
    bg: '#e9ecef',
    icon: null
  };

  const Icon = config.icon;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.20rem',
        padding: '0.25rem 0.75rem',
        minWidth: '9rem',
        background: config.bg,
        color: config.color,
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: '600',
        whiteSpace: 'nowrap'
      }}
    >
      {Icon && <Icon size={14} />}  
      {config.label}
    </span>
  );
};

export default StatusBadge;