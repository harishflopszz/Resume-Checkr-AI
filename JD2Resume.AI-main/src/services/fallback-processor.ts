// Local fallback processing for when Gemini API is unavailable
import { AnalysisResult } from "@/types/analysis";

interface BasicAnalysis {
  matchScore: {
    total: number;
    hardSkills: number;
    softSkills: number;
    roleAlignment: number;
    atsCompatibility: number;
  };
  missingKeywords: string[];
  actionPlan: string[];
  recruiterLens: {
    positives: string[];
    redFlags: string[];
    shortlistProbability: number;
    verdict: string;
  };
  atsVerdict: {
    willAutoReject: boolean;
    reason: string;
  };
  rewriteSuggestions: {
    headline: string;
    summary: string;
    experienceBullet: string;
  };
}

/**
 * Simple keyword matching algorithm for fallback processing
 */
function calculateBasicMatch(resumeText: string, jobDescriptionText: string): BasicAnalysis {
  const resumeWords = resumeText.toLowerCase().split(/\s+/);
  const jobWords = jobDescriptionText.toLowerCase().split(/\s+/);
  
  // Count common words (simple keyword matching)
  const commonWords = resumeWords.filter(word =>
    jobWords.includes(word) && word.length > 3
  );
  
  const matchPercentage = Math.min(100, Math.round((commonWords.length / jobWords.length) * 100));
  
  // Extract potential skills
  const hardSkills = ['javascript', 'react', 'python', 'java', 'sql', 'html', 'css', 'node', 'angular', 'vue'];
  const softSkills = ['leadership', 'communication', 'teamwork', 'problem-solving', 'analytical', 'adaptability'];
  
  const foundHardSkills = hardSkills.filter(skill =>
    resumeText.toLowerCase().includes(skill) && jobDescriptionText.toLowerCase().includes(skill)
  );
  
  const foundSoftSkills = softSkills.filter(skill =>
    resumeText.toLowerCase().includes(skill) && jobDescriptionText.toLowerCase().includes(skill)
  );
  
  const missingHardSkills = hardSkills.filter(skill =>
    jobDescriptionText.toLowerCase().includes(skill) && !resumeText.toLowerCase().includes(skill)
  );
  
  const shortlistProbability = Math.min(100, Math.round(matchPercentage * 0.8));
  const willAutoReject = matchPercentage < 30;
  
  return {
    matchScore: {
      total: matchPercentage,
      hardSkills: Math.min(100, Math.round((foundHardSkills.length / hardSkills.length) * 100)),
      softSkills: Math.min(100, Math.round((foundSoftSkills.length / softSkills.length) * 100)),
      roleAlignment: Math.min(100, Math.round(matchPercentage * 0.9)),
      atsCompatibility: Math.min(100, Math.round(matchPercentage * 0.7))
    },
    missingKeywords: missingHardSkills,
    actionPlan: [
      'Add missing skills: ' + missingHardSkills.join(', '),
      'Include more metrics and numbers in experience descriptions',
      'Highlight transferable skills from previous roles',
      'Consider obtaining certifications for missing technologies'
    ],
    recruiterLens: {
      positives: [
        `Matches ${matchPercentage}% of job description keywords`,
        foundHardSkills.length > 0 ? `Has ${foundHardSkills.length} required technical skills` : 'Good foundational skills',
        foundSoftSkills.length > 0 ? `Demonstrates ${foundSoftSkills.length} soft skills` : 'Shows potential for soft skills'
      ],
      redFlags: [
        missingHardSkills.length > 0 ? `Missing ${missingHardSkills.length} key technical skills` : 'Could use more specific technical skills',
        'Consider adding more quantifiable achievements',
        'Experience descriptions could be more tailored to the role'
      ],
      shortlistProbability,
      verdict: shortlistProbability > 70 ? 'Strong candidate with some improvements needed' :
               shortlistProbability > 40 ? 'Potential candidate with significant improvements needed' :
               'Needs substantial improvements to be competitive'
    },
    atsVerdict: {
      willAutoReject,
      reason: willAutoReject ?
        'Low keyword match score may cause ATS rejection' :
        'Good keyword match score, likely to pass ATS screening'
    },
    rewriteSuggestions: {
      headline: 'Consider a more targeted professional headline',
      summary: 'Tailor your summary to highlight relevant experience for this role',
      experienceBullet: 'Focus on quantifiable achievements and relevant skills'
    }
  };
}

/**
 * Fallback processor for when Gemini API is unavailable
 */
export async function processFallbackAnalysis(
  resumeText: string,
  jobDescriptionText: string
): Promise<AnalysisResult> {
  const basicAnalysis = calculateBasicMatch(resumeText, jobDescriptionText);
  
  return {
    matchScore: basicAnalysis.matchScore,
    missingKeywords: basicAnalysis.missingKeywords,
    actionPlan: basicAnalysis.actionPlan,
    recruiterLens: basicAnalysis.recruiterLens,
    atsVerdict: basicAnalysis.atsVerdict,
    rewriteSuggestions: basicAnalysis.rewriteSuggestions,
    coverLetter: 'Please connect to the internet for AI-generated cover letter suggestions.'
  };
}

/**
 * Check if we should use fallback processing
 */
export function shouldUseFallback(error: any): boolean {
  console.log('Checking if should use fallback for error:', error?.message || error?.toString());

  const errorMessage = error?.message || error?.toString() || '';
  const shouldFallback = (
    errorMessage.includes('network') ||
    errorMessage.includes('connectivity') ||
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('ERR_INTERNET_DISCONNECTED') ||
    errorMessage.includes('fetch') ||
    navigator?.onLine === false
  );

  if (shouldFallback) {
    console.log('✅ Network error detected, using fallback processing');
  }

  return shouldFallback;
}