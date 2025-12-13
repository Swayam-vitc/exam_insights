import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle 401 responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Authentication API functions
export const loginUser = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
};

export const signupUser = async (name, email, password) => {
    const response = await api.post('/auth/signup', { name, email, password });
    return response.data;
};

export const getCurrentUser = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};

export const logoutUser = async () => {
    const response = await api.post('/auth/logout');
    return response.data;
};

// Upload a question paper
export const uploadPaper = async (formData) => {
    const response = await axios.post('/api/papers/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// Get all papers or filter by subject (with pagination support)
export const getPapers = async (params = {}) => {
    const response = await api.get('/papers', {
        params,
        paramsSerializer: {
            indexes: null // This ensures arrays are sent as subjects[]=value1&subjects[]=value2
        }
    });
    return response.data;
};

// Download a paper PDF
export const downloadPaper = async (paperId) => {
    const response = await axios.get(`/api/papers/download/${paperId}`, {
        responseType: 'blob',
    });
    return response.data;
};

// Generate insights for a subject
export const generateInsights = async (subject) => {
    const response = await api.post('/insights/generate', { subject });
    return response.data;
};

// Get existing insights for a subject
export const getInsights = async (subject) => {
    const response = await api.get(`/insights/${subject}`);
    return response.data;
};

// Get insights for a specific paper
export const getPaperInsights = async (paperId) => {
    const response = await api.get(`/papers/${paperId}/insights`);
    return response.data;
};

// Chat API functions
export const getChatHistory = async (paperId) => {
    const response = await api.get(`/chat/${paperId}`);
    return response.data;
};

export const sendChatMessage = async (paperId, message) => {
    const response = await api.post(`/chat/${paperId}`, { message });
    return response.data;
};

export const clearChatHistory = async (paperId) => {
    const response = await api.delete(`/chat/${paperId}`);
    return response.data;
};

export default api;
