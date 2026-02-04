/**
 * Gets initials from first and last name
 */
export const getInitials = (firstName, lastName) => {
  if (!firstName && !lastName) return "NA";
  const first = firstName ? firstName[0] : "";
  const last = lastName ? lastName[0] : "";
  return (first + last).toUpperCase();
};

/**
 * Formats date to readable format
 */
export const formatDate = (dateString) => {
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
export const formatAddress = (address) => {
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
export const getStatusBadgeClass = (status) => {
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
 * Nationality dropdown options
 */
export const nationalityOptions = [
  "American",
"Argentinian",
"Australian",
"Austrian",
"Bangladeshi",
"Belgian",
"Brazilian",
"British",
"Canadian",
"Chinese",
"Colombian",
"Danish",
"Dutch",
"Finnish",
"French",
"German",
"Greek",
"Hungarian",
"Indian",
"Indonesian",
"Irish",
"Italian",
"Japanese",
"Korean",
"Malaysian",
"Mexican",
"Nepalese",
"New Zealander",
"Nigerian",
"Norwegian",
"Other",
"Pakistani",
"Polish",
"Portuguese",
"Russian",
"Saudi",
"Singaporean",
"South African",
"Spanish",
"Sri Lankan",
"Swedish",
"Swiss",
"Thai",
"Turkish",
"Ukrainian",
"Vietnamese",
"Other"
];

/**
 * Indian states dropdown options
 */
export const stateOptions = [
"Andaman and Nicobar Islands",
"Andhra Pradesh",
"Arunachal Pradesh",
"Assam",
"Bihar",
"Chandigarh",
"Chhattisgarh",
"Dadra and Nagar Haveli and Daman and Diu",
"Delhi",
"Goa",
"Gujarat",
"Haryana",
"Himachal Pradesh",
"Jammu and Kashmir",
"Jharkhand",
"Karnataka",
"Kerala",
"Ladakh",
"Lakshadweep",
"Madhya Pradesh",
"Maharashtra",
"Manipur",
"Meghalaya",
"Mizoram",
"Nagaland",
"Odisha",
"Other",
"Punjab",
"Puducherry",
"Rajasthan",
"Sikkim",
"Tamil Nadu",
"Telangana",
"Tripura",
"Uttar Pradesh",
"Uttarakhand",
"West Bengal"
];
