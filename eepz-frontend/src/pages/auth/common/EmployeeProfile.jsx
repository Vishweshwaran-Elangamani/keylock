import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/auth/AuthContext";
import EmployeeProfileService from "../../../services/auth/EmployeeProfileService";
import ChangeRequestService from "../../../services/auth/changeRequestService";
import ChangeRequestModal from "./ChangeRequestModal";
import { toast } from "sonner";
import "../../../styles/auth/common/EmployeeProfile.css";

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
        toast.success("Profile loaded successfully");
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

      console.log("Checking pending request:", response);

      if (response.success && response.data && response.data.requestId) {
        console.log("Has pending request:", response.data.requestId);
        setHasPendingRequest(true);
        setPendingRequestId(response.data.requestId);
      } else {
        console.log("No pending request");
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
   * Initializes form data with profile data
   * Sets up address objects with proper structure
   * @param {Object} data - Profile data from API
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
    }
  };

  /**
   * Handles change request submission
   * @param {Object} requestPayload - Change request data
   */
  const handleChangeRequest = async (requestPayload) => {
    try {
      console.log("Submitting change request:", requestPayload);

      toast.loading("Submitting change request...");

      const response = await ChangeRequestService.submitChangeRequest(
        requestPayload
      );
      console.log("Response:", response);

      if (response.success) {
        toast.dismiss();
        toast.success(
          response.message || "Change request submitted successfully"
        );

        // Update state immediately
        if (response.data && response.data.requestId) {
          console.log("Setting pending request ID:", response.data.requestId);
          setHasPendingRequest(true);
          setPendingRequestId(response.data.requestId);
        }

        setShowChangeRequestModal(false);

        // Refresh pending request check
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
   * @param {string} action - Action taken before closing
   */
  const handleModalClose = (action) => {
    console.log("Modal closing with action:", action);

    if (action === "requestCancelled") {
      console.log("Request cancelled, resetting state");
      setHasPendingRequest(false);
      setPendingRequestId(null);
      toast.success("Request cancelled. You can submit a new one now.");

      // Refresh pending request check
      setTimeout(async () => {
        await checkPendingRequest();
      }, 300);
    }

    setShowChangeRequestModal(false);
  };

  /**
   * Validates individual field with comprehensive 360° validation
   * @param {string} name - Field name
   * @param {string} value - Field value
   * @returns {string} - Error message or empty string
   */
  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "firstName":
        // Required field validation
        if (!value || !value.trim()) {
          error = "First name is required";
        } 
        // Length validation
        else if (value.trim().length < 2) {
          error = "First name must be at least 2 characters";
        } 
        else if (value.trim().length > 50) {
          error = "First name cannot exceed 50 characters";
        }
        // Character validation - only letters
        else if (!/^[a-zA-Z]+$/.test(value.trim())) {
          error = "First name can only contain letters";
        }
        // Check for consecutive spaces
        else if (/\s{2,}/.test(value)) {
          error = "First name cannot contain consecutive spaces";
        }
        break;

      case "middleName":
        // Optional field - only validate if value exists
        if (value && value.trim()) {
          // Length validation
          if (value.trim().length > 50) {
            error = "Middle name cannot exceed 50 characters";
          }
          // Character validation
          else if (!/^[a-zA-Z\s'-]*$/.test(value.trim())) {
            error = "Middle name can only contain letters, spaces, hyphens, and apostrophes";
          }
          // Check for consecutive spaces
          else if (/\s{2,}/.test(value)) {
            error = "Middle name cannot contain consecutive spaces";
          }
          // Check for consecutive special chars
          else if (/[-']{2,}/.test(value)) {
            error = "Middle name cannot contain consecutive hyphens or apostrophes";
          }
        }
        break;

      case "lastName":
        // Required field validation
        if (!value || !value.trim()) {
          error = "Last name is required";
        } 
        // Length validation
        else if (value.trim().length < 2) {
          error = "Last name must be at least 2 characters";
        } 
        else if (value.trim().length > 50) {
          error = "Last name cannot exceed 50 characters";
        }
        // Character validation - only letters
        else if (!/^[a-zA-Z]+$/.test(value.trim())) {
          error = "Last name can only contain letters";
        }
        // Check for consecutive spaces
        else if (/\s{2,}/.test(value)) {
          error = "Last name cannot contain consecutive spaces";
        }
        break;

      case "callingName":
        // Optional field - only validate if value exists
        if (value && value.trim()) {
          // Length validation
          if (value.trim().length > 50) {
            error = "Calling name cannot exceed 50 characters";
          }
          // Character validation
          else if (!/^[a-zA-Z\s'-]*$/.test(value.trim())) {
            error = "Calling name can only contain letters, spaces, hyphens, and apostrophes";
          }
          // Check for consecutive spaces
          else if (/\s{2,}/.test(value)) {
            error = "Calling name cannot contain consecutive spaces";
          }
          // Check for consecutive special chars
          else if (/[-']{2,}/.test(value)) {
            error = "Calling name cannot contain consecutive hyphens or apostrophes";
          }
        }
        break;

      case "mobileNumber":
        // Required field validation
        if (!value || !value.trim()) {
          error = "Mobile number is required";
        }
        // Remove spaces for validation
        else {
          const cleanNumber = value.replace(/\s+/g, "");
          // Check if only digits
          if (!/^\d+$/.test(cleanNumber)) {
            error = "Mobile number can only contain digits";
          }
          // Check exact length
          else if (cleanNumber.length !== 10) {
            error = "Mobile number must be exactly 10 digits";
          }
          // Check if starts with valid digit (6-9 for Indian numbers)
          else if (!/^[6-9]/.test(cleanNumber)) {
            error = "Mobile number must start with 6, 7, 8, or 9";
          }
          // Check for all same digits
          else if (/^(\d)\1{9}$/.test(cleanNumber)) {
            error = "Mobile number cannot have all same digits";
          }
          // Check for sequential digits
          else if (
            cleanNumber === "0123456789" ||
            cleanNumber === "9876543210"
          ) {
            error = "Mobile number cannot be sequential digits";
          }
        }
        break;

      case "alternateNumber":
        // Optional field - only validate if value exists
        if (value && value.trim()) {
          const cleanNumber = value.replace(/\s+/g, "");
          // Check if only digits
          if (!/^\d+$/.test(cleanNumber)) {
            error = "Alternate number can only contain digits";
          }
          // Check exact length
          else if (cleanNumber.length !== 10) {
            error = "Alternate number must be exactly 10 digits";
          }
          // Check if starts with valid digit
          else if (!/^[6-9]/.test(cleanNumber)) {
            error = "Alternate number must start with 6, 7, 8, or 9";
          }
          // Check if same as mobile number
          else if (cleanNumber === formData.mobileNumber?.replace(/\s+/g, "")) {
            error = "Alternate number must be different from mobile number";
          }
          // Check for all same digits
          else if (/^(\d)\1{9}$/.test(cleanNumber)) {
            error = "Alternate number cannot have all same digits";
          }
        }
        break;

      case "personalEmail":
        // Optional field - only validate if value exists
        if (value && value.trim()) {
          const email = value.trim().toLowerCase();
          // Length validation
          if (email.length > 100) {
            error = "Email address cannot exceed 100 characters";
          }
          // Check if ends with @gmail.com
          else if (!email.endsWith("@gmail.com")) {
            error = "Personal email must be a Gmail account";
          }
          // Basic email format validation
          else if (!/^[a-zA-Z0-9._-]+@gmail\.com$/.test(email)) {
            error = "Please enter a valid Gmail address";
          }
          // Check for consecutive dots
          else if (/\.{2,}/.test(email)) {
            error = "Email cannot contain consecutive dots";
          }
          // Check if starts with special character
          else if (/^[._-]/.test(email)) {
            error = "Email cannot start with a special character";
          }
          // Check if contains invalid characters before @
          else if (!/^[a-zA-Z0-9._-]+@/.test(email)) {
            error = "Email contains invalid characters";
          }
          // Check minimum length before @
          else {
            const localPart = email.split("@")[0];
            if (localPart.length < 3) {
              error = "Email username must be at least 3 characters";
            }
          }
        }
        break;

      case "gender":
        // Required field validation
        if (!value || value === "") {
          error = "Gender is required";
        }
        break;

      case "dateOfBirthOfficial":
        // Optional field - only validate if value exists
        if (value) {
          const birthDate = new Date(value);
          const today = new Date();
          
          // Validate date is not in future
          if (birthDate > today) {
            error = "Date of birth cannot be in the future";
          } else {
            // Calculate exact age
            const age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            const actualAge =
              monthDiff < 0 ||
              (monthDiff === 0 && today.getDate() < birthDate.getDate())
                ? age - 1
                : age;

            // Age validation
            if (actualAge < 18) {
              error = "You must be at least 18 years old";
            } else if (actualAge > 100) {
              error = "Please enter a valid date of birth";
            } else if (actualAge > 65) {
              error = "Age cannot exceed 65 years for employment";
            }
            
            // Check if date is too old (before 1900)
            if (birthDate.getFullYear() < 1900) {
              error = "Please enter a valid date of birth";
            }
          }
        }
        break;

      case "nationality":
        // Required field validation
        if (!value || value === "") {
          error = "Nationality is required";
        }
        break;

      case "maritalStatus":
        // Required field validation
        if (!value || value === "") {
          error = "Marital status is required";
        }
        break;

      default:
        break;
    }

    return error;
  };

  /**
   * Validates address fields with comprehensive validation
   * @param {string} addressType - Type of address (current/permanent)
   * @param {string} field - Field name
   * @param {string} value - Field value
   * @returns {string} - Error message or empty string
   */
  const validateAddressField = (addressType, field, value) => {
    let error = "";

    // All address fields are optional
    if (!value || !value.trim()) {
      return "";
    }

    switch (field) {
      case "doorNumber":
        // Length validation
        if (value.trim().length > 20) {
          error = "Door number cannot exceed 20 characters";
        }
        // Check for only special characters
        else if (/^[^a-zA-Z0-9]+$/.test(value.trim())) {
          error = "Door number must contain alphanumeric characters";
        }
        // Check for consecutive spaces
        else if (/\s{2,}/.test(value)) {
          error = "Door number cannot contain consecutive spaces";
        }
        break;

      case "street":
        // Length validation
        if (value.trim().length < 2) {
          error = "Street must be at least 2 characters";
        } else if (value.trim().length > 100) {
          error = "Street cannot exceed 100 characters";
        }
        // Character validation - alphanumeric with spaces and common chars
        else if (!/^[a-zA-Z0-9\s,.-]+$/.test(value.trim())) {
          error = "Street can only contain letters, numbers, spaces, commas, dots, and hyphens";
        }
        // Check for consecutive spaces
        else if (/\s{2,}/.test(value)) {
          error = "Street cannot contain consecutive spaces";
        }
        break;

      case "landmark":
        // Length validation
        if (value.trim().length > 100) {
          error = "Landmark cannot exceed 100 characters";
        }
        // Character validation
        else if (!/^[a-zA-Z0-9\s,.-]+$/.test(value.trim())) {
          error = "Landmark can only contain letters, numbers, spaces, commas, dots, and hyphens";
        }
        // Check for consecutive spaces
        else if (/\s{2,}/.test(value)) {
          error = "Landmark cannot contain consecutive spaces";
        }
        break;

      case "area":
        // Length validation
        if (value.trim().length < 2) {
          error = "Area must be at least 2 characters";
        } else if (value.trim().length > 100) {
          error = "Area cannot exceed 100 characters";
        }
        // Character validation
        else if (!/^[a-zA-Z0-9\s,.-]+$/.test(value.trim())) {
          error = "Area can only contain letters, numbers, spaces, commas, dots, and hyphens";
        }
        // Check for consecutive spaces
        else if (/\s{2,}/.test(value)) {
          error = "Area cannot contain consecutive spaces";
        }
        break;

      case "city":
        // Length validation
        if (value.trim().length < 2) {
          error = "City must be at least 2 characters";
        } else if (value.trim().length > 50) {
          error = "City cannot exceed 50 characters";
        }
        // Character validation - only letters and spaces
        else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
          error = "City can only contain letters and spaces";
        }
        // Check for consecutive spaces
        else if (/\s{2,}/.test(value)) {
          error = "City cannot contain consecutive spaces";
        }
        // Check if city name is too short
        else if (value.trim().replace(/\s/g, "").length < 2) {
          error = "City name is too short";
        }
        break;

      case "state":
        // State is required if city is filled
        if (formData[addressType]?.city && (!value || value === "")) {
          error = "State is required when city is provided";
        }
        break;

      case "pinCode":
        const pinCode = value.replace(/\s+/g, "");
        // Check if only digits
        if (!/^\d+$/.test(pinCode)) {
          error = "PIN code can only contain digits";
        }
        // Check exact length
        else if (pinCode.length !== 6) {
          error = "PIN code must be exactly 6 digits";
        }
        // Check if starts with 0
        else if (pinCode.startsWith("0")) {
          error = "PIN code cannot start with 0";
        }
        // Check for all same digits
        else if (/^(\d)\1{5}$/.test(pinCode)) {
          error = "PIN code cannot have all same digits";
        }
        break;

      case "country":
        // Length validation
        if (value && value.trim().length > 50) {
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
   * @param {Event} e - Change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Mark field as touched
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Validate field in real-time
    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  /**
   * Handles address field changes
   * @param {string} addressType - current or permanent address
   * @param {string} field - Field name
   * @param {string} value - Field value
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

    // Validate address field in real-time
    const error = validateAddressField(addressType, field, value);
    setErrors((prev) => ({
      ...prev,
      [`${addressType}.${field}`]: error,
    }));
  };

  /**
   * Handles "same as current address" checkbox
   * @param {Event} e - Change event
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
   * Validates entire form before submission with 360° coverage
   * @returns {boolean} - True if form is valid
   */
  const validateForm = () => {
    const newErrors = {};

    // Define required fields
    const requiredFields = [
      "firstName",
      "lastName",
      "gender",
      "mobileNumber",
      "maritalStatus",
      "nationality",
    ];

    // Validate required fields
    requiredFields.forEach((field) => {
      if (!formData[field] || !formData[field].toString().trim()) {
        newErrors[field] = `${field.replace(/([A-Z])/g, " $1").trim()} is required`;
      }
    });

    // Validate all string fields with specific validations
    Object.keys(formData).forEach((field) => {
      if (typeof formData[field] === "string") {
        const error = validateField(field, formData[field]);
        if (error) {
          newErrors[field] = error;
        }
      }
    });

    // Validate address fields
    ["currentAddress", "permanentAddress"].forEach((addressType) => {
      if (formData[addressType]) {
        Object.keys(formData[addressType]).forEach((field) => {
          const error = validateAddressField(
            addressType,
            field,
            formData[addressType][field]
          );
          if (error) {
            newErrors[`${addressType}.${field}`] = error;
          }
        });
      }
    });

    // Cross-field validation
    // Check if alternate number is same as mobile number
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
    
    // Show toast with error count if validation fails
    const errorCount = Object.keys(newErrors).length;
    if (errorCount > 0) {
      toast.error(
        `Please fix ${errorCount} validation error${errorCount > 1 ? "s" : ""} before submitting`
      );
    }

    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles form submission
   * @param {Event} e - Submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched for validation display
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

    // Validate form
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = document.querySelector(".form-control-modern.error");
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
        setSameAsCurrentAddress(false);
        setTouched({});
        setErrors({});
      } else {
        toast.dismiss();
        toast.error(
          response.message || "Failed to update profile. Please try again."
        );
      }
    } catch (error) {
      toast.dismiss();
      toast.error(
        error.message || "An error occurred while updating your profile"
      );
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handles cancel button - resets form to original data
   */
  const handleCancel = () => {
    setIsEditing(false);
    setSameAsCurrentAddress(false);
    initializeFormData(profileData);
    setErrors({});
    setTouched({});
    toast.info("Changes discarded");
  };

  /**
   * Gets initials from first and last name
   * @param {string} firstName - First name
   * @param {string} lastName - Last name
   * @returns {string} - Initials
   */
  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return "NA";
    const first = firstName ? firstName[0] : "";
    const last = lastName ? lastName[0] : "";
    return (first + last).toUpperCase();
  };

  /**
   * Formats date to readable format
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date
   */
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /**
   * Formats address object to readable string
   * @param {Object} address - Address object
   * @returns {string} - Formatted address
   */
  const formatAddress = (address) => {
    if (!address) return "N/A";
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
    return parts.length > 0 ? parts.join(", ") : "N/A";
  };

  /**
   * Returns appropriate badge class for employment status
   * @param {string} status - Employment status
   * @returns {string} - CSS class name
   */
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "badge-success";
      case "inactive":
        return "badge-secondary";
      case "on leave":
        return "badge-warning";
      case "terminated":
        return "badge-danger";
      default:
        return "badge-secondary";
    }
  };

  /**
   * Checks if field should show error
   * @param {string} fieldName - Field name
   * @returns {boolean} - True if error should be shown
   */
  const showError = (fieldName) => {
    return touched[fieldName] && errors[fieldName];
  };

  // Loading state
  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  // No data state
  if (!profileData) {
    return (
      <div className="error-wrapper">
        <div className="error-content">
          <i className="bi bi-exclamation-triangle"></i>
          <h3>Profile Not Available</h3>
          <p>Unable to load profile data</p>
          <button className="btn-retry" onClick={fetchProfileData}>
            <i className="bi bi-arrow-clockwise me-2"></i>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-profile-container">
      {/* Modern Profile Header with Gradient Background */}
      <div className="profile-header-modern">
        <div className="profile-header-background"></div>
        <div className="profile-header-content">
          {/* Avatar and Basic Info Section */}
          <div className="profile-avatar-section">
            <div className="profile-avatar-modern">
              <span className="avatar-initials">
                {getInitials(profileData.firstName, profileData.lastName)}
              </span>
              <div className="avatar-status-ring"></div>
            </div>
            <div className="profile-basic-info">
              <h1 className="profile-name-modern">
                {profileData.firstName} {profileData.lastName}
              </h1>
              <p className="profile-role-modern">
                {profileData.roleName || "Employee"}
              </p>
              <div className="profile-meta">
                <span className="profile-id">
                  <i className="bi bi-person-badge"></i>
                  {profileData.employeeCompanyId}
                </span>
                <span
                  className={`profile-status ${getStatusBadgeClass(
                    profileData.employmentStatus
                  )}`}
                >
                  <i className="bi bi-circle-fill"></i>
                  {profileData.employmentStatus || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="profile-actions">
            {!isEditing ? (
              <>
                <button
                  className="btn btn-outline-light btn-modern"
                  onClick={() => setShowChangeRequestModal(true)}
                  disabled={checkingPending}
                >
                  <i className="bi bi-arrow-repeat"></i>
                  {checkingPending ? "Checking..." : "Request Change"}
                </button>
                <button
                  className="btn btn-light btn-modern btn-primary"
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
                  className="btn btn-outline-danger btn-modern"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <i className="bi bi-x-circle"></i>
                  Cancel
                </button>
                <button
                  className="btn btn-success btn-modern"
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-sm"></span>
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
      <div className="profile-content-modern">
        <div className="content-grid">
          {/* Left Sidebar - Static Information */}
          <div className="sidebar-section">
            {/* Personal Details Card */}
            <div className="info-card">
              <div className="card-header-modern">
                <i className="bi bi-person-circle"></i>
                <h3>Personal Details</h3>
              </div>
              <div className="card-content">
                <div className="info-grid">
                  {/* Employee ID - Read Only */}
                  <div className="info-item-modern">
                    <label>Employee ID</label>
                    <span>{profileData.employeeCompanyId || "N/A"}</span>
                    <small>Cannot be changed</small>
                  </div>

                  {/* Gender - REQUIRED */}
                  <div className="info-item-modern">
                    <label>
                      Gender <span className="required">*</span>
                    </label>
                    {isEditing ? (
                      <div className="form-field">
                        <select
                          className={`form-control-modern ${
                            showError("gender") ? "error" : ""
                          }`}
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">
                            Prefer not to say
                          </option>
                        </select>
                        {showError("gender") && (
                          <span className="error-message">{errors.gender}</span>
                        )}
                      </div>
                    ) : (
                      <span>{profileData.gender || "N/A"}</span>
                    )}
                  </div>

                  {/* Date of Birth - OPTIONAL */}
                  <div className="info-item-modern">
                    <label>Date of Birth</label>
                    {isEditing ? (
                      <div className="form-field">
                        <input
                          type="date"
                          className={`form-control-modern ${
                            showError("dateOfBirthOfficial") ? "error" : ""
                          }`}
                          name="dateOfBirthOfficial"
                          value={formData.dateOfBirthOfficial}
                          onChange={handleChange}
                          max={new Date().toISOString().split("T")[0]}
                        />
                        {showError("dateOfBirthOfficial") && (
                          <span className="error-message">
                            {errors.dateOfBirthOfficial}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span>{formatDate(profileData.dateOfBirthOfficial)}</span>
                    )}
                  </div>

                  {/* Nationality - REQUIRED */}
                  <div className="info-item-modern">
                    <label>
                      Nationality <span className="required">*</span>
                    </label>
                    {isEditing ? (
                      <div className="form-field">
                        <select
                          className={`form-control-modern ${
                            showError("nationality") ? "error" : ""
                          }`}
                          name="nationality"
                          value={formData.nationality}
                          onChange={handleChange}
                        >
                          <option value="">Select Nationality</option>
                          {nationalityOptions.map((nat) => (
                            <option key={nat} value={nat}>
                              {nat}
                            </option>
                          ))}
                        </select>
                        {showError("nationality") && (
                          <span className="error-message">
                            {errors.nationality}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span>{profileData.nationality || "N/A"}</span>
                    )}
                  </div>

                  {/* Marital Status - REQUIRED */}
                  <div className="info-item-modern">
                    <label>
                      Marital Status <span className="required">*</span>
                    </label>
                    {isEditing ? (
                      <div className="form-field">
                        <select
                          className={`form-control-modern ${
                            showError("maritalStatus") ? "error" : ""
                          }`}
                          name="maritalStatus"
                          value={formData.maritalStatus}
                          onChange={handleChange}
                        >
                          <option value="">Select Status</option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Prefer not to say">
                            Prefer not to say
                          </option>
                        </select>
                        {showError("maritalStatus") && (
                          <span className="error-message">
                            {errors.maritalStatus}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span>{profileData.maritalStatus || "N/A"}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Employment Card */}
            <div className="info-card">
              <div className="card-header-modern">
                <i className="bi bi-building"></i>
                <h3>Employment</h3>
              </div>
              <div className="card-content">
                <div className="info-grid">
                  <div className="info-item-modern">
                    <label>Department</label>
                    <span>{profileData.departmentName || "N/A"}</span>
                  </div>
                  <div className="info-item-modern">
                    <label>Role</label>
                    <span>{profileData.roleName || "N/A"}</span>
                  </div>
                  <div className="info-item-modern">
                    <label>Employment Type</label>
                    <span>{profileData.employmentType || "N/A"}</span>
                  </div>
                  <div className="info-item-modern">
                    <label>Joining Date</label>
                    <span>{formatDate(profileData.joiningDate)}</span>
                  </div>
                  <div className="info-item-modern">
                    <label>Work Location</label>
                    <span>{profileData.workLocation || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Main Content - Editable Forms */}
          <div className="main-section">
            {/* Contact Information Card */}
            <div className="form-card">
              <div className="card-header-modern">
                <i className="bi bi-telephone"></i>
                <h3>Contact Information</h3>
              </div>
              <div className="card-content">
                <div className="form-grid">
                  {/* First Name - REQUIRED */}
                  <div className="form-field">
                    <label>
                      First Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control-modern ${
                        showError("firstName") ? "error" : ""
                      }`}
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="Enter first name"
                    />
                    {showError("firstName") && (
                      <span className="error-message">{errors.firstName}</span>
                    )}
                  </div>

                  {/* Middle Name - OPTIONAL */}
                  <div className="form-field">
                    <label>Middle Name</label>
                    <input
                      type="text"
                      className={`form-control-modern ${
                        showError("middleName") ? "error" : ""
                      }`}
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="Enter middle name"
                    />
                    {showError("middleName") && (
                      <span className="error-message">{errors.middleName}</span>
                    )}
                  </div>

                  {/* Last Name - REQUIRED */}
                  <div className="form-field">
                    <label>
                      Last Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control-modern ${
                        showError("lastName") ? "error" : ""
                      }`}
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="Enter last name"
                    />
                    {showError("lastName") && (
                      <span className="error-message">{errors.lastName}</span>
                    )}
                  </div>

                  {/* Calling Name - OPTIONAL */}
                  <div className="form-field">
                    <label>Calling Name</label>
                    <input
                      type="text"
                      className={`form-control-modern ${
                        showError("callingName") ? "error" : ""
                      }`}
                      name="callingName"
                      value={formData.callingName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="Enter preferred name"
                    />
                    {showError("callingName") && (
                      <span className="error-message">
                        {errors.callingName}
                      </span>
                    )}
                  </div>

                  {/* Company Email - Read Only */}
                  <div className="form-field">
                    <label>Company Email</label>
                    <input
                      type="email"
                      className="form-control-modern"
                      value={
                        profileData.email || profileData.companyEmail || "N/A"
                      }
                      disabled
                    />
                    <small>Cannot be changed</small>
                  </div>

                  {/* Personal Email - OPTIONAL */}
                  <div className="form-field">
                    <label>Personal Email</label>
                    <input
                      type="email"
                      className={`form-control-modern ${
                        showError("personalEmail") ? "error" : ""
                      }`}
                      name="personalEmail"
                      value={formData.personalEmail}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="Enter Gmail address"
                    />
                    {showError("personalEmail") && (
                      <span className="error-message">
                        {errors.personalEmail}
                      </span>
                    )}
                    <small>Gmail only</small>
                  </div>

                  {/* Mobile Number - REQUIRED */}
                  <div className="form-field">
                    <label>
                      Mobile Number <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control-modern ${
                        showError("mobileNumber") ? "error" : ""
                      }`}
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="Enter 10-digit mobile number"
                      maxLength="10"
                    />
                    {showError("mobileNumber") && (
                      <span className="error-message">
                        {errors.mobileNumber}
                      </span>
                    )}
                  </div>

                  {/* Alternate Number - OPTIONAL */}
                  <div className="form-field">
                    <label>Alternate Number</label>
                    <input
                      type="text"
                      className={`form-control-modern ${
                        showError("alternateNumber") ? "error" : ""
                      }`}
                      name="alternateNumber"
                      value={formData.alternateNumber}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="Enter 10-digit alternate number"
                      maxLength="10"
                    />
                    {showError("alternateNumber") && (
                      <span className="error-message">
                        {errors.alternateNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information Card */}
            <div className="form-card">
              <div className="card-header-modern">
                <i className="bi bi-geo-alt"></i>
                <h3>Address Information</h3>
              </div>
              <div className="card-content">
                {/* Current Address Section - ALL OPTIONAL */}
                <div className="address-section-modern">
                  <h4 className="section-title">Current Address</h4>
                  {!isEditing ? (
                    <div className="address-display-modern">
                      {formatAddress(profileData.currentAddress)}
                    </div>
                  ) : (
                    <div className="form-grid address-grid">
                      {/* All address fields are OPTIONAL */}
                      <div className="form-field">
                        <label>Door/Flat Number</label>
                        <input
                          type="text"
                          className={`form-control-modern ${
                            showError("currentAddress.doorNumber")
                              ? "error"
                              : ""
                          }`}
                          value={formData.currentAddress.doorNumber}
                          onChange={(e) =>
                            handleAddressChange(
                              "currentAddress",
                              "doorNumber",
                              e.target.value
                            )
                          }
                          placeholder="Enter door or flat number"
                        />
                        {showError("currentAddress.doorNumber") && (
                          <span className="error-message">
                            {errors["currentAddress.doorNumber"]}
                          </span>
                        )}
                      </div>

                      <div className="form-field">
                        <label>Street</label>
                        <input
                          type="text"
                          className={`form-control-modern ${
                            showError("currentAddress.street") ? "error" : ""
                          }`}
                          value={formData.currentAddress.street}
                          onChange={(e) =>
                            handleAddressChange(
                              "currentAddress",
                              "street",
                              e.target.value
                            )
                          }
                          placeholder="Enter street name"
                        />
                        {showError("currentAddress.street") && (
                          <span className="error-message">
                            {errors["currentAddress.street"]}
                          </span>
                        )}
                      </div>

                      <div className="form-field">
                        <label>Landmark</label>
                        <input
                          type="text"
                          className={`form-control-modern ${
                            showError("currentAddress.landmark") ? "error" : ""
                          }`}
                          value={formData.currentAddress.landmark}
                          onChange={(e) =>
                            handleAddressChange(
                              "currentAddress",
                              "landmark",
                              e.target.value
                            )
                          }
                          placeholder="Enter nearby landmark"
                        />
                        {showError("currentAddress.landmark") && (
                          <span className="error-message">
                            {errors["currentAddress.landmark"]}
                          </span>
                        )}
                      </div>

                      <div className="form-field">
                        <label>Area</label>
                        <input
                          type="text"
                          className={`form-control-modern ${
                            showError("currentAddress.area") ? "error" : ""
                          }`}
                          value={formData.currentAddress.area}
                          onChange={(e) =>
                            handleAddressChange(
                              "currentAddress",
                              "area",
                              e.target.value
                            )
                          }
                          placeholder="Enter area or locality"
                        />
                        {showError("currentAddress.area") && (
                          <span className="error-message">
                            {errors["currentAddress.area"]}
                          </span>
                        )}
                      </div>

                      <div className="form-field">
                        <label>City</label>
                        <input
                          type="text"
                          className={`form-control-modern ${
                            showError("currentAddress.city") ? "error" : ""
                          }`}
                          value={formData.currentAddress.city}
                          onChange={(e) =>
                            handleAddressChange(
                              "currentAddress",
                              "city",
                              e.target.value
                            )
                          }
                          placeholder="Enter city name"
                        />
                        {showError("currentAddress.city") && (
                          <span className="error-message">
                            {errors["currentAddress.city"]}
                          </span>
                        )}
                      </div>

                      <div className="form-field">
                        <label>State</label>
                        <select
                          className={`form-control-modern ${
                            showError("currentAddress.state") ? "error" : ""
                          }`}
                          value={formData.currentAddress.state}
                          onChange={(e) =>
                            handleAddressChange(
                              "currentAddress",
                              "state",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Select State</option>
                          {stateOptions.map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>
                        {showError("currentAddress.state") && (
                          <span className="error-message">
                            {errors["currentAddress.state"]}
                          </span>
                        )}
                      </div>

                      <div className="form-field">
                        <label>PIN Code</label>
                        <input
                          type="text"
                          className={`form-control-modern ${
                            showError("currentAddress.pinCode") ? "error" : ""
                          }`}
                          value={formData.currentAddress.pinCode}
                          onChange={(e) =>
                            handleAddressChange(
                              "currentAddress",
                              "pinCode",
                              e.target.value
                            )
                          }
                          placeholder="Enter 6-digit PIN code"
                          maxLength="6"
                        />
                        {showError("currentAddress.pinCode") && (
                          <span className="error-message">
                            {errors["currentAddress.pinCode"]}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Same Address Checkbox */}
                {isEditing && (
                  <div className="address-checkbox-modern">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={sameAsCurrentAddress}
                        onChange={handleSameAddressChange}
                      />
                      <span className="checkmark"></span>
                      Permanent address is same as current address
                    </label>
                  </div>
                )}

                {/* Permanent Address Section - ALL OPTIONAL */}
                <div className="address-section-modern">
                  <h4 className="section-title">Permanent Address</h4>
                  {!isEditing ? (
                    <div className="address-display-modern">
                      {formatAddress(profileData.permanentAddress)}
                    </div>
                  ) : (
                    <div className="form-grid address-grid">
                      <div className="form-field">
                        <label>Door/Flat Number</label>
                        <input
                          type="text"
                          className={`form-control-modern ${
                            showError("permanentAddress.doorNumber")
                              ? "error"
                              : ""
                          }`}
                          value={formData.permanentAddress.doorNumber}
                          onChange={(e) =>
                            handleAddressChange(
                              "permanentAddress",
                              "doorNumber",
                              e.target.value
                            )
                          }
                          disabled={sameAsCurrentAddress}
                          placeholder="Enter door or flat number"
                        />
                        {showError("permanentAddress.doorNumber") && (
                          <span className="error-message">
                            {errors["permanentAddress.doorNumber"]}
                          </span>
                        )}
                      </div>

                      <div className="form-field">
                        <label>Street</label>
                        <input
                          type="text"
                          className={`form-control-modern ${
                            showError("permanentAddress.street") ? "error" : ""
                          }`}
                          value={formData.permanentAddress.street}
                          onChange={(e) =>
                            handleAddressChange(
                              "permanentAddress",
                              "street",
                              e.target.value
                            )
                          }
                          disabled={sameAsCurrentAddress}
                          placeholder="Enter street name"
                        />
                        {showError("permanentAddress.street") && (
                          <span className="error-message">
                            {errors["permanentAddress.street"]}
                          </span>
                        )}
                      </div>

                      <div className="form-field">
                        <label>Landmark</label>
                        <input
                          type="text"
                          className={`form-control-modern ${
                            showError("permanentAddress.landmark")
                              ? "error"
                              : ""
                          }`}
                          value={formData.permanentAddress.landmark}
                          onChange={(e) =>
                            handleAddressChange(
                              "permanentAddress",
                              "landmark",
                              e.target.value
                            )
                          }
                          disabled={sameAsCurrentAddress}
                          placeholder="Enter nearby landmark"
                        />
                        {showError("permanentAddress.landmark") && (
                          <span className="error-message">
                            {errors["permanentAddress.landmark"]}
                          </span>
                        )}
                      </div>

                      <div className="form-field">
                        <label>Area</label>
                        <input
                          type="text"
                          className={`form-control-modern ${
                            showError("permanentAddress.area") ? "error" : ""
                          }`}
                          value={formData.permanentAddress.area}
                          onChange={(e) =>
                            handleAddressChange(
                              "permanentAddress",
                              "area",
                              e.target.value
                            )
                          }
                          disabled={sameAsCurrentAddress}
                          placeholder="Enter area or locality"
                        />
                        {showError("permanentAddress.area") && (
                          <span className="error-message">
                            {errors["permanentAddress.area"]}
                          </span>
                        )}
                      </div>

                      <div className="form-field">
                        <label>City</label>
                        <input
                          type="text"
                          className={`form-control-modern ${
                            showError("permanentAddress.city") ? "error" : ""
                          }`}
                          value={formData.permanentAddress.city}
                          onChange={(e) =>
                            handleAddressChange(
                              "permanentAddress",
                              "city",
                              e.target.value
                            )
                          }
                          disabled={sameAsCurrentAddress}
                          placeholder="Enter city name"
                        />
                        {showError("permanentAddress.city") && (
                          <span className="error-message">
                            {errors["permanentAddress.city"]}
                          </span>
                        )}
                      </div>

                      <div className="form-field">
                        <label>State</label>
                        <select
                          className={`form-control-modern ${
                            showError("permanentAddress.state") ? "error" : ""
                          }`}
                          value={formData.permanentAddress.state}
                          onChange={(e) =>
                            handleAddressChange(
                              "permanentAddress",
                              "state",
                              e.target.value
                            )
                          }
                          disabled={sameAsCurrentAddress}
                        >
                          <option value="">Select State</option>
                          {stateOptions.map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>
                        {showError("permanentAddress.state") && (
                          <span className="error-message">
                            {errors["permanentAddress.state"]}
                          </span>
                        )}
                      </div>

                      <div className="form-field">
                        <label>PIN Code</label>
                        <input
                          type="text"
                          className={`form-control-modern ${
                            showError("permanentAddress.pinCode") ? "error" : ""
                          }`}
                          value={formData.permanentAddress.pinCode}
                          onChange={(e) =>
                            handleAddressChange(
                              "permanentAddress",
                              "pinCode",
                              e.target.value
                            )
                          }
                          disabled={sameAsCurrentAddress}
                          placeholder="Enter 6-digit PIN code"
                          maxLength="6"
                        />
                        {showError("permanentAddress.pinCode") && (
                          <span className="error-message">
                            {errors["permanentAddress.pinCode"]}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Auto-filled Notice */}
                  {isEditing && sameAsCurrentAddress && (
                    <div className="address-auto-filled">
                      <i className="bi bi-info-circle"></i>
                      Address automatically filled from current address
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Request Modal */}
      <ChangeRequestModal
        show={showChangeRequestModal}
        onClose={handleModalClose}
        onSubmit={handleChangeRequest}
        profileData={profileData}
        hasPendingRequest={hasPendingRequest}
        pendingRequestId={pendingRequestId}
      />
    </div>
  );
};

export default EmployeeProfile;
