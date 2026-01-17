const usernamePattern = /^[a-z0-9_]{3,20}$/;

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function getUsernameError(value: string) {
  if (!value) {
    return "Username is required.";
  }

  if (!usernamePattern.test(value)) {
    return "Use 3-20 characters: lowercase letters, numbers, or underscores.";
  }

  return null;
}

export { usernamePattern };
