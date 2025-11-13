// export const formatDate = (date) => {
//   return new Date(date).toLocaleDateString("en-IN");
// };


/**
 * Auth Helper Functions
 * Contains utility functions for authentication and user data formatting
 */

// ==========================================
// EXISTING FUNCTION - KEPT AS IS
// ==========================================

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-IN");
};

// ==========================================
// NEW USER UTILITY FUNCTIONS - ADDED
// ==========================================

/**
 * Get user display name with fallback priority
 * @param {object} user - User object from localStorage/context
 * @returns {string} - Display name
 */
export const getUserDisplayName = (user) => {
  if (!user) return 'User';

  // Priority: name > fullName > firstName + lastName > email prefix > empId
  if (user.name && user.name.trim()) {
    return user.name.trim();
  }
  
  if (user.fullName && user.fullName.trim()) {
    return user.fullName.trim();
  }
  
  if (user.firstName && user.lastName) {
    return `${user.firstName.trim()} ${user.lastName.trim()}`;
  }
  
  if (user.firstName) {
    return user.firstName.trim();
  }
  
  if (user.email) {
    // Extract name from email (before @)
    const emailName = user.email.split('@')[0];
    return emailName.replace(/[._-]/g, ' ').trim();
  }
  
  if (user.empId) {
    return user.empId;
  }
  
  return 'User';
};

/**
 * Get user initials (first 2 letters)
 * @param {object|string} userOrName - User object or name string
 * @returns {string} - Two letter initials (uppercase)
 */
export const getUserInitials = (userOrName) => {
  // Handle if passed a user object
  let name = userOrName;
  if (typeof userOrName === 'object' && userOrName !== null) {
    name = getUserDisplayName(userOrName);
  }

  if (!name || typeof name !== 'string') return 'U';

  // Clean and split name
  const nameParts = name
    .trim()
    .split(/\s+/)
    .filter(part => part.length > 0);

  if (nameParts.length === 0) return 'U';

  // If single name part, take first 2 characters
  if (nameParts.length === 1) {
    return nameParts[0].substring(0, 2).toUpperCase();
  }

  // Take first letter of first name and first letter of last name
  const firstInitial = nameParts[0].charAt(0).toUpperCase();
  const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
  
  return firstInitial + lastInitial;
};

/**
 * Get user email with fallback
 * @param {object} user - User object
 * @returns {string} - Email address
 */
export const getUserEmail = (user) => {
  if (!user) return 'user@eepz.com';
  return user.email || 'user@eepz.com';
};

/**
 * Get employee ID with fallback
 * @param {object} user - User object
 * @returns {string} - Employee ID
 */
export const getEmployeeId = (user) => {
  if (!user) return 'N/A';
  return user.empId || user.employeeId || user.employeeCompanyId || 'N/A';
};

/**
 * Get user role name with fallback
 * @param {object} user - User object
 * @returns {string} - Role name
 */
export const getUserRole = (user) => {
  if (!user) return 'User';
  return user.role || user.roleName || 'User';
};

/**
 * Generate consistent avatar color based on name
 * @param {string} name - User's name
 * @returns {string} - Hex color code
 */
export const getAvatarColor = (name) => {
  if (!name) return '#6B7280'; // Default gray
  
  // Generate hash from name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Color palette (EEPZ brand colors included)
  const colors = [
    '#AC5098', // purple (EEPZ primary)
    '#97247E', // darker purple (EEPZ secondary)
    '#5a9fd4', // blue (EEPZ accent)
    '#EF4444', // red
    '#F59E0B', // amber
    '#10B981', // emerald
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange
  ];
  
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Format user data for display (convenience function)
 * @param {object} user - User object
 * @returns {object} - Formatted user display data
 */
export const formatUserDisplay = (user) => {
  return {
    name: getUserDisplayName(user),
    initials: getUserInitials(user),
    email: getUserEmail(user),
    empId: getEmployeeId(user),
    role: getUserRole(user),
    avatarColor: getAvatarColor(getUserDisplayName(user))
  };
};
