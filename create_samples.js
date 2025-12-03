const mongoose = require('mongoose');
const QuestionPaper = require('./models/QuestionPaper');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

// Sample papers data
const samplePapers = [
    {
        subject: 'DSA Basics',
        year: 2024,
        semester: 3,
        extractedText: `
      Data Structures and Algorithms - Final Exam 2024
      
      Q1. Explain the concept of time complexity with examples. (10 marks)
      Q2. Implement a binary search tree with insertion and deletion operations. (15 marks)
      Q3. What is the difference between Stack and Queue? Explain with real-world examples. (10 marks)
      Q4. Write an algorithm to detect a cycle in a linked list. (10 marks)
      Q5. Explain different sorting algorithms and their time complexities. (15 marks)
      Q6. Implement a hash table with collision handling. (10 marks)
      Q7. What are the applications of graphs in computer science? (10 marks)
      Q8. Explain dynamic programming with an example problem. (10 marks)
    `
    },
    {
        subject: 'DSA Basics',
        year: 2023,
        semester: 3,
        extractedText: `
      Data Structures and Algorithms - Final Exam 2023
      
      Q1. What is time complexity? Explain Big O notation. (10 marks)
      Q2. Implement a binary search tree. (15 marks)
      Q3. Explain Stack data structure with applications. (10 marks)
      Q4. Write a program to reverse a linked list. (10 marks)
      Q5. Compare merge sort and quick sort algorithms. (15 marks)
      Q6. What is hashing? Explain collision resolution techniques. (10 marks)
      Q7. Implement BFS and DFS for graph traversal. (10 marks)
      Q8. Solve the knapsack problem using dynamic programming. (10 marks)
    `
    },
    {
        subject: 'Java Basics',
        year: 2024,
        semester: 2,
        extractedText: `
      Java Programming - Final Exam 2024
      
      Q1. Explain the concept of Object-Oriented Programming. (10 marks)
      Q2. What is inheritance? Demonstrate with code examples. (15 marks)
      Q3. Explain exception handling in Java. (10 marks)
      Q4. What are interfaces and abstract classes? (10 marks)
      Q5. Implement a multi-threaded program in Java. (15 marks)
      Q6. Explain the Collections framework. (10 marks)
      Q7. What is the difference between ArrayList and LinkedList? (10 marks)
      Q8. Implement a simple calculator using Java Swing. (10 marks)
    `
    },
    {
        subject: 'Java Basics',
        year: 2023,
        semester: 2,
        extractedText: `
      Java Programming - Final Exam 2023
      
      Q1. What are the principles of Object-Oriented Programming? (10 marks)
      Q2. Explain inheritance and polymorphism with examples. (15 marks)
      Q3. How does exception handling work in Java? (10 marks)
      Q4. Differentiate between interface and abstract class. (10 marks)
      Q5. Write a program demonstrating multithreading. (15 marks)
      Q6. Explain ArrayList, HashMap, and HashSet. (10 marks)
      Q7. Compare ArrayList vs Vector. (10 marks)
      Q8. Create a GUI application using Swing. (10 marks)
    `
    },
    {
        subject: 'SED Basics',
        year: 2024,
        semester: 4,
        extractedText: `
      Software Engineering and Design - Final Exam 2024
      
      Q1. Explain the Software Development Life Cycle (SDLC). (10 marks)
      Q2. What is Agile methodology? Compare with Waterfall model. (15 marks)
      Q3. Explain different types of software testing. (10 marks)
      Q4. What are design patterns? Explain Singleton pattern. (10 marks)
      Q5. Draw a UML class diagram for a library management system. (15 marks)
      Q6. Explain the concept of version control. (10 marks)
      Q7. What is continuous integration and deployment? (10 marks)
      Q8. Explain software quality metrics. (10 marks)
    `
    },
    {
        subject: 'SED Basics',
        year: 2023,
        semester: 4,
        extractedText: `
      Software Engineering and Design - Final Exam 2023
      
      Q1. What are the phases of SDLC? (10 marks)
      Q2. Compare Agile and Waterfall methodologies. (15 marks)
      Q3. Explain unit testing, integration testing, and system testing. (10 marks)
      Q4. What are design patterns? Implement Factory pattern. (10 marks)
      Q5. Create UML diagrams for an online shopping system. (15 marks)
      Q6. Explain Git and its importance in software development. (10 marks)
      Q7. What is CI/CD pipeline? (10 marks)
      Q8. Discuss software maintenance and evolution. (10 marks)
    `
    }
];

async function createSamplePapers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully');

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir);
        }

        // Clear existing papers (optional - comment out if you want to keep existing)
        // await QuestionPaper.deleteMany({});
        // console.log('Cleared existing papers');

        // Create sample papers
        for (const paperData of samplePapers) {
            // Create a dummy file path (we're not creating actual PDFs)
            const fileName = `sample_${paperData.subject.replace(/\s+/g, '_')}_${paperData.year}_Sem${paperData.semester}.pdf`;
            const filePath = path.join('uploads', fileName);

            // Create a placeholder file
            fs.writeFileSync(filePath, `Sample PDF for ${paperData.subject} ${paperData.year} Semester ${paperData.semester}`);

            const paper = new QuestionPaper({
                ...paperData,
                filePath,
                uploadedAt: new Date(paperData.year, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28))
            });

            await paper.save();
            console.log(`Created sample paper: ${paperData.subject} ${paperData.year} Sem ${paperData.semester}`);
        }

        console.log('\n✅ Successfully created all sample papers!');
        console.log(`Total papers in database: ${await QuestionPaper.countDocuments()}`);

        process.exit(0);
    } catch (error) {
        console.error('Error creating sample papers:', error);
        process.exit(1);
    }
}

createSamplePapers();
