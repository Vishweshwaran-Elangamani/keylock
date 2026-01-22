import api from './api';
const ChangeRequestService = {
  submitChangeRequest: async (requestData) => {
    try {
      const response = await api.post('/ChangeRequest/submit', requestData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Change request submitted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.response?.data?.Message || 'Failed to submit change request'
      };
    }
  },
  getMyChangeRequests: async () => {
    try {
      const response = await api.get('/ChangeRequest/my-requests');
      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch change requests',
        data: []
      };
    }
  },
  hasPendingRequest: async () => {
    try {
      const response = await api.get('/ChangeRequest/has-pending');
      return {
        success: true,
        data: response.data.data, 
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to check pending request',
        data: null
      };
    }
  },
  cancelChangeRequest: async (Id) => {
    try {
      const response = await api.delete(`/ChangeRequest/cancel/${Id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Change request cancelled successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.response?.data?.Message || 'Failed to cancel change request'
      };
    }
  },
  getPendingRequests: async () => {
    try {
      const response = await api.get('/ChangeRequest/pending');
      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch pending requests',
        data: []
      };
    }
  },
  getAllChangeRequests: async () => {
    try {
      const response = await api.get('/ChangeRequest/all');
      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch all requests',
        data: []
      };
    }
  },
  processChangeRequest: async (processData) => {
    try {
      const response = await api.post('/ChangeRequest/process', processData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || `Change request ${processData.Status === 'Approved' ? 'approved' : 'rejected'} successfully`
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.response?.data?.Message || 'Failed to process change request'
      };
    }
  }
};
export default ChangeRequestService;
