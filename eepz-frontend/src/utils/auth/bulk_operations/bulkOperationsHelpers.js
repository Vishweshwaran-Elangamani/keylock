export const categorizeErrors = (errors) => {
  const categorized = {
    duplicateEmails: [],
    validationErrors: [],
    otherErrors: [],
  };

  errors.forEach((error) => {
    const errorStr = error.toLowerCase();

    if (
      errorStr.includes("email") &&
      (errorStr.includes("already") ||
        errorStr.includes("exists") ||
        errorStr.includes("duplicate"))
    ) {
      categorized.duplicateEmails.push(error);
    } else if (errorStr.includes("row")) {
      categorized.validationErrors.push(error);
    } else {
      categorized.otherErrors.push(error);
    }
  });

  return categorized;
};

export const validateFile = (file) => {
  const errors = [];

  const validExtensions = [".xlsx", ".xls"];
  const fileExtension = file.name
    .substring(file.name.lastIndexOf("."))
    .toLowerCase();

  if (!validExtensions.includes(fileExtension)) {
    errors.push("Invalid file format. Only .xlsx and .xls files are allowed");
  }

  const maxSizeInBytes = 5 * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    errors.push("File size exceeds 5MB limit");
  }

  if (file.name.length > 100) {
    errors.push("File name is too long (max 100 characters)");
  }

  return errors;
};
