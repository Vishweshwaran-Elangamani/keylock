import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Edit, CheckCircle, AlertCircle, X, MessageSquare, ChevronDown, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';


// Custom Calendar Component - COMPACT VERSION
const CustomCalendar = ({ value, onChange, onClose, minDate }) => {
  const [currentDate, setCurrentDate] = useState(
    value ? new Date(value + 'T00:00:00') : new Date()
  );
  const [selectedDate, setSelectedDate] = useState(
    value ? new Date(value + 'T00:00:00') : null
  );


  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];


  const daysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };


  const firstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };


  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };


  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };


  const handleDateClick = (day) => {
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    const year = selected.getFullYear();
    const month = String(selected.getMonth() + 1).padStart(2, '0');
    const dayStr = String(selected.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${dayStr}`;
    
    if (minDate) {
      const minDateObj = new Date(minDate + 'T00:00:00');
      if (selected < minDateObj) {
        return;
      }
    }
    
    setSelectedDate(selected);
    onChange(formattedDate);
    onClose();
  };


  const handleToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    setSelectedDate(today);
    onChange(formattedDate);
    onClose();
  };


  const renderCalendarDays = () => {
    const days = [];
    const totalDays = daysInMonth(currentDate);
    const firstDay = firstDayOfMonth(currentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const minDateObj = minDate ? new Date(minDate + 'T00:00:00') : null;


    const prevMonthDays = daysInMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(
        <div key={`prev-${i}`} style={{
          aspectRatio: '1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.625rem',
          color: '#d1d5db',
          cursor: 'default',
          borderRadius: '3px',
          fontWeight: 500,
          fontFamily: 'Poppins, sans-serif',
          padding: '0.1rem'
        }}>
          {prevMonthDays - i}
        </div>
      );
    }


    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      date.setHours(0, 0, 0, 0);
      
      const isToday = date.getTime() === today.getTime();
      const isSelected = selectedDate && date.getTime() === selectedDate.getTime();
      const isDisabled = minDateObj && date < minDateObj;


      days.push(
        <div
          key={day}
          style={{
            aspectRatio: '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.625rem',
            color: isSelected ? '#FFFFFF' : isDisabled ? '#d1d5db' : isToday ? '#27235C' : '#393939',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            borderRadius: '3px',
            transition: 'all 0.2s ease',
            fontWeight: isSelected || isToday ? 600 : 500,
            fontFamily: 'Poppins, sans-serif',
            padding: '0.1rem',
            background: isSelected ? '#27235C' : isToday ? 'rgba(39, 35, 92, 0.1)' : 'transparent',
            textDecoration: isDisabled ? 'line-through' : 'none'
          }}
          onClick={() => !isDisabled && handleDateClick(day)}
          onMouseEnter={(e) => {
            if (!isDisabled && !isSelected) {
              e.currentTarget.style.background = 'rgba(39, 35, 92, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isDisabled && !isSelected) {
              e.currentTarget.style.background = isToday ? 'rgba(39, 35, 92, 0.1)' : 'transparent';
            }
          }}
        >
          {day}
        </div>
      );
    }


    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push(
        <div key={`next-${day}`} style={{
          aspectRatio: '1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.625rem',
          color: '#d1d5db',
          cursor: 'default',
          borderRadius: '3px',
          fontWeight: 500,
          fontFamily: 'Poppins, sans-serif',
          padding: '0.1rem'
        }}>
          {day}
        </div>
      );
    }


    return days;
  };


  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E9E9EF',
      borderRadius: '6px',
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
      padding: '0.4rem',
      width: '180px',
      animation: 'calendarFadeIn 0.2s ease',
      fontFamily: 'Poppins, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.4rem',
        paddingBottom: '0.3rem',
        borderBottom: '1px solid #E9E9EF'
      }}>
        <button type="button" style={{
          background: 'transparent',
          border: 'none',
          color: '#27235C',
          cursor: 'pointer',
          padding: '0.15rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '3px',
          transition: 'all 0.2s ease'
        }} onClick={handlePrevMonth}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(39, 35, 92, 0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
          <ChevronLeft size={14} />
        </button>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: '#393939',
          fontFamily: 'Poppins, sans-serif'
        }}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </div>
        <button type="button" style={{
          background: 'transparent',
          border: 'none',
          color: '#27235C',
          cursor: 'pointer',
          padding: '0.15rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '3px',
          transition: 'all 0.2s ease'
        }} onClick={handleNextMonth}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(39, 35, 92, 0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
          <ChevronRight size={14} />
        </button>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '0.1rem',
        marginBottom: '0.2rem'
      }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
          <div key={idx} style={{
            textAlign: 'center',
            fontSize: '0.55rem',
            fontWeight: 600,
            color: '#8D8D8D',
            padding: '0.1rem 0',
            fontFamily: 'Poppins, sans-serif'
          }}>
            {day}
          </div>
        ))}
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '0.1rem'
      }}>
        {renderCalendarDays()}
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: '0.4rem',
        paddingTop: '0.3rem',
        borderTop: '1px solid #E9E9EF'
      }}>
        <button type="button" style={{
          flex: 1,
          padding: '0.25rem 0.4rem',
          fontSize: '0.625rem',
          fontWeight: 600,
          borderRadius: '3px',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          fontFamily: 'Poppins, sans-serif',
          background: '#27235C',
          color: '#FFFFFF'
        }} onClick={handleToday}
        onMouseEnter={(e) => e.currentTarget.style.background = '#1d1a47'}
        onMouseLeave={(e) => e.currentTarget.style.background = '#27235C'}>
          Today
        </button>
      </div>
    </div>
  );
};


// Custom Dropdown Component - FIXED VERSION
const CustomDropdown = ({ label, value, onChange, options, required, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);


  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside both the button and the menu
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };


    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);


  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };


  const getDisplayValue = () => {
    if (!value) return placeholder || "Select";
    const option = options.find((opt) => (opt.value || opt) === value);
    return option ? (option.label || option) : value;
  };


  return (
    <div style={{ marginBottom: '0', fontFamily: 'Poppins, sans-serif' }} ref={dropdownRef}>
      <label 
        className="form-label fw-semibold text-start d-block" 
        style={{ 
          fontSize: '0.875rem',
          color: '#374151',
          marginBottom: '0.5rem',
          fontFamily: 'Poppins, sans-serif'
        }}
      >
        {label}
        {required && <span style={{ color: '#E01950' }}> *</span>}
      </label>
      <div style={{ position: 'relative' }}>
        <div
          ref={buttonRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '0.625rem 0.75rem',
            fontSize: '0.875rem',
            background: '#FFFFFF',
            border: isOpen ? '1px solid #27235C' : '1px solid #d1d5db',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            outline: 'none',
            userSelect: 'none',
            boxShadow: isOpen ? '0 0 0 3px rgba(39, 35, 92, 0.1)' : 'none',
            fontFamily: 'Poppins, sans-serif'
          }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span style={{
            flex: 1,
            textAlign: 'left',
            color: value ? '#393939' : '#8D8D8D',
            fontWeight: 400,
            background: 'transparent',
            cursor: 'pointer',
            fontFamily: 'Poppins, sans-serif'
          }}>
            {getDisplayValue()}
          </span>
          <ChevronDown 
            size={16} 
            style={{
              color: isOpen ? '#27235C' : '#6c757d',
              transition: 'all 0.2s ease',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              flexShrink: 0,
              marginLeft: '0.5rem',
              cursor: 'pointer'
            }}
          />
        </div>
        {isOpen && ReactDOM.createPortal(
          <ul 
            ref={menuRef}
            style={{
              position: 'fixed',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              background: '#FFFFFF',
              border: '1px solid #27235C',
              borderRadius: '8px',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
              maxHeight: '220px',
              overflowY: 'auto',
              zIndex: 99999,
              listStyle: 'none',
              margin: 0,
              padding: 0,
              animation: 'dropdownFadeIn 0.2s ease',
              fontFamily: 'Poppins, sans-serif'
            }}
          >
            {options.map((opt, idx) => {
              const optValue = opt.value || opt;
              const optLabel = opt.label || opt;
              return (
                <li
                  key={idx}
                  style={{
                    padding: '0.65rem 0.875rem',
                    fontSize: '0.875rem',
                    color: value === optValue ? '#FFFFFF' : '#393939',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    borderBottom: idx === options.length - 1 ? 'none' : '1px solid #f0f0f0',
                    background: value === optValue ? '#27235C' : '#FFFFFF',
                    fontWeight: value === optValue ? 600 : 400,
                    borderRadius: idx === options.length - 1 ? '0 0 7px 7px' : idx === 0 ? '7px 7px 0 0' : '0',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                  onClick={() => handleSelect(optValue)}
                  onMouseEnter={(e) => {
                    if (value !== optValue) {
                      e.currentTarget.style.background = '#27235C';
                      e.currentTarget.style.color = '#FFFFFF';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (value !== optValue) {
                      e.currentTarget.style.background = '#FFFFFF';
                      e.currentTarget.style.color = '#393939';
                    }
                  }}
                >
                  {optLabel}
                </li>
              );
            })}
          </ul>,
          document.body
        )}
      </div>
    </div>
  );
};


// Custom Date Input Component - CALENDAR APPEARS ABOVE ICON
const DateInput = ({ label, name, value, onChange, error, required, min, placeholder }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
  const calendarRef = useRef(null);
  const buttonRef = useRef(null);
  const calendarMenuRef = useRef(null);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        calendarRef.current && 
        !calendarRef.current.contains(event.target) &&
        calendarMenuRef.current &&
        !calendarMenuRef.current.contains(event.target)
      ) {
        setShowCalendar(false);
      }
    };


    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  useEffect(() => {
    if (showCalendar && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const calendarHeight = 230; // Approximate calendar height
      
      setCalendarPosition({
        top: rect.top + window.scrollY - calendarHeight - 4,
        left: rect.left + window.scrollX
      });
    }
  }, [showCalendar]);


  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };


  const handleDateChange = (formattedDate) => {
    onChange(formattedDate);
    setShowCalendar(false);
  };


  return (
    <div style={{ marginBottom: '0', fontFamily: 'Poppins, sans-serif' }} ref={calendarRef}>
      <label 
        className="form-label fw-semibold text-start d-block" 
        style={{ 
          fontSize: '0.875rem',
          color: '#374151',
          marginBottom: '0.5rem',
          fontFamily: 'Poppins, sans-serif'
        }}
      >
        {label}
        {required && <span style={{ color: '#E01950' }}> *</span>}
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          name={name}
          value={value ? formatDate(value) : ''}
          readOnly
          placeholder={placeholder || "mm/dd/yyyy"}
          onClick={() => setShowCalendar(true)}
          required={required}
          style={{
            width: '100%',
            padding: '0.625rem 2.5rem 0.625rem 0.75rem',
            fontSize: '0.875rem',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            backgroundColor: 'white',
            fontFamily: 'Poppins, sans-serif',
            cursor: 'pointer'
          }}
        />
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setShowCalendar(!showCalendar)}
          style={{
            position: 'absolute',
            right: '0.75rem',
            background: 'transparent',
            border: 'none',
            color: '#27235C',
            cursor: 'pointer',
            padding: '0.375rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(39, 35, 92, 0.1)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Calendar size={18} />
        </button>
      </div>
      {showCalendar && ReactDOM.createPortal(
        <div ref={calendarMenuRef} style={{ position: 'fixed', top: calendarPosition.top, left: calendarPosition.left, zIndex: 99999 }}>
          <CustomCalendar
            value={value}
            onChange={handleDateChange}
            onClose={() => setShowCalendar(false)}
            minDate={min}
          />
        </div>,
        document.body
      )}
    </div>
  );
};


const EditProjectModal = ({
  show,
  onClose,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  message,
  departments,
  businessUnits,
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [show]);


  if (!show) return null;


  const statusOptions = ["Active", "On Hold", "Completed", "Cancelled"];
  const engagementModelOptions = [
    "Fixed Price",
    "Time and Materials",
    "Agile - Scrum",
    "Agile - Kanban",
    "Consulting",
    "Retainer"
  ];
  
  const departmentOptions = departments?.map(dept => ({
    value: dept.departmentName,
    label: dept.departmentName
  })) || [];


  const businessUnitOptions = businessUnits?.map(bu => bu) || [];


  const modalContent = (
    <>
      <style>
        {`
          @keyframes dropdownFadeIn {
            from {
              opacity: 0;
              transform: translateY(-8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes calendarFadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      {/* Backdrop */}
      <div 
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 10000
        }}
        onClick={onClose}
      />


      {/* Modal Container - CENTERED WITH INCREASED SIZE */}
      <div
        style={{ 
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10001,
          width: '980px',
          maxWidth: '92vw',
          maxHeight: '92vh',
          fontFamily: 'Poppins, sans-serif'
        }}
      >
        <div 
          style={{ 
            borderRadius: '12px',
            border: 'none',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'white',
            fontFamily: 'Poppins, sans-serif'
          }}
        >
          {/* Header */}
          <div 
            style={{ 
              backgroundColor: '#3c3862',
              borderBottom: 'none',
              padding: '1.25rem 1.5rem',
              color: 'white',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'Poppins, sans-serif'
            }}
          >
            <h5 style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              margin: 0,
              fontSize: '1.1rem',
              fontWeight: 600,
              color: 'white',
              fontFamily: 'Poppins, sans-serif'
            }}>
              <MessageSquare size={22} style={{ color: 'white' }} />
              <span>Edit Project</span>
            </h5>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0.25rem',
                lineHeight: 1,
                opacity: 0.9
              }}
            >
              <X size={22} />
            </button>
          </div>


          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', fontFamily: 'Poppins, sans-serif' }}>
            <div 
              style={{ 
                padding: '2rem', 
                backgroundColor: '#f8f9fa',
                overflowY: 'auto',
                flex: 1,
                fontFamily: 'Poppins, sans-serif'
              }}
            >
              {message && (
                <div
                  className={`alert alert-${
                    message.type === "success" ? "success" : "danger"
                  } d-flex align-items-center gap-2 mb-4`}
                  style={{
                    borderRadius: '8px',
                    border: 'none',
                    padding: '1rem',
                    fontSize: '0.875rem',
                    backgroundColor: message.type === 'success' 
                      ? 'rgba(36, 161, 72, 0.1)' 
                      : 'rgba(224, 25, 80, 0.1)',
                    color: message.type === 'success' ? '#24A148' : '#E01950',
                    textAlign: 'left',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                >
                  {message.type === "success" ? (
                    <CheckCircle size={18} />
                  ) : (
                    <AlertCircle size={18} />
                  )}
                  <span>{message.text}</span>
                </div>
              )}


              {/* Goal Info Box */}
              <div 
                style={{
                  backgroundColor: 'white',
                  padding: '0.875rem 1rem',
                  borderRadius: '8px',
                  marginBottom: '1.75rem',
                  border: '1px solid #e5e7eb',
                  textAlign: 'left',
                  fontFamily: 'Poppins, sans-serif'
                }}
              >
                <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500, fontFamily: 'Poppins, sans-serif' }}>
                  Project: <span style={{ color: '#374151', fontWeight: 600 }}>{formData.projectName || 'New Project'}</span>
                </span>
              </div>


              <div className="row g-4">
                {/* Row 1: Project Name & Status */}
                <div className="col-md-6">
                  <label 
                    className="form-label fw-semibold text-start d-block" 
                    style={{ 
                      fontSize: '0.875rem',
                      color: '#374151',
                      marginBottom: '0.5rem',
                      fontFamily: 'Poppins, sans-serif'
                    }}
                  >
                    Project Name <span style={{ color: '#E01950' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control text-start"
                    value={formData.projectName || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        projectName: e.target.value,
                      })
                    }
                    placeholder="Enter project name"
                    required
                    style={{ 
                      fontSize: '0.875rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      padding: '0.625rem 0.75rem',
                      backgroundColor: 'white',
                      fontFamily: 'Poppins, sans-serif'
                    }}
                  />
                </div>


                <div className="col-md-6">
                  <CustomDropdown
                    label="Status"
                    value={formData.status}
                    onChange={(value) => setFormData({ ...formData, status: value })}
                    options={statusOptions}
                    required
                    placeholder="Select Status"
                  />
                </div>


                {/* Row 2: Description & Business Unit */}
                <div className="col-md-6">
                  <label 
                    className="form-label fw-semibold text-start d-block" 
                    style={{ 
                      fontSize: '0.875rem',
                      color: '#374151',
                      marginBottom: '0.5rem',
                      fontFamily: 'Poppins, sans-serif'
                    }}
                  >
                    Description
                  </label>
                  <textarea
                    className="form-control text-start"
                    rows="3"
                    value={formData.description || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Enter project description"
                    style={{ 
                      fontSize: '0.875rem', 
                      lineHeight: '1.5',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      padding: '0.625rem 0.75rem',
                      backgroundColor: 'white',
                      fontFamily: 'Poppins, sans-serif'
                    }}
                  />
                </div>


                <div className="col-md-6">
                  <CustomDropdown
                    label="Business Unit"
                    value={formData.businessUnit}
                    onChange={(value) => setFormData({ ...formData, businessUnit: value })}
                    options={businessUnitOptions}
                    required
                    placeholder="Select Business Unit"
                  />
                </div>


                {/* Row 3: Department & Engagement Model */}
                <div className="col-md-6">
                  <CustomDropdown
                    label="Department"
                    value={formData.department}
                    onChange={(value) => setFormData({ ...formData, department: value })}
                    options={departmentOptions}
                    required
                    placeholder="Select Department"
                  />
                </div>


                <div className="col-md-6">
                  <CustomDropdown
                    label="Engagement Model"
                    value={formData.engagementModel}
                    onChange={(value) => setFormData({ ...formData, engagementModel: value })}
                    options={engagementModelOptions}
                    required
                    placeholder="Select Model"
                  />
                </div>


                {/* Row 4: Start Date & End Date */}
                <div className="col-md-6">
                  <DateInput
                    label="Start Date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={(value) => setFormData({ ...formData, startDate: value })}
                    required
                    placeholder="Select start date"
                  />
                </div>


                <div className="col-md-6">
                  <DateInput
                    label="End Date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={(value) => setFormData({ ...formData, endDate: value })}
                    min={formData.startDate}
                    placeholder="Select end date"
                  />
                </div>
              </div>
            </div>


            {/* Footer */}
            <div 
              style={{ 
                padding: '1rem 1.5rem',
                borderTop: '1px solid #e5e7eb',
                backgroundColor: 'white',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                flexShrink: 0,
                fontFamily: 'Poppins, sans-serif'
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                style={{ 
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  padding: '0.625rem 1.25rem',
                  borderRadius: '8px',
                  backgroundColor: '#6b7280',
                  border: 'none',
                  color: 'white',
                  transition: 'all 0.2s ease',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'Poppins, sans-serif'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = '#4b5563';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#6b7280';
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{ 
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  padding: '0.625rem 1.5rem',
                  borderRadius: '8px',
                  background: 'var(--gradient-primary)',
                  border: 'none',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(192, 38, 211, 0.3)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1,
                  fontFamily: 'Poppins, sans-serif'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(192, 38, 211, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(192, 38, 211, 0.3)';
                }}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Update Project
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );


  // Render using React Portal
  return ReactDOM.createPortal(modalContent, document.body);
};


export default EditProjectModal;
