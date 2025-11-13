import { Star, AlertCircle, TrendingUp } from 'lucide-react';
import { RATING, SKILL_RATING_LABELS } from '../../../constants/lnd/lndConstants';

const RatingDisplay = ({ rating, showLabel = true, size = 'md' }) => {
  const getRatingInfo = (rating) => {
    if (rating < RATING.MIN_REQUEST_SME) {
      return {
        icon: AlertCircle,
        color: '#dc3545',
        bg: '#fee2e2',
        label: SKILL_RATING_LABELS.NEEDS_IMPROVEMENT
      };
    }
    if (rating < RATING.MIN_SME) {
      return {
        icon: TrendingUp,
        color: '#0d6efd',
        bg: '#dbeafe',
        label: SKILL_RATING_LABELS.COMPETENT
      };
    }
    return {
      icon: Star,
      color: '#198754',
      bg: '#d1fae5',
      label: SKILL_RATING_LABELS.EXPERT
    };
  };

  const info = getRatingInfo(rating);
  const Icon = info.icon;

  const sizes = {
    sm: { icon: 12, text: '0.75rem', padding: '0.25rem 0.5rem' },
    md: { icon: 14, text: '0.875rem', padding: '0.375rem 0.75rem' },
    lg: { icon: 16, text: '1rem', padding: '0.5rem 1rem' }
  };

  const sizeConfig = sizes[size] || sizes.md;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: sizeConfig.padding,
          borderRadius: '12px',
          background: info.bg,
          border: `1px solid ${info.color}20`
        }}
      >
        <Icon size={sizeConfig.icon} color={info.color} />
        <span
          style={{
            fontWeight: '700',
            color: info.color,
            fontSize: sizeConfig.text
          }}
        >
          {rating}/{RATING.MAX}
        </span>
      </div>
      {showLabel && (
        <span
          style={{
            fontSize: '0.8125rem',
            color: '#6c757d',
            fontWeight: '500'
          }}
        >
          {info.label}
        </span>
      )}
    </div>
  );
};

export default RatingDisplay;
