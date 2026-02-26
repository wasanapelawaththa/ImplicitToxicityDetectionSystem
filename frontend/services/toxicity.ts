// Simple keyword-based content moderation
const TOXIC_KEYWORDS = [
  'hate', 'kill', 'die', 'stupid', 'idiot', 'dumb', 'loser',
  'ugly', 'fat', 'worst', 'terrible', 'suck', 'damn', 'hell'
];

export const checkToxicity = async (text: string): Promise<{ isToxic: boolean; score: number; reason?: string }> => {
  const lowerText = text.toLowerCase();
  
  // Check for toxic keywords
  const foundKeywords = TOXIC_KEYWORDS.filter(keyword => lowerText.includes(keyword));
  
  if (foundKeywords.length > 0) {
    const score = Math.min(foundKeywords.length * 0.3, 1); // Score based on number of toxic words
    return {
      isToxic: true,
      score: score,
      reason: `Contains potentially harmful language: ${foundKeywords.join(', ')}`
    };
  }
  
  // Check for excessive caps (might indicate shouting/aggression)
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.5 && text.length > 10) {
    return {
      isToxic: true,
      score: 0.4,
      reason: 'Excessive use of capital letters'
    };
  }
  
  return { isToxic: false, score: 0 };
};
