import React, { useState } from "react";
import logo from "../pages/logo.png";
import PasswordResetForm from "../components/PasswordResetForm";

import NProgress from "nprogress";
import "nprogress/nprogress.css";

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [resetStage, setResetStage] = useState("idle");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    try {
      NProgress.start();
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(data.error || "Login failed");
      }

      const serverRes = await fetch("/api/server-time");
      const serverData = await serverRes.json();

      localStorage.setItem("serverStart", serverData.startTime);
      NProgress.done();

      setTimeout(() => {
        onLogin(username);
      }, 300);
    } catch (err) {
      NProgress.done();
      setIsError(true);
      setMessage(err.message);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      setIsError(true);
      setMessage("Enter your username first");
      return;
    }

    try {
      setMessage("");
      setIsError(false);

      const res = await fetch("/api/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "User not found");
      }

      // ✅ ONLY OPEN RESET FORM IF USER EXISTS
      setResetStage("request");
    } catch (err) {
      setIsError(true);
      setMessage(err.message);
    }
  };

  const handleVerifyOtp = async () => {
   if (otp.length !== 6) {
  setIsError(true);
  setMessage("Enter valid 6-digit OTP");
  return;
}

    try {
      setIsError(false);
      setMessage("");

      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "OTP invalid");
      }

      // ✅ ONLY IF OTP CORRECT
      setMessage("OTP verified");
      setResetStage("reset");
    } catch (err) {
      setIsError(true);
      setMessage(err.message);
     setOtp("");
    }
  };

  const handleResetSuccess = (user) => {
    // Auto-login after successful password reset
    onLogin(user);
  };

  const handleResetCancel = () => {
    setResetStage("idle");
    setMessage("");
    setPassword("");
  };

  return (
    <main className="login-shell">
      <div className="login-card card">
        <div className="login-brand-wrap">
          <img
            src={logo}
            alt="TecnoPrism"
            className="brand large login-brand"
          />
        </div>

        <div className="login-content">
          {resetStage === "idle" ? (
            <form onSubmit={handleSubmit} className="login-form">
              <div>
                <h1 className="login-title">Sign In</h1>
                <p className="login-subtitle">
                  Secure access to your appraisal dashboard.
                </p>
              </div>

              <div className="login-field">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="login-input"
                />
              </div>

              <div className="login-field">
                <label htmlFor="password">Password</label>
                <div className="login-input-group">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="login-input"
                  />
                  <button
                    type="button"
                    className="login-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.62 21.62 0 0 1 5-5.94" />
                        <path d="M1 1l22 22" />
                        <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {message && (
                <div
                  className={`login-message ${isError ? "login-message--error" : "login-message--success"}`}
                >
                  {message}
                </div>
              )}

              <button type="submit" className="btn btn-primary full-width">
                Sign In
              </button>

              <div className="login-footer">
                <button
                  type="button"
                  onClick={handleForgot}
                  className="login-link-button"
                >
                  Forgot password?
                </button>
              </div>
            </form>
          ) : resetStage === "request" ? (
            <div className="login-form">
              <h2 className="login-title">Reset Password</h2>

              <div className="login-field">
                <label htmlFor="reset-email">Email</label>
                <input
                  id="reset-email"
                  type="email"
                  placeholder="Enter registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input"
                />
              </div>

              {message && (
                <div
                  className={`login-message ${isError ? "login-message--error" : "login-message--success"}`}
                >
                  {message}
                </div>
              )}

              <button
                type="button"
                className="btn btn-primary full-width"
                onClick={async () => {
                  if (!email.trim()) {
                    setIsError(true);
                    setMessage("Enter email");
                    return;
                  }

                  try {
                    setIsError(false);
                    setMessage("");

                    const res = await fetch("/api/send-otp", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ username, email }),
                    });

                    const data = await res.json();

                    if (!res.ok) throw new Error(data.error || "OTP failed");

                    setMessage("OTP sent to your email");
                    setResetStage("otp");
                  } catch (err) {
                    setIsError(true);
                    setMessage(err.message);
                  }
                }}
              >
                Send OTP
              </button>

              <button
                type="button"
                className="login-link-button"
                onClick={() => setResetStage("idle")}
              >
                Back
              </button>
            </div>
          ) : resetStage === "otp" ? (
  <div className="login-form">
    <h2 className="login-title">Enter OTP</h2>

    <div className="login-field">
      <label htmlFor="otp">OTP</label>
      <input
        id="otp"
        type="text"
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, "").slice(0, 6);
          setOtp(value);
        }}
        maxLength={6}
        className="login-input"
      />
    </div>

    {/* ✅ ADD THIS */}
    {message && (
      <div
        className={`login-message ${
          isError ? "login-message--error" : "login-message--success"
        }`}
      >
        {message}
      </div>
    )}

    <button
      className="btn btn-primary full-width"
      onClick={handleVerifyOtp}
    >
      Verify OTP
    </button>
  </div>
) : resetStage === "reset" ? (
  <PasswordResetForm
              username={username}
              onSuccess={handleResetSuccess}
              onCancel={handleResetCancel}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}

export default LoginPage;
