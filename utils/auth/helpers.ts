export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): string | null => {
  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }
  return null;
};

export const validatePasswordMatch = (
  password: string,
  confirmPassword: string
): string | null => {
  if (password !== confirmPassword) {
    return "Passwords do not match";
  }
  return null;
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Handle Supabase specific errors
    if (error.message.includes("Invalid login credentials")) {
      return "Invalid email or password";
    }
    if (error.message.includes("Email not confirmed")) {
      return "Please confirm your email before logging in";
    }
    if (error.message.includes("User already registered")) {
      return "This email is already registered";
    }
    return error.message;
  }
  return "An unexpected error occurred";
};
