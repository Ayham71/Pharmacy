import React from 'react';

const StatCard = ({ title, value, change, icon: Icon, colorClass }) => (
  <div className="stat-card">
    <div className="stat-card-header">
      <div className={`stat-icon ${colorClass}`}>
        <Icon size={20} />
      </div>
      {change && <span className="stat-change positive">{change}</span>}
    </div>
    <div className="stat-label">{title}</div>
    <div className="stat-value">{value}</div>
  </div>
);

export default StatCard;