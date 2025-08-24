import test from 'tape';

// Helper functions from question-editor component
const normalizeAnswerKey = (type: string, key: any): any => {
  if (type === 'single_choice') {
    return typeof key === 'number' ? key : 0;
  }
  
  if (type === 'multiple_choice') {
    return Array.isArray(key) ? key : [];
  }
  
  if (type === 'fill_blank') {
    return Array.isArray(key) ? key.map(String) : [String(key || '')];
  }
  
  return String(key || '');
};

const prepareQuestionContent = (type: string, data: any): any => {
  switch (type) {
    case 'single_choice':
      return {
        stem: data.stem || '',
        options: Array.isArray(data.options) ? data.options : ['', ''],
        images: Array.isArray(data.images) ? data.images : []
      };
      
    case 'multiple_choice':
      return {
        stem: data.stem || '',
        options: Array.isArray(data.options) ? data.options : ['', ''],
        images: Array.isArray(data.images) ? data.images : []
      };
      
    case 'fill_blank':
      return {
        text: data.text || '',
        blanks: Array.from({ length: data.blankCount || 1 }),
        images: Array.isArray(data.images) ? data.images : []
      };
      
    case 'short_answer':
    case 'essay':
      return {
        prompt: data.prompt || '',
        images: Array.isArray(data.images) ? data.images : []
      };
      
    default:
      return {};
  }
};

const validateQuestionData = (type: string, data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  switch (type) {
    case 'single_choice':
    case 'multiple_choice':
      if (!data.stem?.trim()) errors.push('题干不能为空');
      if (!Array.isArray(data.options) || data.options.length < 2) errors.push('至少需要2个选项');
      break;
      
    case 'fill_blank':
      if (!data.text?.trim()) errors.push('题目文本不能为空');
      if (!data.blankCount || data.blankCount < 1) errors.push('空格数量必须大于0');
      break;
      
    case 'short_answer':
    case 'essay':
      if (!data.prompt?.trim()) errors.push('提示不能为空');
      break;
  }
  
  return { valid: errors.length === 0, errors };
};

test('normalizeAnswerKey - normalizes different answer types', (t) => {
  t.equal(normalizeAnswerKey('single_choice', 3), 3, 'normalizes single choice');
  t.equal(normalizeAnswerKey('single_choice', '5'), 5, 'converts string to number');
  t.equal(normalizeAnswerKey('single_choice', null), 0, 'handles null for single choice');
  
  t.deepEqual(normalizeAnswerKey('multiple_choice', [1, 3]), [1, 3], 'normalizes multiple choice');
  t.deepEqual(normalizeAnswerKey('multiple_choice', 2), [], 'handles non-array for multiple choice');
  
  t.deepEqual(normalizeAnswerKey('fill_blank', ['apple', 'banana']), ['apple', 'banana'], 'normalizes fill blank');
  t.deepEqual(normalizeAnswerKey('fill_blank', 'single'), ['single'], 'handles single fill blank');
  
  t.end();
});

test('prepareQuestionContent - prepares correct content structure', (t) => {
  const singleData = { stem: 'Test', options: ['A', 'B'], images: ['img1.jpg'] };
  const singleResult = prepareQuestionContent('single_choice', singleData);
  t.equal(singleResult.stem, 'Test', 'sets stem for single choice');
  t.deepEqual(singleResult.options, ['A', 'B'], 'sets options for single choice');
  t.deepEqual(singleResult.images, ['img1.jpg'], 'sets images for single choice');
  
  const blankData = { text: 'Fill the ___', blankCount: 2 };
  const blankResult = prepareQuestionContent('fill_blank', blankData);
  t.equal(blankResult.text, 'Fill the ___', 'sets text for fill blank');
  t.equal(blankResult.blanks.length, 2, 'sets blank count for fill blank');
  
  const essayData = { prompt: 'Explain...' };
  const essayResult = prepareQuestionContent('essay', essayData);
  t.equal(essayResult.prompt, 'Explain...', 'sets prompt for essay');
  
  t.end();
});

test('validateQuestionData - validates different question types', (t) => {
  const singleValid = validateQuestionData('single_choice', { stem: 'Test', options: ['A', 'B'] });
  t.true(singleValid.valid, 'validates correct single choice');
  t.equal(singleValid.errors.length, 0, 'no errors for valid single choice');
  
  const singleInvalid = validateQuestionData('single_choice', { stem: '', options: ['A'] });
  t.false(singleInvalid.valid, 'invalidates single choice with issues');
  t.true(singleInvalid.errors.includes('题干不能为空'), 'checks empty stem');
  t.true(singleInvalid.errors.includes('至少需要2个选项'), 'checks minimum options');
  
  const fillValid = validateQuestionData('fill_blank', { text: 'Test', blankCount: 3 });
  t.true(fillValid.valid, 'validates correct fill blank');
  
  const essayInvalid = validateQuestionData('essay', { prompt: '' });
  t.false(essayInvalid.valid, 'invalidates essay with empty prompt');
  t.true(essayInvalid.errors.includes('提示不能为空'), 'checks empty prompt');
  
  t.end();
});