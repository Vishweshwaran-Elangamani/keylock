import api from "../api/api";


export const createForm = async (payload) => {
  try {
    console.log(" Creating new form...", payload);
    const response = await api.post("/FormManagement/create", payload);
    console.log(" Form created successfully", response.data);
    return response.data;
  } catch (error) {
    console.error(
      " Error creating form:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getFormById = async (id) => {
  try {
    console.log(" Fetching form with ID:", id);
    const response = await api.get(`/FormManagement/${id}`);
    console.log(" Form retrieved successfully", response.data);
    return response.data;
  } catch (error) {
    console.error(
      " Error fetching form:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getAllForms = async () => {
  try {
    console.log(" Fetching all forms...");
    const response = await api.get("/FormManagement/all");
    console.log(" All forms retrieved successfully", response.data);
    return response.data;
  } catch (error) {
    console.error(
      " Error fetching forms:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const updateForm = async (id, payload) => {
  try {
    console.log(" Updating form with ID:", id, payload);
    const response = await api.put(`/FormManagement/${id}`, payload);
    console.log(" Form updated successfully", response.data);
    return response.data;
  } catch (error) {
    console.error(
      " Error updating form:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const deleteForm = async (id) => {
  try {
    console.log(" Deleting form with ID:", id);
    const response = await api.delete(`/FormManagement/${id}`);
    console.log(" Form deleted successfully", response.data);
    return response.data;
  } catch (error) {
    console.error(
      " Error deleting form:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const deleteDraft = async (assignmentId) => {
  try {
    console.log(" Deleting draft with Assignment ID:", assignmentId);
    const response = await api.delete(`/FormManagement/draft/${assignmentId}`);
    console.log(" Draft deleted successfully", response.data);
    return response.data;
  } catch (error) {
    console.error(
      " Error deleting draft:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export default {
  createForm,
  getFormById,
  getAllForms,
  updateForm,
  deleteForm,
  deleteDraft,
};
