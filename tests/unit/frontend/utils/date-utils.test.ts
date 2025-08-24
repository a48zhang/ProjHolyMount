import test from 'tape';

// Date formatting utilities (common frontend functions)
const formatDuration = (minutes: number | null): string => {
  if (!minutes) return '不限时';
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`;
};

const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return '无限制';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const isExamActive = (start?: string | null, end?: string | null): boolean => {
  const now = new Date();
  const startDate = start ? new Date(start) : new Date(0);
  const endDate = end ? new Date(end) : new Date(8640000000000000); // far future
  return now >= startDate && now <= endDate;
};

test('formatDuration - handles different durations', (t) => {
  t.equal(formatDuration(null), '不限时', 'handles null duration');
  t.equal(formatDuration(0), '不限时', 'handles zero duration');
  t.equal(formatDuration(30), '30分钟', 'handles minutes only');
  t.equal(formatDuration(90), '1小时30分钟', 'handles hours and minutes');
  t.equal(formatDuration(120), '2小时', 'handles exact hours');
  t.equal(formatDuration(1439), '23小时59分钟', 'handles large durations');
  t.end();
});

test('formatDateTime - handles different date formats', (t) => {
  t.equal(formatDateTime(null), '无限制', 'handles null date');
  t.equal(formatDateTime('2024-01-15T14:30:00'), '2024/01/15 14:30', 'formats ISO date');
  t.equal(formatDateTime('2024-12-31T23:59:59'), '2024/12/31 23:59', 'formats end of year');
  t.end();
});

test('isExamActive - determines exam availability', (t) => {
  const past = new Date(Date.now() - 86400000).toISOString(); // yesterday
  const future = new Date(Date.now() + 86400000).toISOString(); // tomorrow
  const now = new Date().toISOString();
  
  t.true(isExamActive(now), 'active when no bounds');
  t.false(isExamActive(future), 'inactive when start is future');
  t.false(isExamActive(null, past), 'inactive when end is past');
  t.true(isExamActive(past, future), 'active when between bounds');
  t.end();
});