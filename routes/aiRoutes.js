const express = require('express');
const router = express.Router();
const { explainTopic, generatePracticeQuestions, getStudyRecommendations } = require('../services/geminiService');

// POST /api/ai/explain-topic
router.post('/explain-topic', async (req, res) => {
    try {
        const { topic, subject } = req.body;

        if (!topic || !subject) {
            return res.status(400).json({ message: 'Topic and subject are required' });
        }

        const explanation = await explainTopic(topic, subject);
        res.json({ explanation });
    } catch (error) {
        console.error('Error explaining topic:', error);
        res.status(500).json({ message: 'Failed to explain topic', error: error.message });
    }
});

// POST /api/ai/practice-questions
router.post('/practice-questions', async (req, res) => {
    try {
        const { subject, topics, examType } = req.body;

        if (!subject || !topics) {
            return res.status(400).json({ message: 'Subject and topics are required' });
        }

        const questions = await generatePracticeQuestions(subject, topics, examType);
        res.json({ questions });
    } catch (error) {
        console.error('Error generating practice questions:', error);
        res.status(500).json({ message: 'Failed to generate questions', error: error.message });
    }
});

// POST /api/ai/study-recommendations
router.post('/study-recommendations', async (req, res) => {
    try {
        const { subject, insights } = req.body;

        if (!subject || !insights) {
            return res.status(400).json({ message: 'Subject and insights are required' });
        }

        const recommendations = await getStudyRecommendations(subject, insights);
        res.json({ recommendations });
    } catch (error) {
        console.error('Error getting study recommendations:', error);
        res.status(500).json({ message: 'Failed to get recommendations', error: error.message });
    }
});

module.exports = router;
