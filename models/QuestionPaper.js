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
    filePath: {
        type: String,
        required: true
    },
    extractedText: {
        type: String,
        required: false // Text extracted from PDF for analysis
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('QuestionPaper', questionPaperSchema);
