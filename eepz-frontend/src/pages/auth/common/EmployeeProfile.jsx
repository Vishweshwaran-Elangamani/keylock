import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/auth/AuthContext";
import EmployeeProfileService from "../../../services/auth/EmployeeProfileService";
import ChangeRequestService from "../../../services/auth/changeRequestService";
import ChangeRequestModal from "../../../components/auth/Modal/common/ChangeRequestModal";
import ProfilePhotoUploadModal from "../../../components/auth/Modal/common/ProfilePhotoUploadModal";
import { toast } from "sonner";
import "../../../styles/auth/common/EmployeeProfile.css";
const GenderDropdown = ({ value, onChange, disabled, showError }) => {
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
const NationalityDropdown = ({
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
const MaritalStatusDropdown = ({ value, onChange, disabled, showError }) => {
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
const StateDropdown = ({ value, onChange, disabled, showError, options }) => {
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
/**
 * EmployeeProfile Component
 * Displays and manages employee profile information with modern UI
 * Supports profile editing and change requests for restricted fields
 */
const EmployeeProfile = () => {
  // Get current user from auth context
  const { user } = useAuth();
  // State management
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [sameAsCurrentAddress, setSameAsCurrentAddress] = useState(false);
  const [touched, setTouched] = useState({});
  const [showChangeRequestModal, setShowChangeRequestModal] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [pendingRequestId, setPendingRequestId] = useState(null);
  const [checkingPending, setCheckingPending] = useState(false);
  // Profile photo states
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  // Nationality dropdown options
  const nationalityOptions = [
    "Indian",
    "American",
    "British",
    "Canadian",
    "Australian",
    "German",
    "French",
    "Italian",
    "Spanish",
    "Chinese",
    "Japanese",
    "Korean",
    "Other",
  ];
  // Indian states dropdown options
  const stateOptions = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Delhi",
    "Puducherry",
    "Other",
  ];
  /**
   * Fetch profile data and check pending requests on mount
   */
  useEffect(() => {
    fetchProfileData();
    checkPendingRequest();
  }, []);
  /**
   * Update profile photo when profile data loads
   */
  useEffect(() => {
    if (profileData?.profilePhotoBase64) {
      setProfilePhoto(
        `data:image/jpeg;base64,${profileData.profilePhotoBase64}`
      );
    }
  }, [profileData]);
  /**
   * Fetches employee profile data from backend
   */
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      toast.loading("Loading your profile...");
      const response = await EmployeeProfileService.getMyProfile();
      if (response.success) {
        setProfileData(response.data);
        initializeFormData(response.data);
        toast.dismiss();
      } else {
        toast.dismiss();
        toast.error(response.message || "Failed to load profile");
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.message || "Error loading profile");
    } finally {
      setLoading(false);
    }
  };
  /**
   * Checks if user has any pending change requests
   */
  const checkPendingRequest = async () => {
    try {
      setCheckingPending(true);
      const response = await ChangeRequestService.hasPendingRequest();
      if (response.success && response.data && response.data.requestId) {
        setHasPendingRequest(true);
        setPendingRequestId(response.data.requestId);
      } else {
        setHasPendingRequest(false);
        setPendingRequestId(null);
      }
    } catch (error) {
      console.error("Error checking pending request:", error);
      setHasPendingRequest(false);
      setPendingRequestId(null);
    } finally {
      setCheckingPending(false);
    }
  };
  /**
   * Handles camera icon click to open photo upload modal
   */
  const handleCameraClick = () => {
    setShowPhotoModal(true);
  };
  /**
   * Handles photo update callback from modal
   */
  const handlePhotoUpdate = async (newPhotoUrl) => {
    setProfilePhoto(newPhotoUrl);
    await fetchProfileData();
  };
  /**
   * Initializes form data with profile data
   */
  const initializeFormData = (data) => {
    setFormData({
      firstName: data.firstName || "",
      middleName: data.middleName || "",
      lastName: data.lastName || "",
      callingName: data.callingName || "",
      gender: data.gender || "",
      dateOfBirthOfficial: data.dateOfBirthOfficial || "",
      mobileNumber: data.mobileNumber || "",
      alternateNumber: data.alternateNumber || "",
      personalEmail: data.personalEmail || "",
      maritalStatus: data.maritalStatus || "",
      nationality: data.nationality || "",
      currentAddress: data.currentAddress
        ? {
            addressId: data.currentAddress.addressId || null,
            doorNumber: data.currentAddress.doorNumber || "",
            street: data.currentAddress.street || "",
            landmark: data.currentAddress.landmark || "",
            area: data.currentAddress.area || "",
            city: data.currentAddress.city || "",
            state: data.currentAddress.state || "",
            country: data.currentAddress.country || "India",
            pinCode: data.currentAddress.pinCode || "",
          }
        : {
            doorNumber: "",
            street: "",
            landmark: "",
            area: "",
            city: "",
            state: "",
            country: "India",
            pinCode: "",
          },
      permanentAddress: data.permanentAddress
        ? {
            addressId: data.permanentAddress.addressId || null,
            doorNumber: data.permanentAddress.doorNumber || "",
            street: data.permanentAddress.street || "",
            landmark: data.permanentAddress.landmark || "",
            area: data.permanentAddress.area || "",
            city: data.permanentAddress.city || "",
            state: data.permanentAddress.state || "",
            country: data.permanentAddress.country || "India",
            pinCode: data.permanentAddress.pinCode || "",
          }
        : {
            doorNumber: "",
            street: "",
            landmark: "",
            area: "",
            city: "",
            state: "",
            country: "India",
            pinCode: "",
          },
    });
    // Check if current and permanent addresses are same
    if (
      data.currentAddress &&
      data.permanentAddress &&
      JSON.stringify(data.currentAddress) ===
        JSON.stringify(data.permanentAddress)
    ) {
      setSameAsCurrentAddress(true);
    } else {
      setSameAsCurrentAddress(false);
    }
    setErrors({});
    setTouched({});
  };
  /**
   * Handles change request submission
   */
  const handleChangeRequest = async (requestPayload) => {
    try {
      toast.loading("Submitting change request...");
      const response = await ChangeRequestService.submitChangeRequest(
        requestPayload
      );
      if (response.success) {
        toast.dismiss();
        toast.success(
          response.message || "Change request submitted successfully"
        );
        if (response.data && response.data.requestId) {
          setHasPendingRequest(true);
          setPendingRequestId(response.data.requestId);
        }
        setShowChangeRequestModal(false);
        setTimeout(async () => {
          await checkPendingRequest();
        }, 500);
      } else {
        toast.dismiss();
        toast.error(response.message || "Failed to submit change request");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.Message ||
        error.message ||
        "Failed to submit change request";
      toast.dismiss();
      toast.error(errorMessage);
      console.error("Error:", error);
    }
  };
  /**
   * Handles modal close event
   */
  const handleModalClose = (action) => {
    if (action === "requestCancelled") {
      setHasPendingRequest(false);
      setPendingRequestId(null);
      toast.success("Request cancelled. You can submit a new one now.");
      setTimeout(async () => {
        await checkPendingRequest();
      }, 300);
    }
    setShowChangeRequestModal(false);
  };
  /**
   * Validates individual field
   */
  const validateField = (name, value) => {
    let error = "";
    const stringValue = value != null ? String(value) : "";
    switch (name) {
      case "firstName":
        if (!stringValue || !stringValue.trim()) {
          error = "First name is required";
        } else if (stringValue.trim().length < 2) {
          error = "First name must be at least 2 characters";
        } else if (stringValue.trim().length > 50) {
          error = "First name cannot exceed 50 characters";
        } else if (!/^[a-zA-Z]+$/.test(stringValue.trim())) {
          error = "First name can only contain letters";
        } else if (/\s{2,}/.test(stringValue)) {
          error = "First name cannot contain consecutive spaces";
        }
        break;
      case "middleName":
        if (stringValue && stringValue.trim()) {
          if (stringValue.trim().length > 50) {
            error = "Middle name cannot exceed 50 characters";
          } else if (!/^[a-zA-Z\s'-]*$/.test(stringValue.trim())) {
            error =
              "Middle name can only contain letters, spaces, hyphens, and apostrophes";
          } else if (/\s{2,}/.test(stringValue)) {
            error = "Middle name cannot contain consecutive spaces";
          } else if (/[-']{2,}/.test(stringValue)) {
            error =
              "Middle name cannot contain consecutive hyphens or apostrophes";
          }
        }
        break;
      case "lastName":
        if (!stringValue || !stringValue.trim()) {
          error = "Last name is required";
        } else if (stringValue.trim().length < 2) {
          error = "Last name must be at least 2 characters";
        } else if (stringValue.trim().length > 50) {
          error = "Last name cannot exceed 50 characters";
        } else if (!/^[a-zA-Z]+$/.test(stringValue.trim())) {
          error = "Last name can only contain letters";
        } else if (/\s{2,}/.test(stringValue)) {
          error = "Last name cannot contain consecutive spaces";
        }
        break;
      case "callingName":
        if (!stringValue || !stringValue.trim()) {
          error = "Calling name is required";
        } else if (stringValue.trim().length > 50) {
          error = "Calling name cannot exceed 50 characters";
        } else if (!/^[a-zA-Z\s'-]*$/.test(stringValue.trim())) {
          error =
            "Calling name can only contain letters, spaces, hyphens, and apostrophes";
        } else if (/\s{2,}/.test(stringValue)) {
          error = "Calling name cannot contain consecutive spaces";
        } else if (/[-']{2,}/.test(stringValue)) {
          error =
            "Calling name cannot contain consecutive hyphens or apostrophes";
        }
        break;
      case "mobileNumber":
        if (!stringValue || !stringValue.trim()) {
          error = "Mobile number is required";
        } else {
          const cleanNumber = stringValue.replace(/\s+/g, "");
          if (!/^\d+$/.test(cleanNumber)) {
            error = "Mobile number can only contain digits";
          } else if (cleanNumber.length !== 10) {
            error = "Mobile number must be exactly 10 digits";
          } else if (!/^[6-9]/.test(cleanNumber)) {
            error = "Mobile number must start with 6, 7, 8, or 9";
          } else if (/^(\d)\1{9}$/.test(cleanNumber)) {
            error = "Mobile number cannot have all same digits";
          } else if (
            cleanNumber === "0123456789" ||
            cleanNumber === "9876543210"
          ) {
            error = "Mobile number cannot be sequential digits";
          }
        }
        break;
      case "alternateNumber":
        if (!stringValue || !stringValue.trim()) {
          error = "Alternate number is required";
        } else {
          const cleanNumber = stringValue.replace(/\s+/g, "");
          if (!/^\d+$/.test(cleanNumber)) {
            error = "Alternate number can only contain digits";
          } else if (cleanNumber.length !== 10) {
            error = "Alternate number must be exactly 10 digits";
          } else if (!/^[6-9]/.test(cleanNumber)) {
            error = "Alternate number must start with 6, 7, 8, or 9";
          } else if (
            cleanNumber === formData.mobileNumber?.replace(/\s+/g, "")
          ) {
            error = "Alternate number must be different from mobile number";
          } else if (/^(\d)\1{9}$/.test(cleanNumber)) {
            error = "Alternate number cannot have all same digits";
          }
        }
        break;
      case "personalEmail":
        if (!stringValue || !stringValue.trim()) {
          error = "Personal email is required";
        } else {
          const email = stringValue.trim().toLowerCase();
          if (email.length > 100) {
            error = "Email address cannot exceed 100 characters";
          } else if (!email.endsWith("@gmail.com")) {
            error = "Personal email must be a Gmail account";
          } else if (!/^[a-zA-Z0-9._-]+@gmail\.com$/.test(email)) {
            error = "Please enter a valid Gmail address";
          } else if (/\.{2,}/.test(email)) {
            error = "Email cannot contain consecutive dots";
          } else if (/^[._-]/.test(email)) {
            error = "Email cannot start with a special character";
          } else if (!/^[a-zA-Z0-9._-]+@/.test(email)) {
            error = "Email contains invalid characters";
          } else {
            const localPart = email.split("@")[0];
            if (localPart.length < 3) {
              error = "Email username must be at least 3 characters";
            }
          }
        }
        break;
      case "gender":
        if (!stringValue || stringValue === "") {
          error = "Please select your gender";
        }
        break;
      case "dateOfBirthOfficial":
        if (!stringValue || !stringValue.trim()) {
          error = "Date of birth is required";
        } else {
          const birthDate = new Date(stringValue);
          const today = new Date();
          if (birthDate > today) {
            error = "Date of birth cannot be in the future";
          } else {
            const age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            const actualAge =
              monthDiff < 0 ||
              (monthDiff === 0 && today.getDate() < birthDate.getDate())
                ? age - 1
                : age;
            if (actualAge < 18) {
              error = "You must be at least 18 years old";
            } else if (actualAge > 100) {
              error = "Please enter a valid date of birth";
            } else if (actualAge > 65) {
              error = "Age cannot exceed 65 years for employment";
            }
            if (birthDate.getFullYear() < 1900) {
              error = "Please enter a valid date of birth";
            }
          }
        }
        break;
      case "nationality":
        if (!stringValue || stringValue === "") {
          error = "Please select your nationality";
        }
        break;
      case "maritalStatus":
        if (!stringValue || stringValue === "") {
          error = "Please select your marital status";
        }
        break;
      default:
        break;
    }
    return error;
  };
  /**
   * Validates address fields
   */
  const validateAddressField = (addressType, field, value) => {
    let error = "";
    const stringValue = value != null ? String(value) : "";
    switch (field) {
      case "doorNumber":
        if (!stringValue || !stringValue.trim()) {
          error = "Door number is required";
        } else if (stringValue.trim().length > 20) {
          error = "Door number cannot exceed 20 characters";
        } else if (/^[^a-zA-Z0-9]+$/.test(stringValue.trim())) {
          error = "Door number must contain alphanumeric characters";
        } else if (/\s{2,}/.test(stringValue)) {
          error = "Door number cannot contain consecutive spaces";
        }
        break;
      case "street":
        if (!stringValue || !stringValue.trim()) {
          error = "Street is required";
        } else if (stringValue.trim().length < 2) {
          error = "Street must be at least 2 characters";
        } else if (stringValue.trim().length > 100) {
          error = "Street cannot exceed 100 characters";
        } else if (!/^[a-zA-Z0-9\s,.-]+$/.test(stringValue.trim())) {
          error =
            "Street can only contain letters, numbers, spaces, commas, dots, and hyphens";
        } else if (/\s{2,}/.test(stringValue)) {
          error = "Street cannot contain consecutive spaces";
        }
        break;
      case "landmark":
        if (!stringValue || !stringValue.trim()) {
          error = "Landmark is required";
        } else if (stringValue.trim().length > 100) {
          error = "Landmark cannot exceed 100 characters";
        } else if (!/^[a-zA-Z0-9\s,.-]+$/.test(stringValue.trim())) {
          error =
            "Landmark can only contain letters, numbers, spaces, commas, dots, and hyphens";
        } else if (/\s{2,}/.test(stringValue)) {
          error = "Landmark cannot contain consecutive spaces";
        }
        break;
      case "area":
        if (!stringValue || !stringValue.trim()) {
          error = "Area is required";
        } else if (stringValue.trim().length < 2) {
          error = "Area must be at least 2 characters";
        } else if (stringValue.trim().length > 100) {
          error = "Area cannot exceed 100 characters";
        } else if (!/^[a-zA-Z0-9\s,.-]+$/.test(stringValue.trim())) {
          error =
            "Area can only contain letters, numbers, spaces, commas, dots, and hyphens";
        } else if (/\s{2,}/.test(stringValue)) {
          error = "Area cannot contain consecutive spaces";
        }
        break;
      case "city":
        if (!stringValue || !stringValue.trim()) {
          error = "City is required";
        } else if (stringValue.trim().length < 2) {
          error = "City must be at least 2 characters";
        } else if (stringValue.trim().length > 50) {
          error = "City cannot exceed 50 characters";
        } else if (!/^[a-zA-Z\s]+$/.test(stringValue.trim())) {
          error = "City can only contain letters and spaces";
        } else if (/\s{2,}/.test(stringValue)) {
          error = "City cannot contain consecutive spaces";
        } else if (stringValue.trim().replace(/\s/g, "").length < 2) {
          error = "City name is too short";
        }
        break;
      case "state":
        if (!stringValue || stringValue === "") {
          error = "Please select your state";
        }
        break;
      case "pinCode":
        if (!stringValue || !stringValue.trim()) {
          error = "PIN code is required";
        } else {
          const pinCode = stringValue.replace(/\s+/g, "");
          if (!/^\d+$/.test(pinCode)) {
            error = "PIN code can only contain digits";
          } else if (pinCode.length !== 6) {
            error = "PIN code must be exactly 6 digits";
          } else if (pinCode.startsWith("0")) {
            error = "PIN code cannot start with 0";
          } else if (/^(\d)\1{5}$/.test(pinCode)) {
            error = "PIN code cannot have all same digits";
          }
        }
        break;
      case "country":
        if (!stringValue || !stringValue.trim()) {
          error = "Country is required";
        } else if (stringValue.trim().length > 50) {
          error = "Country cannot exceed 50 characters";
        }
        break;
      default:
        break;
    }
    return error;
  };
  /**
   * Handles input field changes
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };
  /**
   * Handles address field changes
   */
  const handleAddressChange = (addressType, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [addressType]: {
        ...prev[addressType],
        [field]: value,
      },
    }));
    setTouched((prev) => ({
      ...prev,
      [`${addressType}.${field}`]: true,
    }));
    const error = validateAddressField(addressType, field, value);
    setErrors((prev) => ({
      ...prev,
      [`${addressType}.${field}`]: error,
    }));
  };
  /**
   * Handles "same as current address" checkbox
   */
  const handleSameAddressChange = (e) => {
    const isChecked = e.target.checked;
    setSameAsCurrentAddress(isChecked);
    if (isChecked) {
      setFormData((prev) => ({
        ...prev,
        permanentAddress: { ...prev.currentAddress },
      }));
      toast.info("Permanent address copied from current address");
    } else {
      setFormData((prev) => ({
        ...prev,
        permanentAddress: profileData.permanentAddress
          ? {
              addressId: profileData.permanentAddress.addressId || null,
              doorNumber: profileData.permanentAddress.doorNumber || "",
              street: profileData.permanentAddress.street || "",
              landmark: profileData.permanentAddress.landmark || "",
              area: profileData.permanentAddress.area || "",
              city: profileData.permanentAddress.city || "",
              state: profileData.permanentAddress.state || "",
              country: profileData.permanentAddress.country || "India",
              pinCode: profileData.permanentAddress.pinCode || "",
            }
          : {
              doorNumber: "",
              street: "",
              landmark: "",
              area: "",
              city: "",
              state: "",
              country: "India",
              pinCode: "",
            },
      }));
    }
  };
  /**
   * Auto-sync permanent address when current address changes
   */
  useEffect(() => {
    if (sameAsCurrentAddress && isEditing) {
      setFormData((prev) => ({
        ...prev,
        permanentAddress: { ...prev.currentAddress },
      }));
    }
  }, [formData.currentAddress, sameAsCurrentAddress, isEditing]);
  /**
   * Validates entire form before submission
   */
  const validateForm = () => {
    const newErrors = {};
    const requiredFields = [
      "firstName",
      "lastName",
      "callingName",
      "gender",
      "dateOfBirthOfficial",
      "mobileNumber",
      "alternateNumber",
      "personalEmail",
      "maritalStatus",
      "nationality",
    ];
    requiredFields.forEach((field) => {
      const fieldValue = formData[field];
      if (
        !fieldValue ||
        (typeof fieldValue === "string" && !fieldValue.trim())
      ) {
        newErrors[field] = `${field
          .replace(/([A-Z])/g, " $1")
          .trim()} is required`;
      }
    });
    Object.keys(formData).forEach((field) => {
      if (typeof formData[field] === "string" || formData[field] != null) {
        const error = validateField(field, formData[field]);
        if (error) {
          newErrors[field] = error;
        }
      }
    });
    ["currentAddress", "permanentAddress"].forEach((addressType) => {
      if (formData[addressType]) {
        Object.keys(formData[addressType]).forEach((field) => {
          if (field !== "addressId") {
            const error = validateAddressField(
              addressType,
              field,
              formData[addressType][field]
            );
            if (error) {
              newErrors[`${addressType}.${field}`] = error;
            }
          }
        });
      }
    });
    if (
      formData.alternateNumber &&
      formData.mobileNumber &&
      formData.alternateNumber.replace(/\s+/g, "") ===
        formData.mobileNumber.replace(/\s+/g, "")
    ) {
      newErrors.alternateNumber =
        "Alternate number must be different from mobile number";
    }
    setErrors(newErrors);
    const errorCount = Object.keys(newErrors).length;
    if (errorCount > 0) {
      toast.error(
        `Please fix ${errorCount} validation error${
          errorCount > 1 ? "s" : ""
        } before submitting`
      );
    }
    return Object.keys(newErrors).length === 0;
  };
  /**
   * Handles form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = {};
    Object.keys(formData).forEach((key) => {
      if (typeof formData[key] === "object" && !Array.isArray(formData[key])) {
        Object.keys(formData[key]).forEach((subKey) => {
          allTouched[`${key}.${subKey}`] = true;
        });
      } else {
        allTouched[key] = true;
      }
    });
    setTouched(allTouched);
    if (!validateForm()) {
      const firstErrorField = document.querySelector(
        ".epda-form-control.epda-error, .epda-custom-dropdown.epda-error"
      );
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
        firstErrorField.focus();
      }
      return;
    }
    try {
      setSaving(true);
      toast.loading("Updating your profile...");
      const response = await EmployeeProfileService.updateProfile(formData);
      if (response.success) {
        toast.dismiss();
        toast.success("Profile updated successfully!");
        setProfileData(response.data);
        initializeFormData(response.data);
        setIsEditing(false);
        if (
          response.data.currentAddress &&
          response.data.permanentAddress &&
          JSON.stringify(response.data.currentAddress) ===
            JSON.stringify(response.data.permanentAddress)
        ) {
          setSameAsCurrentAddress(true);
        } else {
          setSameAsCurrentAddress(false);
        }
      } else {
        toast.dismiss();
        toast.error(
          response.message || "Failed to update profile. Please try again."
        );
      }
    } catch (error) {
      toast.dismiss();
      toast.error(
        error.message ||
          "Verify all the fields that have been entered are valid!"
      );
    } finally {
      setSaving(false);
    }
  };
  /**
   * Handles cancel button
   */
  const handleCancel = () => {
    setIsEditing(false);
    setSameAsCurrentAddress(false);
    initializeFormData(profileData);
    toast.info("Changes discarded");
  };
  /**
   * Gets initials from first and last name
   */
  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return "NA";
    const first = firstName ? firstName[0] : "";
    const last = lastName ? lastName[0] : "";
    return (first + last).toUpperCase();
  };
  /**
   * Formats date to readable format
   */
  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  /**
   * Formats address object to readable string
   */
  const formatAddress = (address) => {
    if (!address) return null;
    const parts = [
      address.doorNumber,
      address.street,
      address.landmark,
      address.area,
      address.city,
      address.state,
      address.country,
      address.pinCode,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  };
  /**
   * Returns appropriate badge class for employment status
   */
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "epda-badge-success";
      case "inactive":
        return "epda-badge-secondary";
      case "on leave":
        return "epda-badge-warning";
      case "terminated":
        return "epda-badge-danger";
      default:
        return "epda-badge-secondary";
    }
  };
  /**
   * Checks if field should show error
   */
  const showError = (fieldName) => {
    return touched[fieldName] && errors[fieldName];
  };
  // Loading state
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
  // No data state
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
      {/* Modern Profile Header */}
      <div className="epda-profile-header">
        <div className="epda-header-background"></div>
        <div className="epda-header-content">
          <div className="epda-avatar-section">
            <div className="epda-avatar-wrapper">
              <div className="epda-avatar">
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt="Profile"
                    className="epda-avatar-photo"
                  />
                ) : (
                  <span className="epda-avatar-initials">
                    {getInitials(profileData.firstName, profileData.lastName)}
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
                  <i className="bi bi-pencil"></i>
                  Edit Profile
                </button>
              </>
            ) : (
              <>
                <button
                  className="epda-btn epda-btn-outline-danger"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <i className="bi bi-x-circle"></i>
                  Cancel
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
      {/* Main Content Grid */}
      <div className="epda-profile-content">
        <div className="epda-content-grid">
          {/* Left Sidebar */}
          <div className="epda-sidebar">
            {/* Personal Details Card */}
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
                        {Math.floor(
                          (new Date() -
                            new Date(profileData.dateOfBirthOfficial)) /
                            (365.25 * 24 * 60 * 60 * 1000)
                        )}{" "}
                        years
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Employment Details Card */}
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
                    <div className="epda-info-item">
                      <label>Department</label>
                      <span>{profileData.departmentName}</span>
                    </div>
                  )}
                  {profileData.employmentStatus && (
                    <div className="epda-info-item">
                      <label>Employment Status</label>
                      <span>{profileData.employmentStatus}</span>
                    </div>
                  )}
                  {profileData.joiningDate && (
                    <div className="epda-info-item">
                      <label>Date of Joining</label>
                      <span>{formatDate(profileData.joiningDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Address Card - Hide in Edit Mode */}
            {!isEditing && (
              <div className="epda-info-card">
                <div className="epda-card-header">
                  <i className="bi bi-geo-alt"></i>
                  <h3>Address</h3>
                </div>
                <div className="epda-card-content">
                  <div className="epda-info-grid">
                    {profileData.currentAddress && (
                      <div className="epda-info-item">
                        <label>Current Address</label>
                        <span>
                          {formatAddress(profileData.currentAddress) ||
                            "Not provided"}
                        </span>
                      </div>
                    )}
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
                          <span
                            style={{ color: "#6c757d", fontStyle: "italic" }}
                          >
                            No address information available
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Main Section */}
          <div className="epda-main-section">
            {/* Editable Personal Information */}
            <div className="epda-form-card">
              <div className="epda-card-header">
                <i className="bi bi-person-lines-fill"></i>
                <h3>Personal Information</h3>
              </div>
              <div className="epda-card-content">
                <form>
                  <div className="epda-form-grid">
                    {/* First Name */}
                    <div className="epda-form-field">
                      <label>
                        First Name <span className="epda-required">*</span>
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
                    {/* Middle Name */}
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
                    {/* Last Name */}
                    <div className="epda-form-field">
                      <label>
                        Last Name <span className="epda-required">*</span>
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
                    {/* Calling Name */}
                    <div className="epda-form-field">
                      <label>
                        Calling Name <span className="epda-required">*</span>
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
                    {/* Gender */}
                    <div className="epda-form-field">
                      <label>
                        Gender <span className="epda-required">*</span>
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
                    {/* Date of Birth */}
                    <div className="epda-form-field">
                      <label>
                        Date of Birth <span className="epda-required">*</span>
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
                    {/* Marital Status */}
                    <div className="epda-form-field">
                      <label>
                        Marital Status <span className="epda-required">*</span>
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
                    {/* Nationality */}
                    <div className="epda-form-field">
                      <label>
                        Nationality <span className="epda-required">*</span>
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
            {/* Contact Information */}
            <div className="epda-form-card">
              <div className="epda-card-header">
                <i className="bi bi-telephone"></i>
                <h3>Contact Information</h3>
              </div>
              <div className="epda-card-content">
                <form>
                  <div className="epda-form-grid">
                    {/* Mobile Number */}
                    <div className="epda-form-field">
                      <label>
                        Mobile Number <span className="epda-required">*</span>
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
                    {/* Alternate Number */}
                    <div className="epda-form-field">
                      <label>
                        Alternate Number{" "}
                        <span className="epda-required">*</span>
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
                    {/* Personal Email */}
                    <div className="epda-form-field">
                      <label>
                        Personal Email <span className="epda-required">*</span>
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
            {/* Address Information - Edit Mode */}
            {isEditing && (
              <div className="epda-form-card">
                <div className="epda-card-header">
                  <i className="bi bi-geo-alt-fill"></i>
                  <h3>Address Information</h3>
                </div>
                <div className="epda-card-content">
                  {/* Current Address */}
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
                        <label>
                          Area <span className="epda-required">*</span>
                        </label>
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
                        <label>
                          City <span className="epda-required">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.currentAddress?.city || ""}
                          onChange={(e) =>
                            handleAddressChange(
                              "currentAddress",
                              "city",
                              e.target.value
                            )
                          }
                          className={`epda-form-control ${
                            showError("currentAddress.city") ? "epda-error" : ""
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
                        <label>
                          State <span className="epda-required">*</span>
                        </label>
                        <StateDropdown
                          value={formData.currentAddress?.state || ""}
                          onChange={(val) =>
                            handleAddressChange("currentAddress", "state", val)
                          }
                          disabled={false}
                          showError={showError("currentAddress.state")}
                          options={stateOptions}
                        />
                        {showError("currentAddress.state") && (
                          <span className="epda-error-message">
                            {errors["currentAddress.state"]}
                          </span>
                        )}
                      </div>
                      <div className="epda-form-field">
                        <label>
                          Country <span className="epda-required">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.currentAddress?.country || "India"}
                          onChange={(e) =>
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
                        <label>
                          PIN Code <span className="epda-required">*</span>
                        </label>
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
                  {/* Same as Current Address Checkbox */}
                  <div className="epda-address-checkbox">
                    <label className="epda-checkbox-label">
                      <input
                        type="checkbox"
                        checked={sameAsCurrentAddress}
                        onChange={handleSameAddressChange}
                      />
                      <span className="epda-checkmark"></span>
                      Permanent address is same as current address
                    </label>
                  </div>
                  {/* Permanent Address */}
                  <div className="epda-address-section">
                    <h4 className="epda-section-title">
                      <i className="bi bi-house"></i>
                      Permanent Address
                    </h4>
                    {sameAsCurrentAddress && (
                      <div className="epda-address-auto-filled">
                        <i className="bi bi-info-circle-fill"></i>
                        <span>
                          Permanent address will automatically sync with current
                          address
                        </span>
                      </div>
                    )}
                    <div className="epda-form-grid epda-address-grid">
                      <div className="epda-form-field">
                        <label>
                          Door Number <span className="epda-required">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.permanentAddress?.doorNumber || ""}
                          onChange={(e) =>
                            handleAddressChange(
                              "permanentAddress",
                              "doorNumber",
                              e.target.value
                            )
                          }
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
                            handleAddressChange(
                              "permanentAddress",
                              "state",
                              val
                            )
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
      {/* Change Request Modal */}
      {showChangeRequestModal && (
        <ChangeRequestModal
          show={showChangeRequestModal}
          onClose={handleModalClose}
          onSubmit={handleChangeRequest}
          hasPendingRequest={hasPendingRequest}
          pendingRequestId={pendingRequestId}
        />
      )}
      {/* Profile Photo Upload Modal */}
      {showPhotoModal && (
        <ProfilePhotoUploadModal
          show={showPhotoModal}
          onClose={() => setShowPhotoModal(false)}
          onPhotoUpdate={handlePhotoUpdate}
          currentPhoto={profilePhoto}
        />
      )}
    </div>
  );
};
export default EmployeeProfile;
