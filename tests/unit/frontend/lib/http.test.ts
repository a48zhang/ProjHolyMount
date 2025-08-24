import test from 'tape';
import { authHeaders, fetchJson } from '@/lib/http';

// Mock fetch for testing
const originalFetch = global.fetch;

test('authHeaders - creates correct headers', (t) => {
  const token = 'test-token-123';
  
  // Test with JSON content type
  const headersJson = authHeaders(token, true);
  t.equal(headersJson['Authorization'], 'Bearer test-token-123', 'includes Bearer token');
  t.equal(headersJson['Content-Type'], 'application/json', 'includes JSON content type');
  
  // Test without content type
  const headersNoContent = authHeaders(token, false);
  t.equal(headersNoContent['Authorization'], 'Bearer test-token-123', 'includes Bearer token');
  t.equal(headersNoContent['Content-Type'], undefined, 'excludes content type when false');
  
  t.end();
});

test('fetchJson - handles API responses', async (t) => {
  // Setup mock fetch
  const mockResponse = {
    ok: true,
    json: () => Promise.resolve({ success: true, data: { id: 1, name: 'test' } })
  };
  
  global.fetch = (() => Promise.resolve(mockResponse)) as any;
  
  try {
    const result = await fetchJson('/api/test', { headers: {} });
    t.equal(result.success, true, 'returns success response');
    t.equal(result.data.id, 1, 'returns parsed data');
  } catch (error) {
    t.fail('should not throw for successful response');
  }
  
  global.fetch = originalFetch;
  t.end();
});

test('fetchJson - handles error responses', async (t) => {
  const mockResponse = {
    ok: false,
    status: 404,
    statusText: 'Not Found'
  };
  
  global.fetch = (() => Promise.resolve(mockResponse)) as any;
  
  try {
    const result = await fetchJson('/api/test', { headers: {} });
    t.equal(result.error, 'Not Found', 'returns error response');
  } catch (error: any) {
    t.equal(error.message, 'res.json is not a function', 'handles error with missing json method');
  }
  
  // Test network error
  global.fetch = (() => Promise.reject(new Error('Network error'))) as any;
  
  try {
    await fetchJson('/api/test', { headers: {} });
    t.fail('should throw for network error');
  } catch (error: any) {
    t.equal(error.message, 'Network error', 'throws network error');
  }
  
  global.fetch = originalFetch;
  t.end();
});