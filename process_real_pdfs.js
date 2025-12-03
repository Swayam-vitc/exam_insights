const mongoose = require('mongoose');
const QuestionPaper = require('./models/QuestionPaper');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

dotenv.config();

// Function to identify exam type and extract relevant sections from PDF text
function extractPaperSections(text) {
    const sections = [];
    const lines = text.split('\n');

    let currentSection = null;
    let currentContent = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();

        // Check for IA1 markers
        if (line.includes('internal assessment') && (line.includes('1') || line.includes('i')) ||
            line.includes('ia-1') || line.includes('ia 1') || line.includes('ia1')) {
            if (currentSection && currentContent.length > 0) {
                sections.push({ type: currentSection, content: currentContent.join('\n') });
            }
            currentSection = 'IA1';
            currentContent = [lines[i]];
        }
        // Check for IA2 markers
        else if (line.includes('internal assessment') && (line.includes('2') || line.includes('ii')) ||
            line.includes('ia-2') || line.includes('ia 2') || line.includes('ia2')) {
            if (currentSection && currentContent.length > 0) {
                sections.push({ type: currentSection, content: currentContent.join('\n') });
            }
            currentSection = 'IA2';
            currentContent = [lines[i]];
        }
        // Check for SEE markers
        else if (line.includes('semester end') || line.includes('see') ||
            line.includes('final exam') || line.includes('end semester')) {
            if (currentSection && currentContent.length > 0) {
                sections.push({ type: currentSection, content: currentContent.join('\n') });
            }
            currentSection = 'SEE';
            currentContent = [lines[i]];
        }
        else if (currentSection) {
            currentContent.push(lines[i]);
        }
    }

    // Add the last section
    if (currentSection && currentContent.length > 0) {
        sections.push({ type: currentSection, content: currentContent.join('\n') });
    }

    return sections;
}

// Extract year and semester from text
function extractMetadata(text, filename) {
    const metadata = {
        subject: '',
        year: 2024, // default
        semester: 3 // default
    };

    // Extract subject from filename
    if (filename.toLowerCase().includes('dsa')) {
        metadata.subject = 'DSA Basics';
        metadata.semester = 3;
    } else if (filename.toLowerCase().includes('java')) {
        metadata.subject = 'Java Basics';
        metadata.semester = 2;
    }

    // Try to extract year from content
    const yearMatch = text.match(/20\d{2}/);
    if (yearMatch) {
        metadata.year = parseInt(yearMatch[0]);
    }

    // Try to extract semester from content
    const semMatch = text.match(/semester[:\s]+(\d)/i) || text.match(/sem[:\s]+(\d)/i);
    if (semMatch) {
        metadata.semester = parseInt(semMatch[1]);
    }

    return metadata;
}

async function processRealPDFs() {
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

            // Read and parse PDF
            const dataBuffer = fs.readFileSync(filePath);
            const pdfData = await pdf(dataBuffer);
            const fullText = pdfData.text;

            console.log(`   Extracted ${pdfData.numpages} pages, ${fullText.length} characters`);

            // Extract metadata
            const metadata = extractMetadata(fullText, file);
            console.log(`   Subject: ${metadata.subject}, Year: ${metadata.year}, Semester: ${metadata.semester}`);

            // Extract sections by exam type
            const sections = extractPaperSections(fullText);
            console.log(`   Found ${sections.length} exam sections`);

            if (sections.length === 0) {
                console.log(`   ⚠️  No clear exam type markers found, treating as SEE`);
                sections.push({ type: 'SEE', content: fullText });
            }

            // Create a paper for each section
            for (const section of sections) {
                if (section.content.trim().length < 100) {
                    console.log(`   ⚠️  Skipping ${section.type} - content too short (${section.content.length} chars)`);
                    continue;
                }

                // Copy file to uploads with new name
                const newFileName = `${metadata.subject.replace(/\s+/g, '_')}_${section.type}_${metadata.year}_Sem${metadata.semester}.pdf`;
                const newFilePath = path.join(uploadsDir, newFileName);

                // Copy the original file
                fs.copyFileSync(filePath, newFilePath);

                // Create database entry
                const paper = new QuestionPaper({
                    subject: metadata.subject,
                    year: metadata.year,
                    semester: metadata.semester,
                    examType: section.type,
                    filePath: `uploads/${newFileName}`,
                    extractedText: section.content.trim()
                });

                await paper.save();
                console.log(`   ✅ Created: ${metadata.subject} - ${section.type} - ${metadata.year} - Sem ${metadata.semester} (${section.content.length} chars)`);
                totalPapersCreated++;
            }
        }

        console.log(`\n✅ Successfully processed all PDFs!`);
        console.log(`📊 Total papers created: ${totalPapersCreated}`);
        console.log(`📚 Total papers in database: ${await QuestionPaper.countDocuments()}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error processing PDFs:', error);
        process.exit(1);
    }
}

processRealPDFs();
