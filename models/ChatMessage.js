const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    paperId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuestionPaper',
        required: true,
        index: true
    },
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient querying of chat history
chatMessageSchema.index({ paperId: 1, timestamp: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
