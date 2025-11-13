export const POLICY_STATUS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  DRAFT: "Draft",
};

export const POLICY_STATUS_OPTIONS = [
  {
    value: "Active",
    label: "Active",
    color: "success",
    badgeClass: "bg-success",
  },
  {
    value: "Inactive",
    label: "Inactive",
    color: "secondary",
    badgeClass: "bg-secondary",
  },
  {
    value: "Draft",
    label: "Draft",
    color: "warning",
    badgeClass: "bg-warning",
  },
];

export const getPolicyStatusBadgeClass = (status) => {
  const found = POLICY_STATUS_OPTIONS.find((opt) => opt.value === status);
  return found ? found.badgeClass : "bg-secondary";
};
