// Login/Signup Screen with Firebase Auth
import React, { useState } from "react";

export type AuthMode = "demo" | "authenticated" | null;

type AuthView = "options" | "login" | "signup" | "forgot-password";

interface LoginScreenProps {
  onDemoMode: () => void;
  onSignInWithEmail: (email: string, password: string) => Promise<boolean>;
  onSignUpWithEmail: (email: string, password: string, displayName?: string) => Promise<boolean>;
  onSignInWithGoogle: () => Promise<boolean>;
  onResetPassword: (email: string) => Promise<boolean>;
  error?: string | null;
  isLoading?: boolean;
  onClearError?: () => void;
}

export function LoginScreen({
  onDemoMode,
  onSignInWithEmail,
  onSignUpWithEmail,
  onSignInWithGoogle,
  onResetPassword,
  error,
  isLoading = false,
  onClearError,
}: LoginScreenProps) {
  const [view, setView] = useState<AuthView>("options");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const displayError = localError || error;

  const clearErrors = () => {
    setLocalError(null);
    onClearError?.();
  };

  const handleViewChange = (newView: AuthView) => {
    clearErrors();
    setView(newView);
    setPassword("");
    setConfirmPassword("");
    setResetSent(false);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!email.trim() || !password.trim()) {
      setLocalError("Please enter both email and password");
      return;
    }

    await onSignInWithEmail(email.trim(), password);
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!email.trim() || !password.trim()) {
      setLocalError("Please enter both email and password");
      return;
    }

    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Passwords don't match");
      return;
    }

    await onSignUpWithEmail(email.trim(), password, displayName.trim() || undefined);
  };

  const handleGoogleSignIn = async () => {
    clearErrors();
    await onSignInWithGoogle();
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!email.trim()) {
      setLocalError("Please enter your email address");
      return;
    }

    const success = await onResetPassword(email.trim());
    if (success) {
      setResetSent(true);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <svg viewBox="0 0 100 100" width="80" height="80">
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="45" fill="none" stroke="url(#logoGradient)" strokeWidth="4" />
              <circle cx="50" cy="50" r="30" fill="none" stroke="url(#logoGradient)" strokeWidth="3" opacity="0.7" />
              <circle cx="50" cy="50" r="15" fill="url(#logoGradient)" />
            </svg>
          </div>
          <h1 className="login-title">Looops</h1>
          <p className="login-subtitle">Your Personal Operating System</p>
        </div>

        {view === "options" && (
          <div className="login-options">
            <button
              className="login-btn login-btn--google"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <span className="login-btn-icon">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </span>
              <span className="login-btn-content">
                <span className="login-btn-title">Continue with Google</span>
              </span>
            </button>

            <div className="login-divider">
              <span>or</span>
            </div>

            <button
              className="login-btn login-btn--email"
              onClick={() => handleViewChange("login")}
              disabled={isLoading}
            >
              <span className="login-btn-icon">📧</span>
              <span className="login-btn-content">
                <span className="login-btn-title">Sign in with Email</span>
              </span>
            </button>

            <button
              className="login-btn login-btn--signup"
              onClick={() => handleViewChange("signup")}
              disabled={isLoading}
            >
              <span className="login-btn-icon">✨</span>
              <span className="login-btn-content">
                <span className="login-btn-title">Create Account</span>
              </span>
            </button>

            <div className="login-divider">
              <span>or</span>
            </div>

            <button
              className="login-btn login-btn--demo"
              onClick={onDemoMode}
              disabled={isLoading}
            >
              <span className="login-btn-icon">👀</span>
              <span className="login-btn-content">
                <span className="login-btn-title">Explore Demo</span>
                <span className="login-btn-desc">See how Looops works with sample data</span>
              </span>
            </button>

            {displayError && <div className="login-error">{displayError}</div>}
          </div>
        )}

        {view === "login" && (
          <form className="login-form" onSubmit={handleEmailLogin}>
            <button
              type="button"
              className="login-back"
              onClick={() => handleViewChange("options")}
              disabled={isLoading}
            >
              ← Back
            </button>

            <h2 className="login-form-title">Sign In</h2>

            <div className="login-form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                autoFocus
                disabled={isLoading}
              />
            </div>

            <div className="login-form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>

            {displayError && <div className="login-error">{displayError}</div>}

            <button
              type="submit"
              className="login-submit"
              disabled={!email.trim() || !password.trim() || isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>

            <button
              type="button"
              className="login-link"
              onClick={() => handleViewChange("forgot-password")}
              disabled={isLoading}
            >
              Forgot your password?
            </button>

            <div className="login-switch">
              Don't have an account?{" "}
              <button
                type="button"
                className="login-link-inline"
                onClick={() => handleViewChange("signup")}
                disabled={isLoading}
              >
                Sign up
              </button>
            </div>
          </form>
        )}

        {view === "signup" && (
          <form className="login-form" onSubmit={handleEmailSignup}>
            <button
              type="button"
              className="login-back"
              onClick={() => handleViewChange("options")}
              disabled={isLoading}
            >
              ← Back
            </button>

            <h2 className="login-form-title">Create Account</h2>

            <div className="login-form-group">
              <label htmlFor="displayName">Name (optional)</label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                autoComplete="name"
                autoFocus
                disabled={isLoading}
              />
            </div>

            <div className="login-form-group">
              <label htmlFor="signup-email">Email</label>
              <input
                type="email"
                id="signup-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            <div className="login-form-group">
              <label htmlFor="signup-password">Password</label>
              <input
                type="password"
                id="signup-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a password (min. 6 characters)"
                autoComplete="new-password"
                disabled={isLoading}
              />
            </div>

            <div className="login-form-group">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                autoComplete="new-password"
                disabled={isLoading}
              />
            </div>

            {displayError && <div className="login-error">{displayError}</div>}

            <button
              type="submit"
              className="login-submit"
              disabled={!email.trim() || !password.trim() || !confirmPassword.trim() || isLoading}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>

            <div className="login-switch">
              Already have an account?{" "}
              <button
                type="button"
                className="login-link-inline"
                onClick={() => handleViewChange("login")}
                disabled={isLoading}
              >
                Sign in
              </button>
            </div>
          </form>
        )}

        {view === "forgot-password" && (
          <form className="login-form" onSubmit={handleForgotPassword}>
            <button
              type="button"
              className="login-back"
              onClick={() => handleViewChange("login")}
              disabled={isLoading}
            >
              ← Back
            </button>

            <h2 className="login-form-title">Reset Password</h2>

            {resetSent ? (
              <div className="login-success">
                <p>Password reset email sent!</p>
                <p className="login-success-hint">
                  Check your inbox for instructions to reset your password.
                </p>
                <button
                  type="button"
                  className="login-submit"
                  onClick={() => handleViewChange("login")}
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <>
                <p className="login-form-description">
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                <div className="login-form-group">
                  <label htmlFor="reset-email">Email</label>
                  <input
                    type="email"
                    id="reset-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    autoComplete="email"
                    autoFocus
                    disabled={isLoading}
                  />
                </div>

                {displayError && <div className="login-error">{displayError}</div>}

                <button
                  type="submit"
                  className="login-submit"
                  disabled={!email.trim() || isLoading}
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </>
            )}
          </form>
        )}

        <div className="login-footer">
          <p>Balance your life across all dimensions</p>
        </div>
      </div>
    </div>
  );
}
