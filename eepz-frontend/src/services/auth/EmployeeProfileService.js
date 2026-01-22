import api from "./api";
const EmployeeProfileService = {
  getMyProfile: async () => {
    try {
      const response = await api.get("/User/profile");
      return response.data;
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error.response?.data || { message: "Failed to fetch profile" };
    }
  },
  getProfile: async () => {
    try {
      const response = await api.get("/User/profile");
      return response.data;
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error.response?.data || { message: "Failed to fetch profile" };
    }
  },
  updateProfile: async (profileData) => {
    try {
      const response = await api.put("/User/profile", profileData);
      return response.data;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error.response?.data || { message: "Failed to update profile" };
    }
  },
  getProfileById: async (Id) => {
    try {
      const response = await api.get(`/User/profile/${Id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching profile by ID:", error);
      throw error.response?.data || { message: "Failed to fetch profile" };
    }
  },
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
