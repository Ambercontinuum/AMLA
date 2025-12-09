
export const CHN_INDICATORS: Record<string, string[]> = {
  absolutist: ['always', 'never', 'everyone', 'nobody', 'completely', 'totally', 'must', 'impossible', 'forever'],
  uncertainty: ['maybe', 'perhaps', 'possibly', 'might', 'could', 'unsure', 'confused', 'guess'],
  emotional_negative: ['bad', 'terrible', 'hate', 'wrong', 'fail', 'error', 'broken', 'stupid', 'useless', 'angry', 'sad'],
  emotional_positive: ['love', 'great', 'awesome', 'amazing', 'perfect', 'happy', 'thanks', 'good'],
  technical: ['code', 'function', 'api', 'bug', 'error', 'compile', 'runtime', 'variable', 'script', 'deploy', 'react', 'node']
};

export interface ContextAnalysis {
  status_code: string;
  support_level: number;
  dominant_mode: string;
  indicators: Record<string, number>;
}

/**
 * Analyzes text for learning context and support needs.
 */
export const analyze_context = (text: string): ContextAnalysis => {
  if (!text) {
     return {
        status_code: "WAITING_FOR_INPUT",
        support_level: 0,
        dominant_mode: "none",
        indicators: {}
     };
  }

  const lowerText = text.toLowerCase();
  const counts: Record<string, number> = {};
  
  // Initialize counts
  Object.keys(CHN_INDICATORS).forEach(k => counts[k] = 0);

  // Count indicators
  for (const [category, words] of Object.entries(CHN_INDICATORS)) {
    let catCount = 0;
    words.forEach(word => {
      if (lowerText.includes(word)) {
        catCount++;
      }
    });
    counts[category] = catCount;
  }

  // Calculate Support Level (0.0 - 1.0)
  // Higher score = Higher need for detailed guidance/support
  let score = 0.2; // Base level
  
  if (counts.absolutist > 0) score += 0.3;
  if (counts.emotional_negative > 0) score += 0.3;
  if (counts.uncertainty > 0) score += 0.1;
  if (counts.technical > 0) score -= 0.2; // Technical focus implies higher autonomy
  
  // Normalize
  score = Math.max(0, Math.min(1, parseFloat(score.toFixed(2))));

  // Determine Context Status Code
  let code = "STANDARD_FLOW";
  if (score >= 0.7) code = "HIGH_SUPPORT_NEEDED";
  else if (score >= 0.5) code = "GUIDANCE_REQUIRED";
  else if (counts.technical > 0 && counts.emotional_negative > 0) code = "DEBUG_ASSISTANCE";
  else if (counts.technical > 0) code = "TECHNICAL_ACCELERATION";

  // Determine Dominant Mode
  let dominantMode = "neutral";
  let maxCount = -1;
  
  Object.entries(counts).forEach(([mode, count]) => {
      if (count > maxCount && count > 0) {
          maxCount = count;
          dominantMode = mode;
      }
  });

  // Rename modes for display
  const modeMap: Record<string, string> = {
      'emotional_negative': 'Frustrated',
      'emotional_positive': 'Positive',
      'technical': 'Technical',
      'absolutist': 'Rigid',
      'uncertainty': 'Uncertain',
      'neutral': 'Neutral'
  };

  return {
    status_code: code,
    support_level: score,
    dominant_mode: modeMap[dominantMode] || dominantMode,
    indicators: counts
  };
};
