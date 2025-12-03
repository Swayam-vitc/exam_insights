const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');
const QuestionPaper = require('../models/QuestionPaper');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// GET /api/chat/:paperId - Get chat history for a specific paper
router.get('/:paperId', async (req, res) => {
    try {
        const { paperId } = req.params;

        const messages = await ChatMessage.find({ paperId })
            .sort({ timestamp: 1 })
            .limit(100); // Limit to last 100 messages

        res.json({ messages });
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ message: 'Failed to fetch chat history', error: error.message });
    }
});

// POST /api/chat/:paperId - Send a message and get AI response
router.post('/:paperId', async (req, res) => {
    try {
        const { paperId } = req.params;
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        // Get the paper details for context
        const paper = await QuestionPaper.findById(paperId);
        if (!paper) {
            return res.status(404).json({ message: 'Paper not found' });
        }

        // Save user message
        const userMessage = new ChatMessage({
            paperId,
            role: 'user',
            content: message
        });
        await userMessage.save();

        // Get recent chat history for context
        const recentMessages = await ChatMessage.find({ paperId })
            .sort({ timestamp: -1 })
            .limit(10)
            .sort({ timestamp: 1 });

        // Build context for AI
        const chatHistory = recentMessages.map(msg =>
            `${msg.role === 'user' ? 'Student' : 'AI'}: ${msg.content}`
        ).join('\n');

        // Create AI prompt with paper context
        const prompt = `
You are an expert academic tutor helping a student prepare for exams.

Paper Context:
- Subject: ${paper.subject}
- Year: ${paper.year}
- Semester: ${paper.semester}
- Exam Type: ${paper.examType || 'SEE'}

${paper.extractedText ? `Paper Content Preview:\n${paper.extractedText.substring(0, 2000)}` : ''}

Recent Conversation:
${chatHistory}

Student's Question: ${message}

Provide a helpful, clear, and educational response. If the question is about:
- Topics: Explain concepts clearly with examples
- Practice: Suggest relevant questions or exercises
- Study tips: Give specific, actionable advice
- Exam patterns: Reference the paper context

Keep responses concise but informative (200-400 words).
`;

        // Get AI response
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiResponse = response.text();

        // Save AI response
        const assistantMessage = new ChatMessage({
            paperId,
            role: 'assistant',
            content: aiResponse
        });
        await assistantMessage.save();

        res.json({
            userMessage,
            assistantMessage
        });

    } catch (error) {
        console.error('Error in chat:', error);
        res.status(500).json({ message: 'Failed to process message', error: error.message });
    }
});

// DELETE /api/chat/:paperId - Clear chat history for a paper
router.delete('/:paperId', async (req, res) => {
    try {
        const { paperId } = req.params;

        await ChatMessage.deleteMany({ paperId });

        res.json({ message: 'Chat history cleared successfully' });
    } catch (error) {
        console.error('Error clearing chat history:', error);
        res.status(500).json({ message: 'Failed to clear chat history', error: error.message });
    }
});

module.exports = router;
