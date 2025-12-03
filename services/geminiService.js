const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function analyzePaper(text, subject) {
  try {
    const prompt = `
      You are an expert academic assistant. Analyze the following question paper text for the subject "${subject}".
      
      Extract and generate the following insights in strictly valid JSON format:
      1. "repeatedQuestions": A list of questions that seem to appear frequently or are standard questions (if multiple papers were provided, but here assume this is a representative sample or single paper analysis).
      2. "unitWeightage": Estimate the weightage of different units/modules based on the questions.
      3. "importantTopics": List the key topics that are heavily tested.
      4. "frequentlyTestedConcepts": List specific concepts that appear often.

      The JSON structure should be:
      {
        "repeatedQuestions": [{"question": "...", "frequency": 1}],
        "unitWeightage": [{"unit": "...", "weightage": "..."}],
        "importantTopics": ["...", "..."],
        "frequentlyTestedConcepts": ["...", "..."]
      }

      Do not include markdown formatting like \`\`\`json or \`\`\`. Just return the raw JSON string.

      Question Paper Text:
      ${text.substring(0, 30000)} // Limit text to avoid token limits if necessary
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();

    // Clean up if markdown code blocks are present despite instructions
    const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error in Gemini analysis:", error);
    throw error;
  }
}

async function explainTopic(topic, subject) {
  try {
    const prompt = `
      You are an expert teacher for the subject "${subject}".
      
      Provide a clear, detailed explanation of the topic: "${topic}"
      
      Include:
      1. Definition and core concepts
      2. Key points to remember
      3. Common applications or examples
      4. Why this topic is important for exams
      
      Keep the explanation concise but comprehensive (around 200-300 words).
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error explaining topic:", error);
    throw error;
  }
}

async function generatePracticeQuestions(subject, topics, examType = 'SEE') {
  try {
    const topicsList = Array.isArray(topics) ? topics.join(', ') : topics;
    const prompt = `
      You are an expert question paper setter for "${subject}".
      
      Generate 10 practice questions for ${examType} exam covering these topics: ${topicsList}
      
      Requirements:
      - Mix of difficulty levels (easy, medium, hard)
      - Include both theoretical and practical questions
      - Format: Question number, question text, marks (in parentheses)
      - Make questions similar to typical university exam patterns
      
      Example format:
      1. Explain the concept of... (5 marks)
      2. Write a program to... (10 marks)
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating practice questions:", error);
    throw error;
  }
}

async function getStudyRecommendations(subject, insights) {
  try {
    const prompt = `
      You are an expert academic advisor for "${subject}".
      
      Based on these insights from previous exam papers:
      - Repeated Questions: ${JSON.stringify(insights.repeatedQuestions || [])}
      - Important Topics: ${JSON.stringify(insights.importantTopics || [])}
      - Frequently Tested Concepts: ${JSON.stringify(insights.frequentlyTestedConcepts || [])}
      
      Provide personalized study recommendations:
      1. Which topics to prioritize (based on frequency)
      2. Suggested study order
      3. Time allocation for each topic
      4. Key areas that need more practice
      5. Tips for exam preparation
      
      Keep it actionable and specific (around 250 words).
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error getting study recommendations:", error);
    throw error;
  }
}

module.exports = {
  analyzePaper,
  explainTopic,
  generatePracticeQuestions,
  getStudyRecommendations
};
