import { toast } from "sonner";

/**
 * Validates individual profile fields
 */
export const validateField = (name, value, formData = {}) => {
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
export const validateAddressField = (addressType, field, value) => {
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
 * Validates entire form before submission
 */
export const validateForm = (formData, setErrors) => {
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
      const error = validateField(field, formData[field], formData);
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
