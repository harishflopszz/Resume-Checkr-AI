// Test file to demonstrate alternative API calling methods
import { callGemini } from "./gemini-client";
import { processFallbackAnalysis } from "./fallback-processor";

// Test data
const testResume = `
John Doe
Software Engineer
Email: john.doe@email.com
Phone: (555) 123-4567

SUMMARY
Experienced software engineer with 5+ years in web development. Proficient in JavaScript, React, Node.js, and Python. Strong problem-solving skills and experience with agile methodologies.

EXPERIENCE
Senior Developer at TechCorp (2020-Present)
- Developed responsive web applications using React and Node.js
- Led team of 4 developers on major project delivery
- Improved application performance by 40% through optimization

Software Engineer at StartupInc (2018-2020)
- Built RESTful APIs using Express.js and MongoDB
- Implemented CI/CD pipelines reducing deployment time by 60%

EDUCATION
BS Computer Science, University of Technology (2014-2018)
`;

const testJobDescription = `
Software Engineer - Full Stack

We are looking for a skilled Full Stack Developer to join our team. The ideal candidate will have experience with modern web technologies and a passion for building scalable applications.

Requirements:
- 3+ years experience in software development
- Proficiency in JavaScript, React, Node.js, and Python
- Experience with RESTful APIs and database design
- Strong problem-solving and communication skills
- Experience with cloud platforms (AWS, Azure, or GCP)
- Knowledge of CI/CD practices and tools

Nice to have:
- Experience with TypeScript
- Knowledge of Docker and Kubernetes
- Experience with microservices architecture
`;

/**
 * Test all API calling methods
 */
export async function testAllMethods() {
  console.log("Testing Gemini API calling methods...");
  
  try {
    // Test method 1: Server-side proxy
    console.log("\n1. Testing server-side proxy method...");
    const result1 = await callGemini<any>(`Analyze this resume against job description:\n\nRESUME:\n${testResume}\n\nJOB DESCRIPTION:\n${testJobDescription}\n\nProvide analysis in JSON format.`);
    console.log("Proxy method result:", result1);
    
  } catch (error) {
    console.log("Proxy method failed:", error.message);
    
    try {
      // Test method 2: Fallback processing
      console.log("\n2. Testing fallback processing...");
      const result2 = await processFallbackAnalysis(testResume, testJobDescription);
      console.log("Fallback result:", result2);
      
    } catch (fallbackError) {
      console.log("Fallback also failed:", fallbackError.message);
    }
  }
}

// Run test if this file is executed directly
if (import.meta.env.DEV) {
  testAllMethods().catch(console.error);
}