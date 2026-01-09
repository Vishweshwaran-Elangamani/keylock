import React, { useState } from "react";

export const CustomDropdown = ({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}) => {
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o === value) || placeholder || "All";

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div
      className="custom-fc-dropdown"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
      style={{ position: "relative" }}
    >
      <div
        className={`custom-fc-selected ${disabled ? "custom-fc-disabled" : ""}`}
        onClick={() => !disabled && setOpen((prev) => !prev)}
      >
        {selected}
        <span className="custom-fc-arrow" />
      </div>

      {open && !disabled && (
        <div className="custom-fc-menu">
          {options.map((opt) => (
            <div
              key={opt}
              className={
                "custom-fc-option" +
                (opt === value ? " custom-fc-option-active" : "")
              }
              onClick={() => handleSelect(opt)}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const PaginationDropdown = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div
      className="custom-fc-dropdown custom-fc-pagination-dropdown"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
    >
      <div
        className="custom-fc-selected"
        onClick={() => setOpen((prev) => !prev)}
      >
        {value}
        <span className="custom-fc-arrow" />
      </div>

      {open && (
        <div className="custom-fc-menu">
          {options.map((opt) => (
            <div
              key={opt}
              className={
                "custom-fc-option" +
                (opt === value ? " custom-fc-option-active" : "")
              }
              onClick={() => handleSelect(opt)}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
