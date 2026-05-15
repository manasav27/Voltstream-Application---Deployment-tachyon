export const LOCAL_API_BASE = 'http://127.0.0.1:8000/api/v1';
export const DEPLOYED_API_BASE = 'https://voltstream-api-846651028355.asia-south1.run.app/api/v1';
export const PRIMARY_API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === 'development' ? LOCAL_API_BASE : DEPLOYED_API_BASE);
export const API_BASES = Array.from(new Set([PRIMARY_API_BASE, LOCAL_API_BASE, DEPLOYED_API_BASE]));

export const starterMessages = [];

export const ragStarterMessages = [
  {
    role: 'bot',
    text: 'RAG Q&A is ready. Ask me from the loaded energy PDFs.',
  },
];

export const suggestionQuestions = [
  'Explain quantum computing simply.',
  'Help me write a short email.',
  'Give me ideas for a weekend project.',
];
