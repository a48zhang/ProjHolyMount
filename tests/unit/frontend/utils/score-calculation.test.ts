import test from 'tape';

// Score calculation utilities for frontend
const calculateObjectiveScore = (question: any, userAnswer: any): number => {
  if (!question || question.answerKey === undefined || question.answerKey === null) return 0;
  
  const { type, answerKey } = question;
  
  switch (type) {
    case 'single_choice':
      return userAnswer === answerKey ? 1 : 0;
      
    case 'multiple_choice':
      const userArray = Array.isArray(userAnswer) ? [...userAnswer].sort() : [];
      const answerArray = Array.isArray(answerKey) ? [...answerKey].sort() : [];
      return JSON.stringify(userArray) === JSON.stringify(answerArray) ? 1 : 0;
      
    case 'fill_blank':
      const userBlanks = Array.isArray(userAnswer) ? userAnswer : [];
      const answerBlanks = Array.isArray(answerKey) ? answerKey : [];
      
      if (userBlanks.length !== answerBlanks.length) return 0;
      
      for (let i = 0; i < answerBlanks.length; i++) {
        const acceptAnswers = Array.isArray(answerBlanks[i]) ? answerBlanks[i] : [answerBlanks[i]];
        const userAnswer = String(userBlanks[i] || '').trim().toLowerCase();
        const isCorrect = acceptAnswers.some((ans: string) => String(ans).trim().toLowerCase() === userAnswer);
        if (!isCorrect) return 0;
      }
      return 1;
      
    default:
      return 0;
  }
};

const calculateTotalScore = (items: any[]): number => {
  return items.reduce((total, item) => total + (item.points || 0), 0);
};

const calculateUserScore = (results: any[]): number => {
  return results.reduce((total, result) => total + (result.correct ? result.score_unit || 0 : 0), 0);
};

const formatScoreText = (score: number, total: number): string => {
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  return `${score}/${total} (${percentage}%)`;
};

const getScoreLevel = (percentage: number): string => {
  if (percentage >= 90) return '优秀';
  if (percentage >= 80) return '良好';
  if (percentage >= 70) return '中等';
  if (percentage >= 60) return '及格';
  return '不及格';
};

test('calculateObjectiveScore - single choice', (t) => {
  const question1 = { type: 'single_choice', answerKey: 2 };
  t.equal(calculateObjectiveScore(question1, 2), 1, 'correct single choice');
  t.equal(calculateObjectiveScore(question1, 1), 0, 'incorrect single choice');
  
  const question2 = { type: 'single_choice', answerKey: 0 };
  t.equal(calculateObjectiveScore(question2, 0), 1, 'correct at index 0');
  
  t.end();
});

test('calculateObjectiveScore - multiple choice', (t) => {
  const question1 = { type: 'multiple_choice', answerKey: [0, 2] };
  t.equal(calculateObjectiveScore(question1, [0, 2]), 1, 'correct multiple choice order');
  t.equal(calculateObjectiveScore(question1, [2, 0]), 1, 'correct multiple choice different order');
  t.equal(calculateObjectiveScore(question1, [0, 1]), 0, 'incorrect multiple choice');
  t.equal(calculateObjectiveScore(question1, [0]), 0, 'partial multiple choice');
  
  t.end();
});

test('calculateObjectiveScore - fill blank', (t) => {
  const question1 = { type: 'fill_blank', answerKey: ['apple', 'banana'] };
  t.equal(calculateObjectiveScore(question1, ['apple', 'banana']), 1, 'correct fill blank');
  t.equal(calculateObjectiveScore(question1, ['Apple', 'banana']), 1, 'case insensitive');
  t.equal(calculateObjectiveScore(question1, ['apple']), 0, 'partial fill blank');
  t.equal(calculateObjectiveScore(question1, ['wrong', 'answer']), 0, 'incorrect fill blank');
  
  const question2 = { type: 'fill_blank', answerKey: [['apple', 'fruit'], 'banana'] };
  t.equal(calculateObjectiveScore(question2, ['fruit', 'banana']), 1, 'accepts alternative answers');
  
  t.end();
});

test('calculateTotalScore - sums up points', (t) => {
  const items = [
    { points: 5 },
    { points: 10 },
    { points: 3 },
    { points: 0 }
  ];
  
  t.equal(calculateTotalScore(items), 18, 'calculates total score correctly');
  t.equal(calculateTotalScore([]), 0, 'handles empty array');
  t.equal(calculateTotalScore([{ points: 0 }]), 0, 'handles zero points');
  
  t.end();
});

test('calculateUserScore - calculates user score', (t) => {
  const results = [
    { correct: true, score_unit: 5 },
    { correct: false, score_unit: 3 },
    { correct: true, score_unit: 2 },
    { correct: true, score_unit: 0 }
  ];
  
  t.equal(calculateUserScore(results), 7, 'calculates user score correctly');
  t.equal(calculateUserScore([]), 0, 'handles empty results');
  t.equal(calculateUserScore([{ correct: false, score_unit: 5 }]), 0, 'counts only correct answers');
  
  t.end();
});

test('formatScoreText - formats score display', (t) => {
  t.equal(formatScoreText(75, 100), '75/100 (75%)', 'formats normal score');
  t.equal(formatScoreText(100, 100), '100/100 (100%)', 'formats perfect score');
  t.equal(formatScoreText(0, 100), '0/100 (0%)', 'formats zero score');
  t.equal(formatScoreText(0, 0), '0/0 (0%)', 'handles zero total');
  
  t.end();
});

test('getScoreLevel - determines score level', (t) => {
  t.equal(getScoreLevel(95), '优秀', 'excellent score');
  t.equal(getScoreLevel(85), '良好', 'good score');
  t.equal(getScoreLevel(75), '中等', 'medium score');
  t.equal(getScoreLevel(65), '及格', 'passing score');
  t.equal(getScoreLevel(55), '不及格', 'failing score');
  t.equal(getScoreLevel(100), '优秀', 'perfect score');
  t.equal(getScoreLevel(0), '不及格', 'zero score');
  
  t.end();
});