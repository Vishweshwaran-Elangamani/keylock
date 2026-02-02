import { useEffect, useMemo } from "react";
import { useAuth } from "../../../contexts/auth/AuthContext";
import { toast } from "sonner";
import ChangeRequestModal from "../../../components/auth/Modal/common/ChangeRequestModal";
import ProfilePhotoUploadModal from "../../../components/auth/Modal/common/ProfilePhotoUploadModal";
import {GenderDropdown,NationalityDropdown,MaritalStatusDropdown,StateDropdown,}from "../../../components/auth/common/ProfileDropdowns";
import useEmployeeProfile from "../../../hooks/auth/employeeprofile/useEmployeeProfile";
import {getInitials,formatDate,formatAddress,getStatusBadgeClass,} from "../../../utils/auth/employeeprofile/profileHelpers";
import "../../../styles/auth/common/EmployeeProfile.css";
const EmployeeProfile = () => {const { user } = useAuth();const {
    profileData,loading,isEditing,setIsEditing,formData,setFormData,    errors,setErrors,saving,sameAsCurrentAddress,touched,
    setTouched,showChangeRequestModal,setShowChangeRequestModal,hasPendingRequest,pendingRequestId,checkingPending,showPhotoModal,
    setShowPhotoModal,profilePhoto,nationalityOptions,stateOptions,fetchProfileData,handleChange,handleAddressChange,
    handleSameAddressChange,handleSubmit,handleCancel,handleCameraClick,handlePhotoUpdate,handleChangeRequest,handleModalClose,showError,validateField,
  } = useEmployeeProfile();
  const normalizedProfile = useMemo(() => {
    if (!profileData) return null;
    const mapGenderToUI = (g) => {
      if (!g) return "";
      const v = String(g).toLowerCase();
      if (v === "m" || v === "male" || v === "1") return "Male";if (v === "f" || v === "female" || v === "2") return "Female";
      if (v === "o" || v === "other" || v === "3") return "Other";return profileData.gender;     };
    const dobRaw =
      profileData.dateOfBirthOfficial ??
      profileData.dateOfBirth ??
      "";
    const toDateInput = (d) => {
      if (!d) return "";
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return "";
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const dd = String(dt.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };
    return {
      ...profileData,
      gender: mapGenderToUI(profileData.gender),
      dateOfBirthOfficial: toDateInput(dobRaw),
    };
  }, [profileData]);
  useEffect(() => {
    if (!normalizedProfile) return;
    setFormData((prev) => ({
      ...prev,
      firstName: normalizedProfile.firstName ?? "",
      middleName: normalizedProfile.middleName ?? "",
      lastName: normalizedProfile.lastName ?? "",
      callingName: normalizedProfile.callingName ?? "",
      gender: normalizedProfile.gender ?? "",
      dateOfBirthOfficial: normalizedProfile.dateOfBirthOfficial ?? "",
      maritalStatus: normalizedProfile.maritalStatus ?? "",
      nationality: normalizedProfile.nationality ?? "",
      mobileNumber: normalizedProfile.mobileNumber ?? "",
      alternateNumber: normalizedProfile.alternateNumber ?? "",
      personalEmail: normalizedProfile.personalEmail ?? "",
      currentAddress: {
        doorNumber: normalizedProfile.currentAddress?.doorNumber ?? "",
        street: normalizedProfile.currentAddress?.street ?? "",
        landmark: normalizedProfile.currentAddress?.landmark ?? "",
        area: normalizedProfile.currentAddress?.area ?? "",
        city: normalizedProfile.currentAddress?.city ?? "",
        state: normalizedProfile.currentAddress?.state ?? "",
        country: normalizedProfile.currentAddress?.country ?? "India",
        pinCode: normalizedProfile.currentAddress?.pinCode ?? "",
      },
      permanentAddress: {
        doorNumber: normalizedProfile.permanentAddress?.doorNumber ?? "",
        street: normalizedProfile.permanentAddress?.street ?? "",
        landmark: normalizedProfile.permanentAddress?.landmark ?? "",
        area: normalizedProfile.permanentAddress?.area ?? "",
        city: normalizedProfile.permanentAddress?.city ?? "",
        state: normalizedProfile.permanentAddress?.state ?? "",
        country: normalizedProfile.permanentAddress?.country ?? "India",
        pinCode: normalizedProfile.permanentAddress?.pinCode ?? "",
      },
    }));
  }, [normalizedProfile, setFormData]);
  if (loading) {
    return (
      <div className="epda-loading-wrapper">
        <div className="epda-loading-content">
          <div className="epda-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }
  if (!profileData) {
    return (
      <div className="epda-error-wrapper">
        <div className="epda-error-content">
          <i className="bi bi-exclamation-triangle"></i>
          <h3>Profile Not Available</h3>
          <p>Unable to load profile data</p>
          <button className="epda-btn-retry" onClick={fetchProfileData}>
            <i className="bi bi-arrow-clockwise me-2"></i>
            Retry
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="epda-profile-container">
      <div className="epda-profile-header">
        <div className="epda-header-background"></div>
        <div className="epda-header-content">
          <div className="epda-avatar-section">
            <div className="epda-avatar-wrapper">
              <div className="epda-avatar">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="epda-avatar-photo" />
                ) : (
                  <span className="epda-avatar-initials">
                    {getInitials(profileData.firstName, profileData.lastName)}{" "}
                  </span>
                )}
              </div>
              <button
                className="epda-camera-btn"
                onClick={handleCameraClick}
                title="Upload profile photo"
              >
                <i className="bi bi-camera-fill"></i>
              </button>
            </div>
            <div className="epda-basic-info">
              <h1 className="epda-profile-name">
                {profileData.firstName} {profileData.lastName}
              </h1>
              <p className="epda-profile-role">
                {profileData.roleName || "Employee"}
              </p>
              <div className="epda-profile-meta">
                <span className="epda-profile-id">
                  <i className="bi bi-person-badge"></i>
                  {profileData.employeeCompanyId}
                </span>
                <span
                  className={`epda-profile-status ${getStatusBadgeClass(
                    profileData.employmentStatus
                  )}`}
                >
                  <i className="bi bi-circle-fill"></i>
                  {profileData.employmentStatus || "N/A"}
                </span>
              </div>
            </div>
          </div>
          <div className="epda-profile-actions">
            {!isEditing ? (
              <>
                <button
                  className="epda-btn epda-btn-outline-light"
                  onClick={() => setShowChangeRequestModal(true)}
                  disabled={checkingPending}
                >
                  <i className="bi bi-arrow-repeat"></i>
                  {checkingPending ? "Checking..." : " Request Change"}
                </button>
                <button
                  className="epda-btn epda-btn-primary"
                  onClick={() => {
                    setIsEditing(true);
                    toast.info("Edit mode enabled");
                  }}
                >
                  <i className="bi bi-pencil"></i> Edit Profile
                </button>
              </>
            ) : (
              <>
                <button
                  className="epda-btn epda-btn-outline-danger"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <i className="bi bi-x-circle"></i> Cancel
                </button>
                <button
                  className="epda-btn epda-btn-success"
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="epda-spinner-sm"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle"></i>
                      Save Changes
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="epda-profile-content">
        <div className="epda-content-grid">
          <div className="epda-sidebar">
            <div className="epda-info-card">
              <div className="epda-card-header">
                <i className="bi bi-person-circle"></i>
                <h3>Personal Details</h3>
              </div>
              <div className="epda-card-content">
                <div className="epda-info-grid">
                  <div className="epda-info-item">
                    <label>Employee ID</label>
                    <span>{profileData.employeeCompanyId || "N/A"}</span>
                  </div>
                  {profileData.email && (
                    <div className="epda-info-item">
                      <label>Official Email</label>
                      <span>{profileData.email}</span>
                    </div>
                  )}
                  {profileData.dateOfBirthOfficial && (
                    <div className="epda-info-item">
                      <label>Date of Birth</label>
                      <span>{formatDate(profileData.dateOfBirthOfficial)}</span>
                    </div>
                  )}
                  {profileData.dateOfBirthOfficial && (
                    <div className="epda-info-item">
                      <label>Age</label>
                      <span>
                        {(() => {
                          const dob = new Date(profileData.dateOfBirthOfficial);
                          if (Number.isNaN(dob.getTime())) return "N/A";
                          const diff = new Date().getTime() - dob.getTime();
                          const years = Math.floor(
                            diff / (365.25 * 24 * 60 * 60 * 1000)
                          );
                          return `${years} years`;
                        })()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="epda-info-card">
              <div className="epda-card-header">
                <i className="bi bi-briefcase"></i>
                <h3>Employment Details</h3>
              </div>
              <div className="epda-card-content">
                <div className="epda-info-grid">
                  {profileData.roleName && (
                    <div className="epda-info-item">
                      <label>Role</label>
                      <span>{profileData.roleName}</span>
                    </div>
                  )}
                  {profileData.departmentName && (
                    <div className="epda-info-item"> <label>Department</label> <span>{profileData.departmentName}</span> </div> )}
                  {profileData.employmentStatus && (
                    <div className="epda-info-item"> <label>Employment Status</label> <span>{profileData.employmentStatus}</span> </div> )}
                  {profileData.joiningDate && (
                    <div className="epda-info-item"> <label>Date of Joining</label> <span>{formatDate(profileData.joiningDate)}</span> </div> )}
                </div>
              </div>
            </div>
            {!isEditing && (
              <div className="epda-info-card">
                <div className="epda-card-header"> <i className="bi bi-geo-alt"></i> <h3>Address</h3> </div>
                <div className="epda-card-content"> <div className="epda-info-grid"> {profileData.currentAddress && (<div className="epda-info-item">
                        <label>Current Address</label> <span> {formatAddress(profileData.currentAddress) ||"Not provided"}</span> </div> )}
                    {profileData.permanentAddress && (
                      <div className="epda-info-item">
                        <label>Permanent Address</label>
                        <span>
                          {formatAddress(profileData.permanentAddress) ||
                            "Not provided"}
                        </span>
                      </div>
                    )}
                    {!profileData.currentAddress &&
                      !profileData.permanentAddress && (
                        <div className="epda-info-item">
                          <span style={{ color: "#6c757d", fontStyle: "italic" }}>
                            No address information available
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="epda-main-section">
            <div className="epda-form-card">
              <div className="epda-card-header">
                <i className="bi bi-person-lines-fill"></i>
                <h3>Personal Information</h3>
              </div>
              <div className="epda-card-content">
                <form>
                  <div className="epda-form-grid">
                    <div className="epda-form-field">
                      <label>
                        {" "}
                        First Name <span className="epda-required">*</span>{" "}
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName || ""}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`epda-form-control ${
                          showError("firstName") ? "epda-error" : ""
                        }`}
                        placeholder="Enter first name"
                      />
                      {showError("firstName") && (
                        <span className="epda-error-message">
                          {errors.firstName}
                        </span>
                      )}
                    </div>
                    <div className="epda-form-field">
                      <label>Middle Name</label>
                      <input
                        type="text"
                        name="middleName"
                        value={formData.middleName || ""}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`epda-form-control ${
                          showError("middleName") ? "epda-error" : ""
                        }`}
                        placeholder="Enter middle name"
                      />
                      {showError("middleName") && (
                        <span className="epda-error-message">
                          {errors.middleName}
                        </span>
                      )}
                    </div>
                    <div className="epda-form-field">
                      <label>
                        {" "}
                        Last Name <span className="epda-required">*</span>{" "}
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName || ""}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`epda-form-control ${
                          showError("lastName") ? "epda-error" : ""
                        }`}
                        placeholder="Enter last name"
                      />
                      {showError("lastName") && (
                        <span className="epda-error-message">
                          {errors.lastName}
                        </span>
                      )}
                    </div>
                    <div className="epda-form-field">
                      <label>
                        {" "}
                        Calling Name <span className="epda-required">*</span>{" "}
                      </label>
                      <input
                        type="text"
                        name="callingName"
                        value={formData.callingName || ""}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`epda-form-control ${
                          showError("callingName") ? "epda-error" : ""
                        }`}
                        placeholder="Enter calling name"
                      />
                      {showError("callingName") && (
                        <span className="epda-error-message">
                          {errors.callingName}
                        </span>
                      )}
                    </div>
                    <div className="epda-form-field">
                      <label>
                        {" "}
                        Gender <span className="epda-required">*</span>{" "}
                      </label>
                      <GenderDropdown
                        value={formData.gender || ""}
                        onChange={(val) => {
                          setFormData((prev) => ({ ...prev, gender: val }));
                          setTouched((prev) => ({ ...prev, gender: true }));
                          const error = validateField("gender", val);
                          setErrors((prev) => ({ ...prev, gender: error }));
                        }}
                        disabled={!isEditing}
                        showError={showError("gender")}
                      />
                      {showError("gender") && (
                        <span className="epda-error-message">
                          {errors.gender}
                        </span>
                      )}
                    </div>
                    <div className="epda-form-field">
                      <label>
                        {" "}
                        Date of Birth <span className="epda-required">*</span>{" "}
                      </label>
                      <input
                        type="date"
                        name="dateOfBirthOfficial"
                        value={formData.dateOfBirthOfficial || ""}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`epda-form-control ${
                          showError("dateOfBirthOfficial") ? "epda-error" : ""
                        }`}
                        max={new Date().toISOString().split("T")[0]}
                      />
                      {showError("dateOfBirthOfficial") && (
                        <span className="epda-error-message">
                          {errors.dateOfBirthOfficial}
                        </span>
                      )}
                    </div>
                    <div className="epda-form-field">
                      <label>
                        {" "}
                        Marital Status <span className="epda-required">*</span>{" "}
                      </label>
                      <MaritalStatusDropdown
                        value={formData.maritalStatus || ""}
                        onChange={(val) => {
                          setFormData((prev) => ({
                            ...prev,
                            maritalStatus: val,
                          }));
                          setTouched((prev) => ({
                            ...prev,
                            maritalStatus: true,
                          }));
                          const error = validateField("maritalStatus", val);
                          setErrors((prev) => ({
                            ...prev,
                            maritalStatus: error,
                          }));
                        }}
                        disabled={!isEditing}
                        showError={showError("maritalStatus")}
                      />
                      {showError("maritalStatus") && (
                        <span className="epda-error-message">
                          {errors.maritalStatus}
                        </span>
                      )}
                    </div>
                    <div className="epda-form-field">
                      <label>
                        {" "}
                        Nationality <span className="epda-required">*</span>{" "}
                      </label>
                      <NationalityDropdown
                        value={formData.nationality || ""}
                        onChange={(val) => {
                          setFormData((prev) => ({
                            ...prev,
                            nationality: val,
                          }));
                          setTouched((prev) => ({
                            ...prev,
                            nationality: true,
                          }));
                          const error = validateField("nationality", val);
                          setErrors((prev) => ({
                            ...prev,
                            nationality: error,
                          }));
                        }}
                        disabled={!isEditing}
                        showError={showError("nationality")}
                        options={nationalityOptions}
                      />
                      {showError("nationality") && (
                        <span className="epda-error-message">
                          {errors.nationality}
                        </span>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div className="epda-form-card">
              <div className="epda-card-header">
                <i className="bi bi-telephone"></i>
                <h3>Contact Information</h3>
              </div>
              <div className="epda-card-content">
                <form>
                  <div className="epda-form-grid">
                    <div className="epda-form-field">
                      <label>
                        {" "}
                        Mobile Number <span className="epda-required">*</span>{" "}
                      </label>
                      <input
                        type="tel"
                        name="mobileNumber"
                        value={formData.mobileNumber || ""}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`epda-form-control ${
                          showError("mobileNumber") ? "epda-error" : ""
                        }`}
                        placeholder="Enter mobile number"
                        maxLength={10}
                      />
                      {showError("mobileNumber") && (
                        <span className="epda-error-message">
                          {errors.mobileNumber}
                        </span>
                      )}
                    </div>
                    <div className="epda-form-field">
                      <label>
                        {" "}
                        Alternate Number <span className="epda-required">*</span>{" "}
                      </label>
                      <input
                        type="tel"
                        name="alternateNumber"
                        value={formData.alternateNumber || ""}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`epda-form-control ${
                          showError("alternateNumber") ? "epda-error" : ""
                        }`}
                        placeholder="Enter alternate number"
                        maxLength={10}
                      />
                      {showError("alternateNumber") && (
                        <span className="epda-error-message">
                          {errors.alternateNumber}
                        </span>
                      )}
                    </div>
                    <div className="epda-form-field">
                      <label>
                        {" "}
                        Personal Email <span className="epda-required">*</span>{" "}
                      </label>
                      <input
                        type="email"
                        name="personalEmail"
                        value={formData.personalEmail || ""}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`epda-form-control ${
                          showError("personalEmail") ? "epda-error" : ""
                        }`}
                        placeholder="yourname@gmail.com"
                      />
                      {showError("personalEmail") && (
                        <span className="epda-error-message">
                          {errors.personalEmail}
                        </span>
                      )}
                      <small>Must be a Gmail account</small>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            {isEditing && (
              <div className="epda-form-card">
                <div className="epda-card-header">
                  <i className="bi bi-geo-alt-fill"></i>
                  <h3>Address Information</h3>
                </div>
                <div className="epda-card-content">
                  <div className="epda-address-section">
                    <h4 className="epda-section-title">
                      <i className="bi bi-house-door"></i>
                      Current Address
                    </h4>
                    <div className="epda-form-grid epda-address-grid">
                      <div className="epda-form-field">
                        <label>
                          Door Number <span className="epda-required">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.currentAddress?.doorNumber || ""}
                          onChange={(e) =>
                            handleAddressChange(
                              "currentAddress",
                              "doorNumber",
                              e.target.value
                            )
                          }
                          className={`epda-form-control ${
                            showError("currentAddress.doorNumber")
                              ? "epda-error"
                              : ""
                          }`}
                          placeholder="Enter door number"
                        />
                        {showError("currentAddress.doorNumber") && (
                          <span className="epda-error-message">
                            {errors["currentAddress.doorNumber"]}
                          </span>
                        )}
                      </div>
                      <div className="epda-form-field">
                        <label>
                          Street <span className="epda-required">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.currentAddress?.street || ""}
                          onChange={(e) =>
                            handleAddressChange(
                              "currentAddress",
                              "street",
                              e.target.value
                            )
                          }
                          className={`epda-form-control ${
                            showError("currentAddress.street")
                              ? "epda-error"
                              : ""
                          }`}
                          placeholder="Enter street"
                        />
                        {showError("currentAddress.street") && (
                          <span className="epda-error-message">
                            {errors["currentAddress.street"]}
                          </span>
                        )}
                      </div>
                      <div className="epda-form-field">
                        <label>
                          Landmark <span className="epda-required">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.currentAddress?.landmark || ""}
                          onChange={(e) =>
                            handleAddressChange(
                              "currentAddress",
                              "landmark",
                              e.target.value
                            )
                          }
                          className={`epda-form-control ${
                            showError("currentAddress.landmark")
                              ? "epda-error"
                              : ""
                          }`}
                          placeholder="Enter landmark"
                        />
                        {showError("currentAddress.landmark") && (
                          <span className="epda-error-message">
                            {errors["currentAddress.landmark"]}
                          </span>
                        )}
                      </div>
                      <div className="epda-form-field">
                        <label> Area <span className="epda-required">*</span> </label>
                        <input
                          type="text"
                          value={formData.currentAddress?.area || ""}
                          onChange={(e) =>
                            handleAddressChange(
                              "currentAddress",
                              "area",
                              e.target.value
                            )
                          }
                          className={`epda-form-control ${
                            showError("currentAddress.area") ? "epda-error" : ""
                          }`}
                          placeholder="Enter area"
                        />
                        {showError("currentAddress.area") && (
                          <span className="epda-error-message">
                            {errors["currentAddress.area"]}
                          </span>
                        )}
                      </div>
                      <div className="epda-form-field">
                        <label> City <span className="epda-required">*</span> </label>
                        <input
                          type="text"
                          value={formData.currentAddress?.city || ""}
                          onChange={(e) =>
                            handleAddressChange( "currentAddress","city",e.target.value )}
                          className={`epda-form-control ${ showError("currentAddress.city") ? "epda-error" : ""
                          }`}
                          placeholder="Enter city"
                        />
                        {showError("currentAddress.city") && (
                          <span className="epda-error-message">
                            {errors["currentAddress.city"]}
                          </span>
                        )}
                      </div>
                      <div className="epda-form-field">
                        <label> State <span className="epda-required">*</span> </label>
                        <StateDropdown
                          value={formData.currentAddress?.state || ""}
                          onChange={(val) =>handleAddressChange("currentAddress", "state", val)}
                          disabled={false} showError={showError("currentAddress.state")} options={stateOptions}/>
                        {showError("currentAddress.state") && (
                          <span className="epda-error-message">{errors["currentAddress.state"]}</span>)}
                      </div>
                      <div className="epda-form-field">
                        <label> Country <span className="epda-required">*</span> </label>
                        <input type="text" value={formData.currentAddress?.country || "India"} onChange={(e) =>
                            handleAddressChange(
                              "currentAddress",
                              "country",
                              e.target.value
                            )
                          }
                          className={`epda-form-control ${
                            showError("currentAddress.country")
                              ? "epda-error"
                              : ""
                          }`}
                          placeholder="Enter country"
                        />
                        {showError("currentAddress.country") && (
                          <span className="epda-error-message">
                            {errors["currentAddress.country"]}
                          </span>
                        )}
                      </div>
                      <div className="epda-form-field">
                        <label>PIN Code <span className="epda-required">*</span> </label>
                        <input
                          type="text"
                          value={formData.currentAddress?.pinCode || ""}
                          onChange={(e) =>
                            handleAddressChange(
                              "currentAddress",
                              "pinCode",
                              e.target.value
                            )
                          }
                          className={`epda-form-control ${
                            showError("currentAddress.pinCode")
                              ? "epda-error"
                              : ""
                          }`}
                          placeholder="Enter PIN code"
                          maxLength={6}
                        />
                        {showError("currentAddress.pinCode") && (
                          <span className="epda-error-message">
                            {errors["currentAddress.pinCode"]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="epda-address-checkbox">
                    <label className="epda-checkbox-label">
                      <input type="checkbox" checked={sameAsCurrentAddress} onChange={handleSameAddressChange} />
                      <span className="epda-checkmark"></span> Permanent address is same as current address
                    </label>
                  </div>
                  <div className="epda-address-section">
                    <h4 className="epda-section-title"> <i className="bi bi-house"></i> Permanent Address </h4>
                    {sameAsCurrentAddress && (
                      <div className="epda-address-auto-filled"><i className="bi bi-info-circle-fill"></i> <span>
                          Permanent address will automatically sync with current address </span>
                      </div>)}
                    <div className="epda-form-grid epda-address-grid">
                      <div className="epda-form-field">
                        <label>Door Number <span className="epda-required">*</span> </label>
                        <input type="text" value={formData.permanentAddress?.doorNumber || ""}
                          onChange={(e) => handleAddressChange( "permanentAddress","doorNumber", e.target.value ) }
                          disabled={sameAsCurrentAddress}
                          className={`epda-form-control ${
                            showError("permanentAddress.doorNumber")
                              ? "epda-error"
                              : ""
                          }`}
                          placeholder="Enter door number"
                        />
                        {showError("permanentAddress.doorNumber") && (
                          <span className="epda-error-message">
                            {errors["permanentAddress.doorNumber"]}
                          </span>
                        )}
                      </div>
                      <div className="epda-form-field">
                        <label>
                          Street <span className="epda-required">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.permanentAddress?.street || ""}
                          onChange={(e) =>
                            handleAddressChange(
                              "permanentAddress",
                              "street",
                              e.target.value
                            )
                          }
                          disabled={sameAsCurrentAddress}
                          className={`epda-form-control ${
                            showError("permanentAddress.street")
                              ? "epda-error"
                              : ""
                          }`}
                          placeholder="Enter street"
                        />
                        {showError("permanentAddress.street") && (
                          <span className="epda-error-message">
                            {errors["permanentAddress.street"]}
                          </span>
                        )}
                      </div>
                      <div className="epda-form-field">
                        <label>
                          Landmark <span className="epda-required">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.permanentAddress?.landmark || ""}
                          onChange={(e) =>
                            handleAddressChange(
                              "permanentAddress",
                              "landmark",
                              e.target.value
                            )
                          }
                          disabled={sameAsCurrentAddress}
                          className={`epda-form-control ${
                            showError("permanentAddress.landmark")
                              ? "epda-error"
                              : ""
                          }`}
                          placeholder="Enter landmark"
                        />
                        {showError("permanentAddress.landmark") && (
                          <span className="epda-error-message">
                            {errors["permanentAddress.landmark"]}
                          </span>
                        )}
                      </div>
                      <div className="epda-form-field">
                        <label>
                          Area <span className="epda-required">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.permanentAddress?.area || ""}
                          onChange={(e) =>
                            handleAddressChange(
                              "permanentAddress",
                              "area",
                              e.target.value
                            )
                          }
                          disabled={sameAsCurrentAddress}
                          className={`epda-form-control ${
                            showError("permanentAddress.area")
                              ? "epda-error"
                              : ""
                          }`}
                          placeholder="Enter area"
                        />
                        {showError("permanentAddress.area") && (
                          <span className="epda-error-message">
                            {errors["permanentAddress.area"]}
                          </span>
                        )}
                      </div>
                      <div className="epda-form-field">
                        <label>
                          City <span className="epda-required">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.permanentAddress?.city || ""}
                          onChange={(e) =>
                            handleAddressChange(
                              "permanentAddress",
                              "city",
                              e.target.value
                            )
                          }
                          disabled={sameAsCurrentAddress}
                          className={`epda-form-control ${
                            showError("permanentAddress.city")
                              ? "epda-error"
                              : ""
                          }`}
                          placeholder="Enter city"
                        />
                        {showError("permanentAddress.city") && (
                          <span className="epda-error-message">
                            {errors["permanentAddress.city"]}
                          </span>
                        )}
                      </div>
                      <div className="epda-form-field">
                        <label>
                          State <span className="epda-required">*</span>
                        </label>
                        <StateDropdown
                          value={formData.permanentAddress?.state || ""}
                          onChange={(val) =>
                            handleAddressChange("permanentAddress", "state", val)
                          }
                          disabled={sameAsCurrentAddress}
                          showError={showError("permanentAddress.state")}
                          options={stateOptions}
                        />
                        {showError("permanentAddress.state") && (
                          <span className="epda-error-message">
                            {errors["permanentAddress.state"]}
                          </span>
                        )}
                      </div>
                      <div className="epda-form-field">
                        <label>
                          Country <span className="epda-required">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.permanentAddress?.country || "India"}
                          onChange={(e) =>
                            handleAddressChange(
                              "permanentAddress",
                              "country",
                              e.target.value
                            )
                          }
                          disabled={sameAsCurrentAddress}
                          className={`epda-form-control ${
                            showError("permanentAddress.country")
                              ? "epda-error"
                              : ""
                          }`}
                          placeholder="Enter country"
                        />
                        {showError("permanentAddress.country") && (
                          <span className="epda-error-message">
                            {errors["permanentAddress.country"]}
                          </span>
                        )}
                      </div>
                      <div className="epda-form-field">
                        <label>
                          PIN Code <span className="epda-required">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.permanentAddress?.pinCode || ""}
                          onChange={(e) =>
                            handleAddressChange(
                              "permanentAddress",
                              "pinCode",
                              e.target.value
                            )
                          }
                          disabled={sameAsCurrentAddress}
                          className={`epda-form-control ${
                            showError("permanentAddress.pinCode")
                              ? "epda-error"
                              : ""
                          }`}
                          placeholder="Enter PIN code"
                          maxLength={6}
                        />
                        {showError("permanentAddress.pinCode") && (
                          <span className="epda-error-message">
                            {errors["permanentAddress.pinCode"]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      {showChangeRequestModal && (
        <ChangeRequestModal show={showChangeRequestModal} onClose={handleModalClose} onSubmit={handleChangeRequest}
          hasPendingRequest={hasPendingRequest}pendingRequestId={pendingRequestId} profileData={profileData}/>
      )}
      {showPhotoModal && (
        <ProfilePhotoUploadModal show={showPhotoModal} onClose={() => setShowPhotoModal(false)} onPhotoUpdate={handlePhotoUpdate} currentPhoto={profilePhoto}
        />
      )}
    </div>
  );
};
export default EmployeeProfile;
