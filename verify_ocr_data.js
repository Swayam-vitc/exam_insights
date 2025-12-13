const mongoose = require('mongoose');
const QuestionPaper = require('./models/QuestionPaper');
const dotenv = require('dotenv');

dotenv.config();

async function verifyOCRData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const papers = await QuestionPaper.find({}).sort({ year: -1, examType: 1 });

        console.log(`📊 Total papers in database: ${papers.length}\n`);
        console.log('='.repeat(60));

        for (const paper of papers) {
            console.log(`\n📄 Paper ID: ${paper._id}`);
            console.log(`   Subject: ${paper.subject}`);
            console.log(`   Exam Type: ${paper.examType}`);
            console.log(`   Year: ${paper.year}`);
            console.log(`   Semester: ${paper.semester}`);
            console.log(`   Exam Date: ${paper.examDate || 'Not found'}`);
            console.log(`   File Path: ${paper.filePath}`);
            console.log(`   Extracted Text Length: ${paper.extractedText?.length || 0} chars`);
            console.log(`   Cleaned Text Length: ${paper.cleanedText?.length || 0} chars`);
            console.log(`   Keywords (${paper.keywords?.length || 0}):`);

            if (paper.keywords && paper.keywords.length > 0) {
                const topKeywords = paper.keywords.slice(0, 10);
                topKeywords.forEach((kw, idx) => {
                    console.log(`      ${idx + 1}. ${kw}`);
                });
            }

            console.log(`   Sections: ${paper.sections?.length || 0}`);
            if (paper.sections && paper.sections.length > 0) {
                paper.sections.forEach((section, idx) => {
                    console.log(`      ${idx + 1}. ${section.name}`);
                });
            }

            // Show a snippet of cleaned text
            if (paper.cleanedText) {
                console.log(`\n   📝 Cleaned Text Preview (first 500 chars):`);
                console.log(`   ${'-'.repeat(60)}`);
                console.log(`   ${paper.cleanedText.substring(0, 500)}...`);
                console.log(`   ${'-'.repeat(60)}`);
            }

            console.log('\n' + '='.repeat(60));
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

verifyOCRData();
