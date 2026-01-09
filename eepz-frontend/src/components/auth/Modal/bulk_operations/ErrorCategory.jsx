const ErrorCategory = ({ type, title, icon, errors }) => {
  return (
    <details open className={`bom-error-category bom-error-category-${type}`}>
      <summary
        className={`bom-error-category-summary bom-error-category-summary-${type}`}
      >
        <div className="bom-error-category-summary-content">
          <i className={`bi ${icon}`}></i>
          <span>{title}</span>
          <span
            className={`bom-error-category-badge bom-error-category-badge-${type}`}
          >
            {errors.length}
          </span>
        </div>
        <i className="bi bi-chevron-down"></i>
      </summary>
      <div className="bom-error-category-content">
        <ul className="bom-error-list">
          {errors.map((error, index) => (
            <li
              key={`${type}-${index}`}
              className={`bom-error-list-item bom-error-list-item-${type}`}
            >
              <i className={`bi ${icon} bom-error-list-item-icon`}></i>
              <span>{error}</span>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
};
export default ErrorCategory;
