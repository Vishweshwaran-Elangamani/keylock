// src/components/StatPill.jsx
import React from 'react';

export default function StatPill({ label, value, Icon, color = '#525252' }) {
  return (
    <div className="card border-0" style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
      <div className="card-body">
        <div className="d-flex justify-content-between mb-2">
          <div className="rounded p-2" style={{ background: `${color}15` }}>
            <Icon size={20} style={{ color }} />
          </div>
        </div>
        <h3 className="fw-bold" style={{ color: 'var(--color-primary-1)' }}>{value}</h3>
        <p className="mb-0 small" style={{ color: 'var(--muted)' }}>{label}</p>
      </div>
    </div>
  );
}
