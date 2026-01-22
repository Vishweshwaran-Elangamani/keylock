export const STATUS_COLOR_MAP = {
  Active: "success",
  "On Hold": "warning",
  Completed: "info",
  Cancelled: "danger",
};

export const getStatusColor = (status) => {
  return STATUS_COLOR_MAP[status] || "secondary";
};
