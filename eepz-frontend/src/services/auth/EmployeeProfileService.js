import api from "../api";

const EmployeeProfileService = {
  getMyProfile: async () => {
    try {
      const response = await api.get("/Profile");
      return response.data;
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error.response?.data || { message: "Failed to fetch profile" };
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await api.put("/Profile", profileData);
      return response.data;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error.response?.data || { message: "Failed to update profile" };
    }
  },

  getProfileById: async (userId) => {
    try {
      const response = await api.get(`/Profile/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching profile by ID:", error);
      throw error.response?.data || { message: "Failed to fetch profile" };
    }
  },
};

export default EmployeeProfileService;
