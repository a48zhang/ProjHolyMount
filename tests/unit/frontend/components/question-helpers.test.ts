import test from 'tape';

// Helper functions used in question components
const getQuestionTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'single_choice': '单选题',
    'multiple_choice': '多选题',
    'fill_blank': '填空题',
    'short_answer': '简答题',
    'essay': '论述题'
  };
  return labels[type] || type;
};

const getQuestionTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    'single_choice': 'blue',
    'multiple_choice': 'green',
    'fill_blank': 'orange',
    'short_answer': 'purple',
    'essay': 'red'
  };
  return colors[type] || 'default';
};

const calculateAccuracy = (correct: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
};

const normalizeFillBlankAnswer = (answer: any): string[] => {
  if (!answer) return [];
  if (Array.isArray(answer)) return answer.map(String);
  return [String(answer)];
};

const validateMultipleChoiceAnswer = (answer: any): boolean => {
  return Array.isArray(answer) && answer.every(item => typeof item === 'number');
};

test('getQuestionTypeLabel - returns correct labels', (t) => {
  t.equal(getQuestionTypeLabel('single_choice'), '单选题', 'returns single choice label');
  t.equal(getQuestionTypeLabel('multiple_choice'), '多选题', 'returns multiple choice label');
  t.equal(getQuestionTypeLabel('fill_blank'), '填空题', 'returns fill blank label');
  t.equal(getQuestionTypeLabel('short_answer'), '简答题', 'returns short answer label');
  t.equal(getQuestionTypeLabel('essay'), '论述题', 'returns essay label');
  t.equal(getQuestionTypeLabel('unknown'), 'unknown', 'returns original for unknown types');
  t.end();
});

test('getQuestionTypeColor - returns correct colors', (t) => {
  t.equal(getQuestionTypeColor('single_choice'), 'blue', 'returns blue for single choice');
  t.equal(getQuestionTypeColor('multiple_choice'), 'green', 'returns green for multiple choice');
  t.equal(getQuestionTypeColor('fill_blank'), 'orange', 'returns orange for fill blank');
  t.equal(getQuestionTypeColor('short_answer'), 'purple', 'returns purple for short answer');
  t.equal(getQuestionTypeColor('essay'), 'red', 'returns red for essay');
  t.equal(getQuestionTypeColor('unknown'), 'default', 'returns default for unknown types');
  t.end();
});

test('calculateAccuracy - calculates percentage correctly', (t) => {
  t.equal(calculateAccuracy(5, 10), 50, 'calculates 50% accuracy');
  t.equal(calculateAccuracy(8, 8), 100, 'calculates 100% accuracy');
  t.equal(calculateAccuracy(0, 10), 0, 'calculates 0% accuracy');
  t.equal(calculateAccuracy(3, 0), 0, 'handles division by zero');
  t.equal(calculateAccuracy(7, 7), 100, 'handles perfect score');
  t.end();
});

test('normalizeFillBlankAnswer - normalizes various inputs', (t) => {
  t.deepEqual(normalizeFillBlankAnswer(['answer1', 'answer2']), ['answer1', 'answer2'], 'handles string array');
  t.deepEqual(normalizeFillBlankAnswer([1, 2, 3]), ['1', '2', '3'], 'handles number array');
  t.deepEqual(normalizeFillBlankAnswer('single'), ['single'], 'handles single string');
  t.deepEqual(normalizeFillBlankAnswer(42), ['42'], 'handles single number');
  t.deepEqual(normalizeFillBlankAnswer(null), [], 'handles null input');
  t.deepEqual(normalizeFillBlankAnswer(undefined), [], 'handles undefined input');
  t.end();
});

test('validateMultipleChoiceAnswer - validates answer format', (t) => {
  t.true(validateMultipleChoiceAnswer([0, 1, 2]), 'validates correct array format');
  t.false(validateMultipleChoiceAnswer([0, '1', 2]), 'rejects string in array');
  t.false(validateMultipleChoiceAnswer('not array'), 'rejects non-array input');
  t.true(validateMultipleChoiceAnswer([]), 'accepts empty array');
  t.false(validateMultipleChoiceAnswer([0, null, 2]), 'rejects null values');
  t.end();
});