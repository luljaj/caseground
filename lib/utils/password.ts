export type PasswordValidationResult = {
  isValid: boolean;
  errors: string[];
};

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("At least 8 characters");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("One lowercase letter");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("One uppercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("One number");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function getPasswordStrength(password: string): "weak" | "medium" | "strong" {
  const { errors } = validatePassword(password);

  if (errors.length >= 3) return "weak";
  if (errors.length >= 1) return "medium";
  return "strong";
}
