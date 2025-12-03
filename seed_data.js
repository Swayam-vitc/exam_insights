const mongoose = require('mongoose');
const QuestionPaper = require('./models/QuestionPaper');
const dotenv = require('dotenv');

dotenv.config();

const subjects = [
    {
        name: 'DSA Basics',
        papers: [
            {
                year: 2021, semester: 3,
                text: `
          1. Define Stack and Queue. (5 marks)
          2. Explain Linked List with example. (10 marks)
          3. What is Big O notation? (5 marks)
          4. Write an algorithm for Binary Search. (10 marks)
        `
            },
            {
                year: 2022, semester: 3,
                text: `
          1. Differentiate between Stack and Queue. (5 marks)
          2. Explain Doubly Linked List. (10 marks)
          3. Explain Quick Sort algorithm. (10 marks)
          4. What is Big O notation? (5 marks)
        `
            },
            {
                year: 2023, semester: 3,
                text: `
          1. Define Stack. Applications of Stack. (5 marks)
          2. Explain Circular Linked List. (10 marks)
          3. Explain Quick Sort algorithm with complexity. (10 marks)
          4. Write an algorithm for Merge Sort. (10 marks)
        `
            },
            {
                year: 2024, semester: 3,
                text: `
          1. What is a Stack? (2 marks)
          2. Explain Linked List operations. (10 marks)
          3. Explain Quick Sort. (10 marks)
          4. Compare BFS and DFS. (8 marks)
        `
            }
        ]
    },
    {
        name: 'Java Basics',
        papers: [
            {
                year: 2021, semester: 4,
                text: `
          1. What is JVM? (5 marks)
          2. Explain Inheritance in Java. (10 marks)
          3. Differentiate between Overloading and Overriding. (10 marks)
          4. Explain Exception Handling mechanism. (5 marks)
        `
            },
            {
                year: 2022, semester: 4,
                text: `
          1. Explain features of Java. (5 marks)
          2. Explain Polymorphism with example. (10 marks)
          3. What is an Interface? (5 marks)
          4. Explain Exception Handling with try-catch. (10 marks)
        `
            },
            {
                year: 2023, semester: 4,
                text: `
          1. What is JVM architecture? (5 marks)
          2. Explain Inheritance types. (10 marks)
          3. Explain Polymorphism. (10 marks)
          4. Write a program for Matrix Multiplication. (5 marks)
        `
            },
            {
                year: 2024, semester: 4,
                text: `
          1. Define Class and Object. (5 marks)
          2. Explain Inheritance and Polymorphism. (15 marks)
          3. Explain Exception Handling keywords. (5 marks)
          4. What is Multithreading? (5 marks)
        `
            }
        ]
    },
    {
        name: 'SED Basics',
        papers: [
            {
                year: 2021, semester: 5,
                text: `
          1. What is SDLC? Explain phases. (10 marks)
          2. Explain Waterfall Model. (10 marks)
          3. What is Black Box Testing? (5 marks)
          4. Define Software Quality. (5 marks)
        `
            },
            {
                year: 2022, semester: 5,
                text: `
          1. Explain Agile Methodology. (10 marks)
          2. Differentiate between Waterfall and Agile. (10 marks)
          3. What is White Box Testing? (5 marks)
          4. Explain SRS document. (5 marks)
        `
            },
            {
                year: 2023, semester: 5,
                text: `
          1. What is SDLC? (5 marks)
          2. Explain Scrum framework. (10 marks)
          3. Explain Testing levels. (10 marks)
          4. What is Maintenance? (5 marks)
        `
            },
            {
                year: 2024, semester: 5,
                text: `
          1. Explain Spiral Model. (10 marks)
          2. What is Agile? (5 marks)
          3. Explain Black Box vs White Box Testing. (10 marks)
          4. Define Coupling and Cohesion. (5 marks)
        `
            }
        ]
    }
];

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB for Seeding');

        // Clear existing papers to avoid duplicates if run multiple times
        await QuestionPaper.deleteMany({});
        console.log('Cleared existing papers.');

        for (const subject of subjects) {
            for (const paper of subject.papers) {
                const newPaper = new QuestionPaper({
                    subject: subject.name,
                    year: paper.year,
                    semester: paper.semester,
                    filePath: `dummy_path_${subject.name}_${paper.year}.pdf`,
                    extractedText: paper.text
                });
                await newPaper.save();
            }
            console.log(`Seeded 4 papers for ${subject.name}`);
        }

        console.log('✅ Seeding Complete');
        mongoose.connection.close();
    })
    .catch(err => console.error(err));
