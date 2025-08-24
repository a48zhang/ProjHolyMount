import test from 'tape';

// Validation utilities for frontend forms
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 6) errors.push('密码至少需要6个字符');
  if (password.length > 50) errors.push('密码不能超过50个字符');
  if (!/[a-z]/.test(password)) errors.push('密码需要包含小写字母');
  if (!/[A-Z]/.test(password)) errors.push('密码需要包含大写字母');
  if (!/\d/.test(password)) errors.push('密码需要包含数字');
  
  return { valid: errors.length === 0, errors };
};

const validateUsername = (username: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (username.length < 3) errors.push('用户名至少需要3个字符');
  if (username.length > 20) errors.push('用户名不能超过20个字符');
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) errors.push('用户名只能包含字母、数字、下划线和连字符');
  
  return { valid: errors.length === 0, errors };
};

const validateExamTitle = (title: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!title.trim()) errors.push('考试标题不能为空');
  if (title.length > 100) errors.push('考试标题不能超过100个字符');
  if (title.length < 3) errors.push('考试标题至少需要3个字符');
  
  return { valid: errors.length === 0, errors };
};

const sanitizeInput = (input: string): string => {
  return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

test('validateEmail - validates email format', (t) => {
  t.true(validateEmail('test@example.com'), 'valid email format');
  t.true(validateEmail('user.name@domain.co.uk'), 'valid complex email');
  t.false(validateEmail('invalid-email'), 'invalid email format');
  t.false(validateEmail('@example.com'), 'missing username');
  t.false(validateEmail('test@'), 'missing domain');
  t.false(validateEmail(''), 'empty string');
  t.false(validateEmail('test@example'), 'missing top-level domain');
  t.end();
});

test('validatePassword - validates password strength', (t) => {
  const weak1 = validatePassword('12345');
  t.false(weak1.valid, 'rejects too short password');
  t.equal(weak1.errors.length, 3, 'correctly counts 3 errors for short password');
  
  const weak2 = validatePassword('password');
  t.false(weak2.valid, 'rejects weak password');
  t.true(weak2.errors.includes('密码需要包含大写字母'), 'checks for uppercase');
  t.true(weak2.errors.includes('密码需要包含数字'), 'checks for numbers');
  t.equal(weak2.errors.length, 2, 'returns correct error count for weak password');
  
  const strong = validatePassword('StrongPass123');
  t.true(strong.valid, 'accepts strong password');
  t.equal(strong.errors.length, 0, 'no errors for strong password');
  
  const tooLong = 'a'.repeat(51);
  const longResult = validatePassword(tooLong);
  t.false(longResult.valid, 'rejects too long password');
  
  t.end();
});

test('validateUsername - validates username format', (t) => {
  t.true(validateUsername('user123').valid, 'valid username');
  t.true(validateUsername('test_user').valid, 'valid with underscore');
  t.true(validateUsername('user-name').valid, 'valid with hyphen');
  
  t.false(validateUsername('ab').valid, 'too short username');
  t.false(validateUsername('a'.repeat(21)).valid, 'too long username');
  t.false(validateUsername('user@name').valid, 'invalid character');
  t.false(validateUsername('').valid, 'empty username');
  
  t.end();
});

test('validateExamTitle - validates exam title', (t) => {
  t.true(validateExamTitle('期中考试').valid, 'valid title');
  t.true(validateExamTitle('2024年度期末考试').valid, 'valid title with numbers');
  
  t.false(validateExamTitle('').valid, 'empty title');
  t.false(validateExamTitle('  ').valid, 'whitespace only');
  t.false(validateExamTitle('AB').valid, 'too short title');
  t.false(validateExamTitle('A'.repeat(101)).valid, 'too long title');
  
  t.end();
});

test('sanitizeInput - removes dangerous content', (t) => {
  t.equal(sanitizeInput('<script>alert("xss")</script>'), '', 'removes script tags');
  t.equal(sanitizeInput('  hello world  '), 'hello world', 'trims whitespace');
  t.equal(sanitizeInput('normal text'), 'normal text', 'preserves normal text');
  t.equal(sanitizeInput('<p>Safe content</p>'), '<p>Safe content</p>', 'preserves safe HTML');
  t.equal(sanitizeInput('text<script>malicious</script>more'), 'textmore', 'removes script but keeps text');
  t.end();
});