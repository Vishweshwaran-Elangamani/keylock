import api from '../api';

const ChangeRequestService = {
  // Employee: Submit a change request (EmployeeCompanyId or Email only)
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

  // Employee: Get my change requests
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

  // Employee: Check if user has pending request
  hasPendingRequest: async () => {
    try {
      const response = await api.get('/ChangeRequest/has-pending');
      return {
        success: true,
        data: response.data.data, // Will be null if no pending request
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

  // Employee: Cancel a pending change request
  cancelChangeRequest: async (requestId) => {
    try {
      const response = await api.delete(`/ChangeRequest/cancel/${requestId}`);
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

  // Admin: Get all pending change requests
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

  // Admin: Get all change requests
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

  // Admin: Process (approve/reject) a change request
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