const express = require('express');
const router = express.Router();
const QuestionPaper = require('../models/QuestionPaper');
const Insight = require('../models/Insight');
const { analyzePaper } = require('../services/geminiService');

// POST /api/insights/generate
router.post('/generate', async (req, res) => {
    try {
        const { subject } = req.body;

        if (!subject) {
            return res.status(400).json({ message: 'Subject is required' });
        }

        // Fetch all papers for the subject
        const papers = await QuestionPaper.find({ subject: new RegExp(`^${subject}$`, 'i') });

        if (papers.length === 0) {
            return res.status(404).json({ message: 'No question papers found for this subject' });
        }

        // Combine text from all papers (limit to avoid huge payloads if necessary, but for now combine all)
        // For better results, we might want to process them individually or in batches, but let's concatenate for MVP
        let combinedText = papers.map(p => `--- Year: ${p.year}, Semester: ${p.semester} ---\n${p.extractedText}`).join('\n\n');

        // Generate insights using Gemini
        const analysisResult = await analyzePaper(combinedText, subject);

        // Save or Update Insights
        let insight = await Insight.findOne({ subject: new RegExp(`^${subject}$`, 'i') });

        if (insight) {
            // Update existing
            insight.repeatedQuestions = analysisResult.repeatedQuestions;
            insight.unitWeightage = analysisResult.unitWeightage;
            insight.importantTopics = analysisResult.importantTopics;
            insight.frequentlyTestedConcepts = analysisResult.frequentlyTestedConcepts;
            insight.generatedAt = Date.now();
        } else {
            // Create new
            insight = new Insight({
                subject: subject,
                repeatedQuestions: analysisResult.repeatedQuestions,
                unitWeightage: analysisResult.unitWeightage,
                importantTopics: analysisResult.importantTopics,
                frequentlyTestedConcepts: analysisResult.frequentlyTestedConcepts
            });
        }

        await insight.save();

        res.json({ message: 'Insights generated successfully', insight });
    } catch (error) {
        console.error('Error generating insights:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/insights/:subject
router.get('/:subject', async (req, res) => {
    try {
        const insight = await Insight.findOne({ subject: new RegExp(`^${req.params.subject}$`, 'i') });
        if (!insight) {
            return res.status(404).json({ message: 'Insights not found for this subject' });
        }
        res.json(insight);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
