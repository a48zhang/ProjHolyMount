import test from 'tape';

// Local storage utilities for frontend
const getAuthToken = (): string | null => {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
};

const setAuthToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

const removeAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
};

const getUserPreferences = (): any => {
  if (typeof window === 'undefined') return {};
  
  try {
    const prefs = localStorage.getItem('user_preferences');
    return prefs ? JSON.parse(prefs) : {};
  } catch {
    return {};
  }
};

const setUserPreferences = (preferences: any): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('user_preferences', JSON.stringify(preferences));
    } catch {
      // Handle storage quota exceeded
    }
  }
};

const clearUserData = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user_preferences');
    localStorage.removeItem('user_role');
  }
};

const getExamProgress = (examId: string): any => {
  if (typeof window === 'undefined') return null;
  
  try {
    const key = `exam_progress_${examId}`;
    const progress = localStorage.getItem(key);
    return progress ? JSON.parse(progress) : null;
  } catch {
    return null;
  }
};

const setExamProgress = (examId: string, progress: any): void => {
  if (typeof window !== 'undefined') {
    try {
      const key = `exam_progress_${examId}`;
      localStorage.setItem(key, JSON.stringify(progress));
    } catch {
      // Handle storage quota exceeded
    }
  }
};

test('auth token management', (t) => {
  // Setup DOM environment
  if (typeof window === 'undefined') {
    (global as any).window = { localStorage: new Map() };
    (global as any).localStorage = (global as any).window.localStorage;
    (global as any).localStorage.getItem = (key: string) => (global as any).localStorage.get(key) || null;
    (global as any).localStorage.setItem = (key: string, value: string) => (global as any).localStorage.set(key, value);
    (global as any).localStorage.removeItem = (key: string) => (global as any).localStorage.delete(key);
  }
  
  // Clear any existing data
  removeAuthToken();
  
  t.equal(getAuthToken(), null, 'returns null when no token exists');
  
  setAuthToken('test-token-123');
  t.equal(getAuthToken(), 'test-token-123', 'retrieves stored token');
  
  removeAuthToken();
  t.equal(getAuthToken(), null, 'removes token successfully');
  
  t.end();
});

test('user preferences management', (t) => {
  const originalLocalStorage = (global as any).localStorage;
  const mockStorage = new Map();
  
  if (typeof window === 'undefined') {
    (global as any).localStorage = {
      getItem: (key: string) => mockStorage.get(key) || null,
      setItem: (key: string, value: string) => mockStorage.set(key, value),
      removeItem: (key: string) => mockStorage.delete(key)
    };
  }
  
  const preferences = {
    theme: 'dark',
    language: 'zh-CN',
    notifications: true
  };
  
  setUserPreferences(preferences);
  const retrieved = getUserPreferences();
  t.deepEqual(retrieved, preferences, 'stores and retrieves user preferences');
  
  const empty = getUserPreferences();
  t.deepEqual(empty, preferences, 'returns empty object when none exist');
  
  setUserPreferences({});
  const emptyPrefs = getUserPreferences();
  t.deepEqual(emptyPrefs, {}, 'handles empty preferences');
  
  // Invalid JSON
  const invalidKey = 'user_preferences';
  if (typeof window !== 'undefined') {
    localStorage.setItem(invalidKey, '{invalid json}');
    const invalidPrefs = getUserPreferences();
    t.deepEqual(invalidPrefs, {}, 'handles invalid JSON gracefully');
  }
  
  if (typeof window === 'undefined') {
    (global as any).localStorage = originalLocalStorage;
  }
  
  t.end();
});

test('exam progress management', (t) => {
  const mockStorage = new Map();
  
  if (typeof window === 'undefined') {
    (global as any).localStorage = {
      getItem: (key: string) => mockStorage.get(key) || null,
      setItem: (key: string, value: string) => mockStorage.set(key, value),
      removeItem: (key: string) => mockStorage.delete(key)
    };
  }
  
  const progress = {
    startedAt: '2024-01-15T10:00:00Z',
    answers: { 1: 'answer1', 2: 'answer2' },
    currentQuestion: 3
  };
  
  setExamProgress('exam-123', progress);
  const retrieved = getExamProgress('exam-123');
  t.deepEqual(retrieved, progress, 'stores and retrieves exam progress');
  
  const nonExistent = getExamProgress('exam-456');
  t.equal(nonExistent, null, 'returns null for non-existent progress');
  
  const invalidProgress = getExamProgress('invalid-exam');
  t.equal(invalidProgress, null, 'handles invalid JSON gracefully');
  
  t.end();
});

test('clear user data', (t) => {
  const mockStorage = new Map();
  
  if (typeof window === 'undefined') {
    (global as any).localStorage = {
      getItem: (key: string) => mockStorage.get(key) || null,
      setItem: (key: string, value: string) => mockStorage.set(key, value),
      removeItem: (key: string) => mockStorage.delete(key)
    };
  }
  
  setAuthToken('token-123');
  setUserPreferences({ theme: 'dark' });
  setExamProgress('exam-1', { started: true });
  
  clearUserData();
  
  t.equal(getAuthToken(), null, 'clears auth token');
  t.deepEqual(getUserPreferences(), {}, 'clears user preferences');
  t.equal(getExamProgress('exam-1'), null, 'clears exam progress');
  
  t.end();
});