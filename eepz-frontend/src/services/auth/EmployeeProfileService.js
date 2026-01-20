import api from "./api";
const EmployeeProfileService = {
  /**
   * Get current logged-in user's profile
   */
  getMyProfile: async () => {
    try {
      const response = await api.get("/User/profile");
      return response.data;
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error.response?.data || { message: "Failed to fetch profile" };
    }
  },
  /**
   * Get profile (alias for getMyProfile for compatibility)
   */
  getProfile: async () => {
    try {
      const response = await api.get("/User/profile");
      return response.data;
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error.response?.data || { message: "Failed to fetch profile" };
    }
  },
  /**
   * Update current user's profile
   */
  updateProfile: async (profileData) => {
    try {
      const response = await api.put("/User/profile", profileData);
      return response.data;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error.response?.data || { message: "Failed to update profile" };
    }
  },
  /**
   * Get profile by specific user ID (Admin/HR use)
   */
  getProfileById: async (Id) => {
    try {
      const response = await api.get(`/User/profile/${Id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching profile by ID:", error);
      throw error.response?.data || { message: "Failed to fetch profile" };
    }
  },
  /**
   * Upload/Update profile photo only
   * Uses dedicated endpoint: PUT /User/profile/upload-photo
   * @param {FormData} formData - Form data containing ProfilePhoto file
   * @returns {Promise} - API response with updated profile including photo
   */
  updateProfilePhoto: async (formData) => {
    try {
      const response = await api.put("/User/profile/upload-photo", formData);
      return response.data;
    } catch (error) {
      console.error("Error updating profile photo:", error);
      console.error("Error response:", error.response?.data);
      throw error.response?.data || { message: "Failed to update profile photo" };
    }
  },
};
export default EmployeeProfileService;
