const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'Email not confirmed': 'Please verify your email before signing in.',
};

export function toFriendlyAuthError(message: string): string {
  return AUTH_ERROR_MESSAGES[message] ?? message;
}
