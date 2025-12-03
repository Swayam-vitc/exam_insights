import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

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
    const response = await api.get('/papers', { params });
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
