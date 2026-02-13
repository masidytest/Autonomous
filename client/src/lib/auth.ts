const TOKEN_KEY = 'masidy_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function savePendingPrompt(prompt: string) {
  sessionStorage.setItem('masidy_pending_prompt', prompt);
}

export function getPendingPrompt(): string | null {
  const prompt = sessionStorage.getItem('masidy_pending_prompt');
  if (prompt) {
    sessionStorage.removeItem('masidy_pending_prompt');
  }
  return prompt;
}
