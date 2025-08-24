export function authHeaders(token: string, json = true): Record<string, string> {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (json) headers['Content-Type'] = 'application/json';
    return headers;
}

export async function fetchJson<T = unknown>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
    const res = await fetch(input, init);
    if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    return data as T;
}




