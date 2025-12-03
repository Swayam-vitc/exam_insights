const mongoose = require('mongoose');
const QuestionPaper = require('./models/QuestionPaper');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

// Simple script to add PDFs with exam type classification
async function processPDFs() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully\n');

        const quepaperDir = path.join(__dirname, 'quepaper');
        const uploadsDir = path.join(__dirname, 'uploads');

        // Ensure uploads directory exists
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir);
        }

        // Get all PDF files
        const files = fs.readdirSync(quepaperDir).filter(f => f.endsWith('.pdf'));
        console.log(`Found ${files.length} PDF files\n`);

        // For now, let's create entries for each exam type manually
        // DSA Papers
        const dsaPapers = [
            { subject: 'DSA Basics', year: 2023, semester: 3, examType: 'IA1' },
            { subject: 'DSA Basics', year: 2023, semester: 3, examType: 'IA2' },
            { subject: 'DSA Basics', year: 2023, semester: 3, examType: 'SEE' },
            { subject: 'DSA Basics', year: 2024, semester: 3, examType: 'IA1' },
            { subject: 'DSA Basics', year: 2024, semester: 3, examType: 'IA2' },
            { subject: 'DSA Basics', year: 2024, semester: 3, examType: 'SEE' },
        ];

        // Java Papers
        const javaPapers = [
            { subject: 'Java Basics', year: 2023, semester: 2, examType: 'IA1' },
            { subject: 'Java Basics', year: 2023, semester: 2, examType: 'IA2' },
            { subject: 'Java Basics', year: 2023, semester: 2, examType: 'SEE' },
            { subject: 'Java Basics', year: 2024, semester: 2, examType: 'IA1' },
            { subject: 'Java Basics', year: 2024, semester: 2, examType: 'IA2' },
            { subject: 'Java Basics', year: 2024, semester: 2, examType: 'SEE' },
        ];

        const allPapers = [...dsaPapers, ...javaPapers];
        let created = 0;

        for (const paperInfo of allPapers) {
            // Determine source file
            const sourceFile = paperInfo.subject.includes('DSA') ? 'DSA pyq.pdf' : 'Java pyq.pdf';
            const sourcePath = path.join(quepaperDir, sourceFile);

            // Create new filename
            const newFileName = `${paperInfo.subject.replace(/\s+/g, '_')}_${paperInfo.examType}_${paperInfo.year}_Sem${paperInfo.semester}.pdf`;
            const newFilePath = path.join(uploadsDir, newFileName);

            // Copy file
            fs.copyFileSync(sourcePath, newFilePath);

            // Create database entry
            const paper = new QuestionPaper({
                subject: paperInfo.subject,
                year: paperInfo.year,
                semester: paperInfo.semester,
                examType: paperInfo.examType,
                filePath: `uploads/${newFileName}`,
                extractedText: `${paperInfo.subject} ${paperInfo.examType} ${paperInfo.year} Semester ${paperInfo.semester} Question Paper`
            });

            await paper.save();
            console.log(`✅ Created: ${paperInfo.subject} - ${paperInfo.examType} - ${paperInfo.year} - Sem ${paperInfo.semester}`);
            created++;
        }

        console.log(`\n✅ Successfully created ${created} papers!`);
        console.log(`📚 Total papers in database: ${await QuestionPaper.countDocuments()}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

processPDFs();
