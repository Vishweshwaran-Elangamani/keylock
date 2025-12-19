import api from "../api/api";


export const createForm = async (payload) => {
  try {
    const response = await api.post("/FormManagement/create", payload);
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
    const response = await api.get(`/FormManagement/${id}`);
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
    const response = await api.get("/FormManagement/all");
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
    const response = await api.put(`/FormManagement/${id}`, payload);
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
    const response = await api.delete(`/FormManagement/${id}`);
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
    const response = await api.delete(`/FormManagement/draft/${assignmentId}`);
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
