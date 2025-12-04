import api from "./api";

const EmployeeProfileService = {
  /**
   * Get current logged-in user's profile
   */
  getMyProfile: async () => {
    try {
      const response = await api.get("/Profile");
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
      const response = await api.get("/Profile");
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
      const response = await api.put("/Profile", profileData);
      return response.data;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error.response?.data || { message: "Failed to update profile" };
    }
  },

  /**
   * Get profile by specific user ID (Admin/HR use)
   */
  getProfileById: async (userId) => {
    try {
      const response = await api.get(`/Profile/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching profile by ID:", error);
      throw error.response?.data || { message: "Failed to fetch profile" };
    }
  },

  /**
   * Upload/Update profile photo only
   * Uses dedicated endpoint: PUT /Profile/upload-photo
   * @param {FormData} formData - Form data containing ProfilePhoto file
   * @returns {Promise} - API response with updated profile including photo
   */
  updateProfilePhoto: async (formData) => {
    try {
      console.log("Calling API: PUT /Profile/upload-photo");
      
      const response = await api.put("/Profile/upload-photo", formData);
      
      console.log("Photo upload API response:", response.data);
      
      return response.data;
    } catch (error) {
      console.error("Error updating profile photo:", error);
      console.error("Error response:", error.response?.data);
      throw error.response?.data || { message: "Failed to update profile photo" };
    }
  },
};

export default EmployeeProfileService;
