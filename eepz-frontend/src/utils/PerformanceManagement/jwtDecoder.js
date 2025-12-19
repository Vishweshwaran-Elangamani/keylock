export const decodeToken = (token) => {
  try {
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length !== 3) {
      
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
    
    return {};
  }
};


export const getEmployeeIdForFilter = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const empId = user.empId || user.employeeId || user.employeeCompanyId;

    if (empId) {
      
      return empId;
    }

    
    return null;
  } catch (error) {
    
    return null;
  }
};

