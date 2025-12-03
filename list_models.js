const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        // Note: The SDK might not expose listModels directly on the main class in all versions,
        // but usually it's available via a model manager or similar.
        // However, for the JS SDK, we might need to check documentation or just try a standard request.
        // Actually, the error message suggested calling ListModels.
        // Let's try to use the API directly via axios if SDK doesn't make it obvious, 
        // but let's try to see if we can find a working model by just trying 'gemini-1.5-flash-001' first as it's very specific.
        // But to be sure, let's try to fetch models via REST API using the key.

        const axios = require('axios');
        const key = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

        const res = await axios.get(url);
        console.log('Available Models:');
        res.data.models.forEach(m => {
            if (m.supportedGenerationMethods.includes('generateContent')) {
                console.log(`- ${m.name}`);
            }
        });

    } catch (error) {
        console.error('Error listing models:', error.response ? error.response.data : error.message);
    }
}

listModels();
