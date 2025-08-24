import test from 'tape';
import { sanitizeHtml } from '@/lib/sanitize';

test('sanitizeHtml - basic functionality', (t) => {
  t.equal(sanitizeHtml(''), '', 'handles empty string');
  t.equal(sanitizeHtml('Hello World'), 'Hello World', 'allows plain text');
  t.equal(sanitizeHtml('<p>Hello</p>'), '<p>Hello</p>', 'allows safe HTML');
  
  t.end();
});

test('sanitizeHtml - removes dangerous HTML', (t) => {
  t.equal(sanitizeHtml('<script>alert("xss")</script>'), '', 'removes script tags and content');
  t.equal(sanitizeHtml('<style>body{display:none}</style>'), '', 'removes style tags and content');
  t.equal(sanitizeHtml('<div onclick="alert(1)">test</div>'), '<div>test</div>', 'removes onclick attributes');
  
  t.end();
});

test('sanitizeHtml - handles images safely', (t) => {
  t.equal(sanitizeHtml('<img src="https://example.com/image.jpg">'), '<img src="https://example.com/image.jpg">', 'allows https images');
  t.equal(sanitizeHtml('<img src="data:image/png;base64,abc">'), '<img src="data:image/png;base64,abc">', 'allows data images');
  t.equal(sanitizeHtml('<img src="ftp://example.com/image.jpg">'), '<img src="">', 'blocks ftp images');
  
  t.end();
});

test('sanitizeHtml - handles complex input', (t) => {
  const complex = '<div onclick="alert(1)" style="color:red"><script>alert("xss")</script><p>Safe content</p><img src="javascript:alert(1)"></div>';
  const expected = '<div style="color:red"><p>Safe content</p><img src=""></div>';
  t.equal(sanitizeHtml(complex), expected, 'handles complex malicious input');
  
  t.end();
});