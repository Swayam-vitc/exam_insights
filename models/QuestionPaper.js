const mongoose = require('mongoose');

const questionPaperSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true,
        trim: true
    },
    year: {
        type: Number,
        required: true
    },
    semester: {
        type: Number,
        required: true
    },
    examType: {
        type: String,
        enum: ['IA1', 'IA2', 'SEE'],
        default: 'SEE',
        required: true
    },
    examDate: {
        type: String,
        required: false // Extracted exam date from PDF
    },
    filePath: {
        type: String,
        required: true
    },
    extractedText: {
        type: String,
        required: false // Raw text extracted from PDF
    },
    cleanedText: {
        type: String,
        required: false // Cleaned text after regex processing
    },
    keywords: {
        type: [String],
        default: [] // Extracted topics/keywords using NLP
    },
    sections: {
        type: [{
            name: String,
            content: String
        }],
        default: [] // Question paper sections (Part A, B, etc.)
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('QuestionPaper', questionPaperSchema);
