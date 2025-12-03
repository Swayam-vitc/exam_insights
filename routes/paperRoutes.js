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

module.exports = router;
