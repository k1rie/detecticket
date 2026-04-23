const BASE = 'https://detecticket-production.up.railway.app';
const TICKETS = `${BASE}/api/tickets`;
const CONFIG  = `${BASE}/api/config`;

async function request(url, options = {}) {
  const res  = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ── Tickets ──────────────────────────────────────────────────────────────────
export const getModelStatus  = () => request(`${TICKETS}/status`);

export const listTickets     = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`${TICKETS}${qs ? `?${qs}` : ''}`);
};

export const createTicket    = (ticket) =>
  request(TICKETS, { method: 'POST', body: JSON.stringify(ticket) });

export const deleteTicket    = (id) =>
  request(`${TICKETS}/${id}`, { method: 'DELETE' });

export const deleteBulkByStatus = (status) =>
  request(`${TICKETS}/bulk?status=${encodeURIComponent(status)}`, { method: 'DELETE' });

export const compareTickets  = (ticketA, ticketB) =>
  request(`${TICKETS}/compare`, {
    method: 'POST',
    body: JSON.stringify({ ticketA, ticketB }),
  });

export const analyzeTicket   = (ticket, existingTickets) =>
  request(`${TICKETS}/analyze`, {
    method: 'POST',
    body: JSON.stringify({ ticket, existingTickets }),
  });

export const batchAnalyze    = (tickets, sessionName) =>
  request(`${TICKETS}/batch`, {
    method: 'POST',
    body: JSON.stringify({ tickets, sessionName }),
  });

// ── Config & Metrics ─────────────────────────────────────────────────────────
export const getAllConfig     = () => request(CONFIG);

export const updateConfig    = (key, value) =>
  request(`${CONFIG}/${key}`, {
    method: 'PATCH',
    body: JSON.stringify({ value }),
  });

export const getMetrics      = () => request(`${CONFIG}/metrics`);

export const getAccuracy     = () => request(`${CONFIG}/accuracy`);

export const submitFeedback  = (comparisonId, feedback, note = '') =>
  request(`${CONFIG}/feedback/${comparisonId}`, {
    method: 'POST',
    body: JSON.stringify({ feedback, note }),
  });
