export const POLICY_CATEGORIES = {
  HR: "HR",
  IT: "IT",
  FINANCE: "Finance",
  OPERATIONS: "Operations",
};

export const POLICY_CATEGORY_OPTIONS = [
  { value: "HR", label: "HR", color: "#667eea", icon: "bi-people" },
  { value: "IT", label: "IT", color: "#4facfe", icon: "bi-laptop" },
  {
    value: "Finance",
    label: "Finance",
    color: "#43e97b",
    icon: "bi-cash-coin",
  },
  {
    value: "Operations",
    label: "Operations",
    color: "#fa709a",
    icon: "bi-gear",
  },
];

export const getPolicyCategoryColor = (category) => {
  const found = POLICY_CATEGORY_OPTIONS.find((opt) => opt.value === category);
  return found ? found.color : "#6c757d";
};

export const getPolicyCategoryIcon = (category) => {
  const found = POLICY_CATEGORY_OPTIONS.find((opt) => opt.value === category);
  return found ? found.icon : "bi-file-text";
};
