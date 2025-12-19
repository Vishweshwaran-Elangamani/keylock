import axios from 'axios';

const API_BASE_URL ='https://localhost:5101/api';

// Get auth token
const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to every request
apiClient.interceptors.request.use(
    (config) => {
        const token = getAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Chatbot API Service
export const chatbotService = {
    // ==================== CHATBOT ENDPOINTS ====================
    
    // Send message to chatbot
    sendMessage: async (message, sessionId) => {
        try {
            const response = await apiClient.post('/Chatbot/message', {
                message,
                sessionId,
            });
            return response.data;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error.response?.data || { message: 'Failed to send message' };
        }
    },

    // Get conversation history
    getHistory: async (sessionId) => {
        try {
            const response = await apiClient.get(`/Chatbot/history/${sessionId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching history:', error);
            throw error.response?.data || { message: 'Failed to fetch history' };
        }
    },

    // ==================== REAL DATA FETCHING - CORRECTED ENDPOINTS ====================
    
    // Fetch all users
    getAllUsers: async () => {
        try {
            const response = await apiClient.get('/User/all');
            return response.data;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },

    // Fetch all roles - CORRECTED ENDPOINT
    getAllRoles: async () => {
        try {
            const response = await apiClient.get('/RoleDepartmentManagement/role/all');
            return response.data;
        } catch (error) {
            console.error('Error fetching roles:', error);
            throw error;
        }
    },

    // Fetch all departments - CORRECTED ENDPOINT
    getAllDepartments: async () => {
        try {
            const response = await apiClient.get('/RoleDepartmentManagement/department/all');
            return response.data;
        } catch (error) {
            console.error('Error fetching departments:', error);
            throw error;
        }
    },

    // Fetch change requests
    getAllChangeRequests: async () => {
        try {
            const response = await apiClient.get('/ChangeRequest/all');
            return response.data;
        } catch (error) {
            console.error('Error fetching change requests:', error);
            throw error;
        }
    },

    // Fetch pending requests
    getPendingRequests: async () => {
        try {
            const response = await apiClient.get('/ChangeRequest/pending');
            return response.data;
        } catch (error) {
            console.error('Error fetching pending requests:', error);
            throw error;
        }
    },
};

export default chatbotService;
