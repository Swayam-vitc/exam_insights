const mongoose = require('mongoose');
const QuestionPaper = require('./models/QuestionPaper');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB for Seeding');

        const dummyText = `
      Subject: Data Structures
      Year: 2023
      Semester: 3
      
      Part A
      1. Define Stack. (2 marks)
      2. What is a linked list? (2 marks)
      3. Explain Big O notation. (2 marks)
      4. Define Stack. (2 marks) // Repeated
      
      Part B
      5. Explain Quick Sort algorithm with example. (10 marks)
      6. Discuss the different types of Trees. (10 marks)
      7. Explain Quick Sort algorithm. (10 marks) // Repeated
    `;

        const paper = new QuestionPaper({
            subject: 'Data Structures Test',
            year: 2023,
            semester: 3,
            filePath: 'dummy_path.pdf',
            extractedText: dummyText
        });

        await paper.save();
        console.log('✅ Dummy paper inserted for subject: Data Structures Test');

        mongoose.connection.close();
    })
    .catch(err => console.error(err));
