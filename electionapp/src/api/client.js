const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function request(path, options = {}) {
  const { headers: extraHeaders, body, ...rest } = options;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();

  if (!json.status) {
    throw new Error(typeof json.data === 'string' ? json.data : 'Something went wrong');
  }

  return json.data;
}

export const api = {
  get: (path, headers) => request(path, { headers }),
  post: (path, body, headers) => request(path, { method: 'POST', body, headers }),
  patch: (path, body, headers) => request(path, { method: 'PATCH', body, headers }),
};
