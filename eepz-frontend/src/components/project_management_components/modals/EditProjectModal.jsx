import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import {
  Edit,CheckCircle,AlertCircle,X,MessageSquare,ChevronDown,Calendar,ChevronLeft,ChevronRight,
} from "lucide-react";
import "../../../styles/projectmanagement/modals/EditProjectModal.css";

const PRIMARY = "#27235C";
const CustomCalendar = ({ value, onChange, onClose, minDate }) => {
  const [currentDate, setCurrentDate] = useState(
    value ? new Date(value + "T00:00:00") : new Date()
  );
  const [selectedDate, setSelectedDate] = useState(
    value ? new Date(value + "T00:00:00") : null
  );

  const monthNames = ["January", "February","March","April","May","June","July","August","September","October","November","December",];
  const daysInMonth = (date) =>new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const firstDayOfMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const handleDateClick = (day) => {
    const selected = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    const year = selected.getFullYear();
    const month = String(selected.getMonth() + 1).padStart(2, "0");
    const dayStr = String(selected.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${dayStr}`;

    if (minDate) {
      const minDateObj = new Date(minDate + "T00:00:00");
      if (selected < minDateObj) { return;}
    }
    setSelectedDate(selected);
    onChange(formattedDate);
    onClose();
  };

  const handleToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
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
    const minDateObj = minDate ? new Date(minDate + "T00:00:00") : null;

    const prevMonthDays = daysInMonth(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(
        <div key={`prev-${i}`} className="epm-cal-day epm-cal-day--outside">
          {prevMonthDays - i}
        </div>
      );
    }

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(currentDate.getFullYear(),currentDate.getMonth(),day);
      date.setHours(0, 0, 0, 0);
      const isToday = date.getTime() === today.getTime();
      const isSelected = selectedDate && date.getTime() === selectedDate.getTime();
      const isDisabled = minDateObj && date < minDateObj;

      const classNames = [
        "epm-cal-day", isToday && "epm-cal-day--today",  isSelected && "epm-cal-day--selected",isDisabled && "epm-cal-day--disabled",]
        .filter(Boolean) .join(" "); days.push(
        <div key={day}  className={classNames}  onClick={() => !isDisabled && handleDateClick(day)}> {day} </div>
      );
    }
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push(<div key={`next-${day}`} className="epm-cal-day epm-cal-day--outside">  {day}</div>
      );
    }
    return days;
  };

  return (
    <div className="epm-cal-root">
      <div className="epm-cal-header">
        <button type="button" className="epm-cal-nav-btn"onClick={handlePrevMonth}> <ChevronLeft size={14} /></button>
        <span className="epm-cal-month">  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
        <button type="button" className="epm-cal-nav-btn" onClick={handleNextMonth}>  <ChevronRight size={14} /></button>
      </div>
      <div className="epm-cal-weekdays">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="epm-cal-weekday"> {d} </div>
        ))}
      </div>
      <div className="epm-cal-grid">{renderCalendarDays()}</div>
      <button type="button" className="epm-cal-today-btn" onClick={handleToday}> Today</button>
    </div>
  );
};

const CustomDropdown = ({
  label,value,onChange,options,required,placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,left: 0,width: 0,});
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => { const handleClickOutside = (event) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target) && menuRef.current && !menuRef.current.contains(event.target)
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
      setDropdownPosition({top: rect.bottom + window.scrollY,left: rect.left + window.scrollX,width: rect.width,});
    }
  }, [isOpen]);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const getDisplayValue = () => {
    if (!value) return placeholder || "Select";
    const option = options.find((opt) => (opt.value || opt) === value);
    return option ? option.label || option : value;
  };

  return (
    <div className="epm-dd-wrapper" ref={dropdownRef}>
      <label className="epm-label">{label} {required && <span className="epm-label-required">*</span>}</label>
      <div className="epm-dd-inner">
        <button type="button" ref={buttonRef} className={`epm-dd-button ${isOpen ? "epm-dd-button--open" : ""}`}onClick={() => setIsOpen(!isOpen)}>
          <span className={`epm-dd-value ${value ? "epm-dd-value--filled" : "epm-dd-value--placeholder" }`}>
            {getDisplayValue()}  </span> <ChevronDown  size={16} className={`epm-dd-chevron ${isOpen ? "epm-dd-chevron--open" : ""}`}/></button>
        {isOpen &&  ReactDOM.createPortal(
            <ul ref={menuRef} className="epm-dd-menu"  style={{top: dropdownPosition.top,left: dropdownPosition.left,width: dropdownPosition.width,}} >
              {options.map((opt, idx) => {
                const optValue = opt.value || opt;
                const optLabel = opt.label || opt;
                const selected = value === optValue;
                return (
                  <li key={idx} className={`epm-dd-item ${selected ? "epm-dd-item--selected" : "" }`}nonClick={() => handleSelect(optValue)}> {optLabel}</li>
                ); })}
            </ul>, document.body)}
      </div>
    </div>
  );};

  const DateInput = ({
  label,name,value,onChange,error,required,min,placeholder,}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(null);
  const [calendarYear, setCalendarYear] = useState(null);
  const [calendarPosition, setCalendarPosition] = useState({top: 0,left: 0});
  const calendarRef = useRef(null);
  const buttonRef = useRef(null);
  const calendarMenuRef = useRef(null);
  const monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December",];
  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        calendarRef.current &&!calendarRef.current.contains(event.target) && calendarMenuRef.current &&!calendarMenuRef.current.contains(event.target)
      ) {
        setShowCalendar(false);
      }};

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showCalendar && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const calendarHeight = 260;
      setCalendarPosition({
        top: rect.top + window.scrollY - calendarHeight - 4,left: rect.left + window.scrollX,
      }); }}, [showCalendar]);

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "";
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const openCalendar = () => {
    const base = value ? new Date(value) : new Date();
    setCalendarMonth(base.getMonth());
    setCalendarYear(base.getFullYear());
    setShowCalendar(true);
  };

  const getCalendarMatrix = () => {
    const today = new Date();
    const month = calendarMonth ?? today.getMonth();
    const year = calendarYear ?? today.getFullYear();
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells = [];
    for (let i = startDay - 1; i >= 0; i--) {
      cells.push({ day: prevMonthDays - i, current: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, current: true });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: cells.length, current: false });
    }
    return { cells, month, year };
  };

  const handleSelectCalendarDay = (day, current) => {
    if (!current) return;
    const month = calendarMonth;
    const year = calendarYear;
    const selected = new Date(year, month, day);

    if (min) {
      const minDateObj = new Date(min);
      if (selected < minDateObj) return;
    }
    const yyyy = selected.getFullYear();
    const mm = String(selected.getMonth() + 1).padStart(2, "0");
    const dd = String(selected.getDate()).padStart(2, "0");
    onChange(`${yyyy}-${mm}-${dd}`);
    setShowCalendar(false);
  };

  const goPrevMonth = () => {
    if (calendarMonth === null || calendarYear === null) return;
    let m = calendarMonth - 1;
    let y = calendarYear;
    if (m < 0) {m = 11;y -= 1;
    }
    setCalendarMonth(m);
    setCalendarYear(y);
  };

  const goNextMonth = () => {
    if (calendarMonth === null || calendarYear === null) return;
    let m = calendarMonth + 1;
    let y = calendarYear;
    if (m > 11) {  m = 0; y += 1;}
    setCalendarMonth(m);
    setCalendarYear(y);
  };

  const goToday = () => {
    const today = new Date();
    setCalendarMonth(today.getMonth());
    setCalendarYear(today.getFullYear());
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    onChange(`${yyyy}-${mm}-${dd}`);
    setShowCalendar(false);
  };

  const { cells, month, year } = getCalendarMatrix();
  const today = new Date();
  const selectedDate = value ? new Date(value) : null;

  return (
    <div className="epm-date-wrapper" ref={calendarRef}>
      <label className="epm-label">
        {label} {required && <span className="epm-label-required">*</span>}
      </label>
      <div className="epm-date-input-wrapper">
        <input type="text" name={name} value={value ? formatDateForInput(value) : ""} readOnly
          placeholder={placeholder || "mm/dd/yyyy"} onClick={openCalendar} required={required} className="epm-date-input"/>
        <button ref={buttonRef} type="button" className="epm-date-icon-btn" onClick={() =>
            showCalendar ? setShowCalendar(false) : openCalendar() }>
        <Calendar size={18} />
        </button>
      </div>
      {showCalendar &&
        ReactDOM.createPortal(
          <div ref={calendarMenuRef} className="epm-date-popup" style={{ top: calendarPosition.top, left: calendarPosition.left,}}>
            <div className="epm-date-popup-inner">
              <div className="epm-date-header">
                <button type="button" className="epm-date-nav-btn"onClick={goPrevMonth}> 
                <ChevronLeft size={16} />
                </button>
                <span className="epm-date-month">
                  {monthNames[month]} {year}
                </span>
                <button type="button" className="epm-date-nav-btn"onClick={goNextMonth}>
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="epm-date-weekdays">
                {weekdays.map((w) => (
                  <div key={w} className="epm-date-weekday">
                    {w}
                  </div>
                ))}
              </div>
              <div className="epm-date-grid">
                {cells.map((c, idx) => {
                  const cellDate = new Date(year, month, c.day);
                  const isToday = c.current && cellDate.getDate() === today.getDate() && cellDate.getMonth() === today.getMonth() && cellDate.getFullYear() === today.getFullYear();
                  const isSelected = selectedDate &&c.current &&cellDate.getDate() === selectedDate.getDate() &&cellDate.getMonth() === selectedDate.getMonth() &&
                  cellDate.getFullYear() === selectedDate.getFullYear();
                  const classes = ["epm-date-cell", !c.current && "epm-date-cell--outside",isToday && "epm-date-cell--today",isSelected && "epm-date-cell--selected", ];
                  if (min && c.current) {
                    const minDateObj = new Date(min);
                    const compareDate = new Date(year, month, c.day);
                    if (compareDate < minDateObj) {
                      classes.push("epm-date-cell--disabled");
                    }}
                  return (
                    <div  key={idx} className={classes.filter(Boolean).join(" ")} onClick={() => handleSelectCalendarDay(c.day, c.current)} >{c.day}</div>
                  );})}
              </div>
              <div className="epm-date-footer">
                <button type="button"className="epm-date-today-btn" onClick={goToday}>Today</button>
              </div>
            </div>
          </div>,
          document.body
        )}
      {error && <div className="epm-field-error">{error}</div>}
    </div>
  );
};

const EditProjectModal = ({show,onClose,formData,setFormData,onSubmit,isSubmitting,message,departments,businessUnits,}
) => { useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [show]);

  if (!show) return null;
const statusOptions = ["Active", "On Hold", "Completed", "Cancelled"];
const engagementModelOptions = ["Fixed Price","Time and Materials","Agile - Scrum","Agile - Kanban","Consulting","Retainer",];
const departmentOptions = departments?.map((dept) => ({value: dept.departmentName,label: dept.departmentName,})) || [];
const businessUnitOptions = businessUnits?.map((bu) => bu) || [];
const modalContent = (<>

    <div className="epm-overlay" onClick={onClose} />
      <div className="epm-modal-shell">
        <div className="epm-modal-card">
          <div className="epm-modal-header">
            <h5 className="epm-modal-title"> <MessageSquare size={22} /> <span>Edit Project</span></h5>
            <button type="button" onClick={onClose} aria-label="Close"className="epm-modal-close">
              <X size={22} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="epm-form">
            <div className="epm-body">
              {message && (
                <div className={`epm-alert ${ message.type === "success" ? "epm-alert--success" : "epm-alert--error"}`}>
                  {message.type === "success" ? (
                    <CheckCircle size={18} />
                  ) : (
                    <AlertCircle size={18} />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              <div className="epm-summary">
                <span className="epm-summary-text">
                  Project:{" "}
                  <span className="epm-summary-name">{formData.projectName || "New Project"}
                  </span>
                </span>
              </div>

              <div className="epm-grid">
                <div className="epm-col">
                  <label className="epm-label">
                    Project Name
                    <span className="epm-label-required">*</span>
                  </label>
                  <input type="text" className="epm-input"value={formData.projectName || ""}onChange={(e) =>
                  setFormData({...formData,projectName: e.target.value, }) }placeholder="Enter project name"required/>
                </div>

                <div className="epm-col">
                  <CustomDropdown label="Status" value={formData.status}onChange={(value) =>  setFormData({ ...formData, status: value }) }
                    options={statusOptions} required placeholder="Select Status"/>
                </div>

                <div className="epm-col">
                  <label className="epm-label">Description</label>
                  <textarea className="epm-textarea epm-textarea--half" rows="3" value={formData.description || ""}onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value,})} 
                placeholder="Enter project description"/>
                </div>

                <div className="epm-col">
                  <CustomDropdown label="Business Unit" value={formData.businessUnit} onChange={(value) =>
                      setFormData({...formData,businessUnit: value,})
                    }options={businessUnitOptions} required placeholder="Select Business Unit" />
                </div>

                <div className="epm-col">
                  <CustomDropdown label="Department"value={formData.department}onChange={(value) =>
                      setFormData({...formData,department: value,})}
                      options={departmentOptions} requiredplaceholder="Select Department"/>
                </div>

                <div className="epm-col">
                  <CustomDropdown label="Engagement Model"value={formData.engagementModel}onChange={(value) =>
                      setFormData({...formData,engagementModel: value,})
                    } options={engagementModelOptions}requiredplaceholder="Select Model" />
                </div>
                <div className="epm-col">
                  <DateInput label="Start Date" name="startDate" value={formData.startDate} onChange={(value) =>
                      setFormData({...formData,startDate: value,})} required placeholder="Select start date"/>
                </div>

                <div className="epm-col">
                  <DateInput label="End Date" name="endDate" value={formData.endDate} onChange={(value) =>
                    setFormData({ ...formData, endDate: value, })} min={formData.startDate} placeholder="Select end date"/>
                </div>
              </div>
            </div>

            <div className="epm-footer">
              <button type="button" onClick={onClose} disabled={isSubmitting} className="epm-btn epm-btn--secondary"> Cancel</button>
              <button type="submit" disabled={isSubmitting} className="epm-btn epm-btn--primary">
                {isSubmitting ? (<> <span className="epm-inline-spinner" /> Updating...</>
                ) : (
                  <>
                    <CheckCircle size={16} />Update Project
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};
export default EditProjectModal;
