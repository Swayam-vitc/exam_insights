const mongoose = require('mongoose');
const QuestionPaper = require('./models/QuestionPaper');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

async function analyzePDFWithVision(pdfPath, filename) {
    try {
        // Read PDF as base64
        const pdfBuffer = fs.readFileSync(pdfPath);
        const base64Pdf = pdfBuffer.toString('base64');

        const prompt = `
Analyze this PDF question paper and provide the following information in JSON format:

1. Subject: Identify if this is DSA (Data Structures & Algorithms) or Java
2. Year: Extract the year (likely 2023 or 2024)
3. Semester: Extract the semester number
4. Sections: List all exam types found (IA1, IA2, SEE) with their page ranges

The PDF may contain multiple exam papers (IA1, IA2, SEE) for the same subject.
For each section found, note:
- examType: "IA1", "IA2", or "SEE"
- startPage: approximate starting page
- endPage: approximate ending page
- topics: brief list of main topics covered

Return ONLY valid JSON in this format:
{
  "subject": "DSA Basics" or "Java Basics",
  "year": 2024,
  "semester": 3,
  "sections": [
    {
      "examType": "IA1",
      "startPage": 1,
      "endPage": 5,
      "topics": ["Arrays", "Linked Lists"]
    }
  ]
}
`;

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: "application/pdf",
                    data: base64Pdf
                }
            },
            { text: prompt }
        ]);

        const response = await result.response;
        const text = response.text();

        // Clean and parse JSON
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);

    } catch (error) {
        console.error('Error analyzing PDF with vision:', error);
        throw error;
    }
}

async function processWithVision() {
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

        // Get all PDF files
        const files = fs.readdirSync(quepaperDir).filter(f => f.endsWith('.pdf'));
        console.log(`Found ${files.length} PDF files to process\n`);

        let totalPapersCreated = 0;

        for (const file of files) {
            console.log(`\n📄 Processing: ${file}`);
            const filePath = path.join(quepaperDir, file);

            console.log('   🤖 Analyzing with Gemini Vision AI...');
            const analysis = await analyzePDFWithVision(filePath, file);

            console.log(`   Subject: ${analysis.subject}`);
            console.log(`   Year: ${analysis.year}, Semester: ${analysis.semester}`);
            console.log(`   Found ${analysis.sections.length} exam sections`);

            // Create a paper entry for each section
            for (const section of analysis.sections) {
                // Copy file to uploads with descriptive name
                const newFileName = `${analysis.subject.replace(/\s+/g, '_')}_${section.examType}_${analysis.year}_Sem${analysis.semester}.pdf`;
                const newFilePath = path.join(uploadsDir, newFileName);

                // Copy the original file
                fs.copyFileSync(filePath, newFilePath);

                // Create database entry
                const paper = new QuestionPaper({
                    subject: analysis.subject,
                    year: analysis.year,
                    semester: analysis.semester,
                    examType: section.examType,
                    filePath: `uploads/${newFileName}`,
                    extractedText: `Topics: ${section.topics.join(', ')}` // Store topics as summary
                });

                await paper.save();
                console.log(`   ✅ Created: ${analysis.subject} - ${section.examType} - ${analysis.year} - Sem ${analysis.semester}`);
                console.log(`      Topics: ${section.topics.join(', ')}`);
                totalPapersCreated++;
            }
        }

        console.log(`\n✅ Successfully processed all PDFs with Vision AI!`);
        console.log(`📊 Total papers created: ${totalPapersCreated}`);
        console.log(`📚 Total papers in database: ${await QuestionPaper.countDocuments()}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error processing PDFs:', error);
        process.exit(1);
    }
}

processWithVision();
