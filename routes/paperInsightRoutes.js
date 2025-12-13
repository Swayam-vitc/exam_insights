const express = require('express');
const router = express.Router();
const QuestionPaper = require('../models/QuestionPaper');

// Helper function to extract questions from text
function extractQuestions(text) {
    const questions = [];

    // Common patterns for questions in the extracted text
    const patterns = [
        // Pattern for numbered questions like "1.", "2.", etc.
        /(?:^|\n)(\d+)\s*[.)]\s*([^\n]+(?:\n(?!\d+\s*[.)])[^\n]+)*)/gm,
        // Pattern for lettered questions like "a)", "b)", etc.
        /(?:^|\n)([a-z])\s*\)\s*([^\n]+(?:\n(?![a-z]\s*\))[^\n]+)*)/gm,
        // Pattern for Roman numerals like "i)", "ii)", etc.
        /(?:^|\n)([ivx]+)\s*\)\s*([^\n]+(?:\n(?![ivx]+\s*\))[^\n]+)*)/gm,
    ];

    let questionNumber = 1;

    // Try to extract using numbered pattern first (most common)
    const numberedMatches = [...text.matchAll(patterns[0])];

    if (numberedMatches.length > 0) {
        numberedMatches.forEach(match => {
            const number = match[1];
            const questionText = match[2].trim();

            // Filter out header-like text and very short questions
            if (questionText.length > 15 && !questionText.match(/^(PART|Section|Instructions|Name|USN|Date|Code)/i)) {
                questions.push({
                    number: number,
                    text: questionText.substring(0, 500), // Limit length
                    section: detectSection(text, match.index)
                });
            }
        });
    }

    return questions;
}

// Helper function to detect which section a question belongs to
function detectSection(text, position) {
    const beforeText = text.substring(Math.max(0, position - 200), position);

    if (beforeText.match(/PART\s*A/i)) return 'Part A';
    if (beforeText.match(/PART\s*B/i)) return 'Part B';
    if (beforeText.match(/PART\s*C/i)) return 'Part C';
    if (beforeText.match(/Section\s*A/i)) return 'Section A';
    if (beforeText.match(/Section\s*B/i)) return 'Section B';
    if (beforeText.match(/Section\s*C/i)) return 'Section C';

    return 'Unspecified';
}

// Helper function to extract exam date from text
function extractExamDate(text) {
    // Look for date patterns like "Date: 26/09/24" or "26-09-2024"
    const datePatterns = [
        /Date:\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
        /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/,
    ];

    for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) {
            return match[1];
        }
    }

    return null;
}

// GET /api/papers/:id/insights - Get insights for a specific paper
router.get('/:id/insights', async (req, res) => {
    try {
        const paper = await QuestionPaper.findById(req.params.id);

        if (!paper) {
            return res.status(404).json({ message: 'Question paper not found' });
        }

        // Extract questions from the text
        const questions = extractQuestions(paper.extractedText || paper.cleanedText || '');

        // Extract or use existing exam date
        const examDate = paper.examDate || extractExamDate(paper.extractedText || '');

        // Prepare insights response
        const insights = {
            paperId: paper._id,
            subject: paper.subject,
            year: paper.year,
            semester: paper.semester,
            examType: paper.examType,
            examDate: examDate,
            totalQuestions: questions.length,
            questions: questions,
            topics: paper.keywords || [],
            sections: paper.sections || [],
            uploadedAt: paper.uploadedAt
        };

        res.json(insights);
    } catch (error) {
        console.error('Error fetching paper insights:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
