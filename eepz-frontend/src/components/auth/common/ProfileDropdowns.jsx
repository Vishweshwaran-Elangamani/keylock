import { useState } from "react";
export const GenderDropdown = ({ value, onChange, disabled, showError }) => {
  const [open, setOpen] = useState(false);
  const options = [
    { label: "Select Gender", value: "" },
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Other", value: "Other" },
    { label: "Prefer not to say", value: "Prefer not to say" },
  ];
  const selected = options.find((o) => o.value === value) || options[0];
  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };
  if (disabled) {
    return (
      <div className={`epda-form-control ${showError ? "epda-error" : ""}`}>
        {selected.label}
      </div>
    );
  }
  return (
    <div
      className={`epda-custom-dropdown ${showError ? "epda-error" : ""}`}
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
    >
      <div
        className="epda-custom-selected"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selected.label}
        <span className="epda-custom-arrow" />
      </div>
      {open && (
        <div className="epda-custom-menu">
          {options.map((opt) => (
            <div
              key={opt.value || "empty"}
              className={
                "epda-custom-option" +
                (opt.value === value ? " epda-custom-option-active" : "")
              }
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export const NationalityDropdown = ({
  value,
  onChange,
  disabled,
  showError,
  options,
}) => {
  const [open, setOpen] = useState(false);
  const allOptions = [
    { label: "Select Nationality", value: "" },
    ...options.map((nat) => ({ label: nat, value: nat })),
  ];
  const selected = allOptions.find((o) => o.value === value) || allOptions[0];
  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };
  if (disabled) {
    return (
      <div className={`epda-form-control ${showError ? "epda-error" : ""}`}>
        {selected.label}
      </div>
    );
  }
  return (
    <div
      className={`epda-custom-dropdown ${showError ? "epda-error" : ""}`}
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
    >
      <div
        className="epda-custom-selected"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selected.label}
        <span className="epda-custom-arrow" />
      </div>
      {open && (
        <div className="epda-custom-menu">
          {allOptions.map((opt) => (
            <div
              key={opt.value || "empty"}
              className={
                "epda-custom-option" +
                (opt.value === value ? " epda-custom-option-active" : "")
              }
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export const MaritalStatusDropdown = ({
  value,
  onChange,
  disabled,
  showError,
}) => {
  const [open, setOpen] = useState(false);
  const options = [
    { label: "Select Status", value: "" },
    { label: "Single", value: "Single" },
    { label: "Married", value: "Married" },
    { label: "Prefer not to say", value: "Prefer not to say" },
  ];
  const selected = options.find((o) => o.value === value) || options[0];
  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };
  if (disabled) {
    return (
      <div className={`epda-form-control ${showError ? "epda-error" : ""}`}>
        {selected.label}
      </div>
    );
  }
  return (
    <div
      className={`epda-custom-dropdown ${showError ? "epda-error" : ""}`}
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
    >
      <div
        className="epda-custom-selected"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selected.label}
        <span className="epda-custom-arrow" />
      </div>
      {open && (
        <div className="epda-custom-menu">
          {options.map((opt) => (
            <div
              key={opt.value || "empty"}
              className={
                "epda-custom-option" +
                (opt.value === value ? " epda-custom-option-active" : "")
              }
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export const StateDropdown = ({
  value,
  onChange,
  disabled,
  showError,
  options,
}) => {
  const [open, setOpen] = useState(false);
  const allOptions = [
    { label: "Select State", value: "" },
    ...options.map((state) => ({ label: state, value: state })),
  ];
  const selected = allOptions.find((o) => o.value === value) || allOptions[0];
  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };
  if (disabled) {
    return (
      <div className={`epda-form-control ${showError ? "epda-error" : ""}`}>
        {selected.label}
      </div>
    );
  }
  return (
    <div
      className={`epda-custom-dropdown ${showError ? "epda-error" : ""}`}
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
    >
      <div
        className="epda-custom-selected"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selected.label}
        <span className="epda-custom-arrow" />
      </div>
      {open && (
        <div className="epda-custom-menu">
          {allOptions.map((opt) => (
            <div
              key={opt.value || "empty"}
              className={
                "epda-custom-option" +
                (opt.value === value ? " epda-custom-option-active" : "")
              }
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
