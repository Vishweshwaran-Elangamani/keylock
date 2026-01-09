import { useState, useEffect } from "react";
import { toast } from "sonner";
import EmployeeProfileService from "../../../services/auth/EmployeeProfileService";
import ChangeRequestService from "../../../services/auth/changeRequestService";
import { validateField, validateAddressField, validateForm } from "../../../utils/auth/employeeprofile/profileValidation";
import { nationalityOptions, stateOptions } from "../../../utils/auth/employeeprofile/profileHelpers";

const useEmployeeProfile = () => {
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
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);

  // Effects
  useEffect(() => {
    fetchProfileData();
    checkPendingRequest();
  }, []);

  useEffect(() => {
    if (profileData?.profilePhotoBase64) {
      setProfilePhoto(
        `data:image/jpeg;base64,${profileData.profilePhotoBase64}`
      );
    }
  }, [profileData]);

  useEffect(() => {
    if (sameAsCurrentAddress && isEditing) {
      setFormData((prev) => ({
        ...prev,
        permanentAddress: { ...prev.currentAddress },
      }));
    }
  }, [formData.currentAddress, sameAsCurrentAddress, isEditing]);

  // Data fetching functions
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

  // Form initialization
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

  // Handlers
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
    const error = validateField(name, value, formData);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

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

    if (!validateForm(formData, setErrors)) {
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

  const handleCancel = () => {
    setIsEditing(false);
    setSameAsCurrentAddress(false);
    initializeFormData(profileData);
    toast.info("Changes discarded");
  };

  const handleCameraClick = () => {
    setShowPhotoModal(true);
  };

  const handlePhotoUpdate = async (newPhotoUrl) => {
    setProfilePhoto(newPhotoUrl);
    await fetchProfileData();
  };

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

  const showError = (fieldName) => {
    return touched[fieldName] && errors[fieldName];
  };

  return {
    profileData,
    loading,
    isEditing,
    setIsEditing,
    formData,
    setFormData,
    errors,
    setErrors,
    saving,
    sameAsCurrentAddress,
    touched,
    setTouched,
    showChangeRequestModal,
    setShowChangeRequestModal,
    hasPendingRequest,
    pendingRequestId,
    checkingPending,
    showPhotoModal,
    setShowPhotoModal,
    profilePhoto,
    nationalityOptions,
    stateOptions,
    fetchProfileData,
    handleChange,
    handleAddressChange,
    handleSameAddressChange,
    handleSubmit,
    handleCancel,
    handleCameraClick,
    handlePhotoUpdate,
    handleChangeRequest,
    handleModalClose,
    showError,
    validateField,
  };
};

export default useEmployeeProfile;
