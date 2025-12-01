export const decodeToken = (token) => {
  try {
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid token format');
      return null;
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};


export const getUserIdFromToken = () => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    const claims = decodeToken(token);
    if (!claims) return null;

    return claims.sub || claims.UserId || null;
  } catch (error) {
    console.error('Error getting user ID from token:', error);
    return null;
  }
};


export const getCurrentUserData = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = localStorage.getItem('userId');
    const email = localStorage.getItem('email');
    const role = localStorage.getItem('userRole');

    return {
      userId: userId || user.userId,
      email: email || user.email,
      role: role || user.roleName,
      empId: user.empId || user.employeeId,
      name: user.name || user.fullName,
      ...user
    };
  } catch (error) {
    console.error('Error getting current user data:', error);
    return {};
  }
};


export const getEmployeeIdForFilter = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const empId = user.empId || user.employeeId || user.employeeCompanyId;

    if (empId) {
      console.log(' Employee ID for filter:', empId);
      return empId;
    }

    console.warn(' Employee ID not found in user data');
    return null;
  } catch (error) {
    console.error('Error getting employee ID:', error);
    return null;
  }
};

