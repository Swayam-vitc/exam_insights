const axios = require('axios');

async function testInsights() {
    try {
        console.log('Testing Insight Generation for "Data Structures Test"...');
        const res = await axios.post('http://localhost:5001/api/insights/generate', {
            subject: 'Data Structures Test'
        });
        console.log('✅ Insights Generated:', JSON.stringify(res.data, null, 2));
    } catch (error) {
        console.error('❌ Insight Generation Failed:', error.response ? error.response.data : error.message);
        if (error.response) console.error('Status:', error.response.status);
        console.error('Full Error:', error);
    }
}

testInsights();
