const mongoose = require('mongoose');
const QuestionPaper = require('./models/QuestionPaper');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

async function createPapersFromPDFs() {
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

        // Clear existing papers
        await QuestionPaper.deleteMany({});
        console.log('Cleared existing papers from database\n');

        // Define the papers based on your PDFs
        // DSA pyq.pdf contains: IA1, IA2, SEE for DSA
        // Java pyq.pdf contains: IA1, IA2, SEE for Java

        const paperConfigs = [
            // DSA Papers
            { sourceFile: 'DSA pyq.pdf', subject: 'DSA Basics', year: 2024, semester: 3, examType: 'IA1' },
            { sourceFile: 'DSA pyq.pdf', subject: 'DSA Basics', year: 2024, semester: 3, examType: 'IA2' },
            { sourceFile: 'DSA pyq.pdf', subject: 'DSA Basics', year: 2024, semester: 3, examType: 'SEE' },
            { sourceFile: 'DSA pyq.pdf', subject: 'DSA Basics', year: 2023, semester: 3, examType: 'IA1' },
            { sourceFile: 'DSA pyq.pdf', subject: 'DSA Basics', year: 2023, semester: 3, examType: 'IA2' },
            { sourceFile: 'DSA pyq.pdf', subject: 'DSA Basics', year: 2023, semester: 3, examType: 'SEE' },

            // Java Papers
            { sourceFile: 'Java pyq.pdf', subject: 'Java Basics', year: 2024, semester: 2, examType: 'IA1' },
            { sourceFile: 'Java pyq.pdf', subject: 'Java Basics', year: 2024, semester: 2, examType: 'IA2' },
            { sourceFile: 'Java pyq.pdf', subject: 'Java Basics', year: 2024, semester: 2, examType: 'SEE' },
            { sourceFile: 'Java pyq.pdf', subject: 'Java Basics', year: 2023, semester: 2, examType: 'IA1' },
            { sourceFile: 'Java pyq.pdf', subject: 'Java Basics', year: 2023, semester: 2, examType: 'IA2' },
            { sourceFile: 'Java pyq.pdf', subject: 'Java Basics', year: 2023, semester: 2, examType: 'SEE' },
        ];

        let created = 0;

        for (const config of paperConfigs) {
            const sourcePath = path.join(quepaperDir, config.sourceFile);

            if (!fs.existsSync(sourcePath)) {
                console.log(`⚠️  File not found: ${config.sourceFile}`);
                continue;
            }

            // Create new filename
            const newFileName = `${config.subject.replace(/\s+/g, '_')}_${config.examType}_${config.year}_Sem${config.semester}.pdf`;
            const newFilePath = path.join(uploadsDir, newFileName);

            // Copy file
            fs.copyFileSync(sourcePath, newFilePath);

            // Create database entry
            const paper = new QuestionPaper({
                subject: config.subject,
                year: config.year,
                semester: config.semester,
                examType: config.examType,
                filePath: `uploads/${newFileName}`,
                extractedText: `${config.subject} ${config.examType} ${config.year} Semester ${config.semester} Question Paper`
            });

            await paper.save();
            console.log(`✅ Created: ${config.subject} - ${config.examType} - ${config.year} - Sem ${config.semester}`);
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

createPapersFromPDFs();
