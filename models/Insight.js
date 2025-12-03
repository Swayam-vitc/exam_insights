const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true,
        unique: true, // One insight document per subject (can be updated)
        trim: true
    },
    repeatedQuestions: [{
        question: String,
        frequency: Number
    }],
    unitWeightage: [{
        unit: String,
        weightage: String // e.g., "20%" or "High"
    }],
    importantTopics: [String],
    frequentlyTestedConcepts: [String],
    generatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Insight', insightSchema);
