// src/components/CardHeader.jsx
import React from 'react';

export default function CardHeader({ title, badge, actions }) {
  return (
    <div className="d-flex justify-content-between align-items-center mb-3">
      <div className="d-flex align-items-center gap-2">
        <h5 className="mb-0">{title}</h5>
        {badge}
      </div>
      <div className="d-flex align-items-center gap-2">
        {actions}
      </div>
    </div>
  );
}
