const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdf = require('pdf-parse');
const fs = require('fs');
const QuestionPaper = require('../models/QuestionPaper');

// Configure Multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// POST /api/papers/upload
router.post('/upload', upload.single('paper'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { subject, year, semester } = req.body;
        const filePath = req.file.path;

        // Extract text from PDF
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdf(dataBuffer);
        const extractedText = pdfData.text;

        const newPaper = new QuestionPaper({
            subject,
            year,
            semester,
            filePath,
            extractedText
        });

        await newPaper.save();

        res.status(201).json({ message: 'Question paper uploaded successfully', paper: newPaper });
    } catch (error) {
        console.error('Error uploading paper:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/papers - Enhanced with filtering, sorting, and pagination
router.get('/', async (req, res) => {
    try {
        const {
            subject,
            subjects,
            examTypes,
            yearMin,
            yearMax,
            semesters,
            search,
            sortBy = 'uploadedAt',
            sortOrder = 'desc',
            page = 1,
            limit = 20
        } = req.query;

        let query = {};

        // Subject filter (single or multiple)
        if (subjects) {
            const subjectArray = Array.isArray(subjects) ? subjects : [subjects];
            query.subject = { $in: subjectArray };
        } else if (subject) {
            query.subject = new RegExp(subject, 'i');
        }

        // Exam type filter
        if (examTypes) {
            const examTypeArray = Array.isArray(examTypes) ? examTypes : [examTypes];
            query.examType = { $in: examTypeArray };
        }

        // Year range filter
        if (yearMin || yearMax) {
            query.year = {};
            if (yearMin) query.year.$gte = parseInt(yearMin);
            if (yearMax) query.year.$lte = parseInt(yearMax);
        }

        // Semester filter
        if (semesters) {
            const semesterArray = Array.isArray(semesters) ? semesters : [semesters];
            query.semester = { $in: semesterArray.map(s => parseInt(s)) };
        }

        // Search across multiple fields
        if (search) {
            query.$or = [
                { subject: new RegExp(search, 'i') },
                { examType: new RegExp(search, 'i') },
                { year: parseInt(search) || 0 },
                { semester: parseInt(search) || 0 }
            ];
        }

        // Sorting
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute query
        const papers = await QuestionPaper.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const total = await QuestionPaper.countDocuments(query);

        // For backward compatibility: if no explicit pagination params, return simple array
        // Otherwise return paginated response
        if (!req.query.page && !req.query.limit) {
            // Simple response for backward compatibility
            const allPapers = await QuestionPaper.find(query).sort(sortOptions);
            res.json(allPapers);
        } else {
            // Paginated response
            res.json({
                papers,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / parseInt(limit))
                }
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/papers/download/:id - Download PDF file
router.get('/download/:id', async (req, res) => {
    try {
        const paper = await QuestionPaper.findById(req.params.id);

        if (!paper) {
            return res.status(404).json({ message: 'Paper not found' });
        }

        const filePath = paper.filePath;

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found on server' });
        }

        // Set headers for download
        const fileName = `${paper.subject}_${paper.year}_Sem${paper.semester}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error downloading paper:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Helper function to extract questions from text
function extractQuestions(text) {
    const questions = [];

    // Common patterns for questions in the extracted text
    const patterns = [
        // Pattern for numbered questions like "1.", "2.", etc.
        /(?:^|\n)(\d+)\s*[.)]\s*([^\n]+(?:\n(?!\d+\s*[.)])[^\n]+)*)/gm,
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
