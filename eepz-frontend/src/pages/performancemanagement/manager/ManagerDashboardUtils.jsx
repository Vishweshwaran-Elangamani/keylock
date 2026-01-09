import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";

export const PaginationDropdown = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div
      className="custom-mgr-pagination-dropdown"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
    >
      <div
        className="custom-mgr-selected"
        onClick={() => setOpen((prev) => !prev)}
      >
        {value}
        <span className="custom-mgr-arrow" />
      </div>

      {open && (
        <div className="custom-mgr-menu">
          {options.map((opt) => (
            <div
              key={opt}
              className={
                "custom-mgr-option" +
                (opt === value ? " custom-mgr-option-active" : "")
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

export const RatingDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const dropdownRef = useRef(null);

  const options = [
    { value: "", label: "-" },
    { value: "1", label: "1 - Poor" },
    { value: "2", label: "2 - Fair" },
    { value: "3", label: "3 - Good" },
    { value: "4", label: "4 - Very Good" },
    { value: "5", label: "5 - Excellent" },
  ];

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || "-";

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!open && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 2,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
    setOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      const menu = document.querySelector(".custom-modal-rating-menu");
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        menu &&
        !menu.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <>
      <div
        ref={dropdownRef}
        className="custom-modal-rating-dropdown"
        tabIndex={0}
      >
        <div className="custom-modal-rating-selected" onClick={handleToggle}>
          {selectedLabel}
          <span className="custom-modal-rating-arrow" />
        </div>
      </div>

      {open &&
        ReactDOM.createPortal(
          <div
            className="custom-modal-rating-menu"
            style={{
              position: "fixed",
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              width: `${menuPosition.width}px`,
              zIndex: 999999,
            }}
          >
            {options.map((opt) => (
              <div
                key={opt.value}
                className={
                  "custom-modal-rating-option" +
                  (opt.value === value
                    ? " custom-modal-rating-option-active"
                    : "")
                }
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect(opt.value);
                }}
              >
                {opt.label}
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
};
