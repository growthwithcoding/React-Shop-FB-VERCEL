// src/pages/AuthPage.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function AuthPage() {
  const { user, initializing, signInEmail, signUpEmail, signInGoogle, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [mode, setMode] = useState("login"); // 'login' | 'signup' | 'reset'
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // If a protected route sent us here, go back there after auth; else /dashboard
  const redirectTo = location.state?.from?.pathname || "/dashboard";

  // ✅ Always sync UI with ?mode= param (default to login)
  useEffect(() => {
    const m = (searchParams.get("mode") || "login").toLowerCase();
    if (m === "signup") {
      setMode("signup");
    } else if (m === "reset") {
      setMode("reset");
    } else {
      setMode("login");
    }
  }, [searchParams]);

  // Already signed in? bounce away to role-appropriate dashboard
  useEffect(() => {
    if (!initializing && user) {
      // Send admins to admin dashboard, others to normal dashboard or redirectTo
      if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate(redirectTo, { replace: true });
      }
    }
  }, [initializing, user, redirectTo, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setSuccessMsg("");
    try {
      if (mode === "login") {
        await signInEmail(email, pw);
      } else if (mode === "signup") {
        await signUpEmail(email, pw); // auto-signed-in after signup
      } else if (mode === "reset") {
        await resetPassword(email);
        setSuccessMsg("Password reset email sent! Check your inbox.");
        setEmail("");
      }
      // No need to navigate here, handled in useEffect above!
    } catch (e) {
      setErr(e.message || String(e));
    }
  };

  const handleGoogle = async () => {
    setErr("");
    setSuccessMsg("");
    try {
      await signInGoogle();
      // No need to navigate here, handled in useEffect above!
    } catch (e) {
      setErr(e.message || String(e));
    }
  };

  // Helpers to toggle mode and keep URL in sync
  const goLogin = () => {
    setMode("login");
    setErr("");
    setSuccessMsg("");
    navigate("/login?mode=login", { replace: true });
  };
  const goSignup = () => {
    setMode("signup");
    setErr("");
    setSuccessMsg("");
    navigate("/login?mode=signup", { replace: true });
  };
  const goReset = () => {
    setMode("reset");
    setErr("");
    setSuccessMsg("");
    navigate("/login?mode=reset", { replace: true });
  };

  if (initializing) {
    return <div style={{ padding: 24 }}>Loading…</div>;
  }

  return (
    <div style={{ 
      maxWidth: 420, 
      margin: "60px auto", 
      padding: 32, 
      border: "1px solid #e5e7eb", 
      borderRadius: 12,
      background: "#fff",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1), 0 6px 10px rgba(0, 0, 0, 0.08)"
    }}>
      <h2 style={{ marginBottom: 24, color: "#1a1a1a", fontSize: 28, fontWeight: 700 }}>
        {mode === "login" ? "Welcome Back" : mode === "signup" ? "Create Account" : "Reset Password"}
      </h2>

      {mode === "reset" && (
        <p style={{ marginBottom: 16, fontSize: 14, color: "#666" }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
        <input
          type="email"
          placeholder="email@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ 
            padding: 12, 
            borderRadius: 8, 
            border: "1px solid #ddd",
            fontSize: 15
          }}
          autoComplete="email"
        />
        {mode !== "reset" && (
          <input
            type="password"
            placeholder="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
            style={{ 
              padding: 12, 
              borderRadius: 8, 
              border: "1px solid #ddd",
              fontSize: 15
            }}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        )}
        <button 
          type="submit" 
          style={{ 
            padding: 14, 
            background: "#ff9900", 
            color: "#fff", 
            border: "none", 
            borderRadius: 8, 
            fontSize: 16, 
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(255, 153, 0, 0.3)",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.background = "#e68a00"}
          onMouseOut={(e) => e.currentTarget.style.background = "#ff9900"}
        >
          {mode === "login" ? "Log in" : mode === "signup" ? "Sign up" : "Send Reset Link"}
        </button>
      </form>

      {mode === "login" && (
        <>
          <div style={{ margin: "16px 0", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: "#ddd" }} />
            <span style={{ color: "#666", fontSize: 13 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "#ddd" }} />
          </div>

          <button 
            onClick={handleGoogle} 
            style={{ 
              padding: 14, 
              width: "100%", 
              background: "#fff", 
              border: "1px solid #ddd", 
              borderRadius: 8, 
              fontSize: 16, 
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#f8f9fa";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.12)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.08)";
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </>
      )}

      {err && (
        <div style={{ 
          marginTop: 16, 
          padding: 12, 
          background: "#fef2f2", 
          border: "1px solid #fecaca", 
          borderRadius: 8, 
          color: "#991b1b",
          fontSize: 14
        }}>
          {err}
        </div>
      )}

      {successMsg && (
        <div style={{ 
          marginTop: 16, 
          padding: 12, 
          background: "#f0fdf4", 
          border: "1px solid #bbf7d0", 
          borderRadius: 8, 
          color: "#166534",
          fontSize: 14
        }}>
          {successMsg}
        </div>
      )}

      <div style={{ marginTop: 20, fontSize: 14, textAlign: "center" }}>
        {mode === "login" ? (
          <>
            <div style={{ marginBottom: 8 }}>
              <button 
                onClick={goReset} 
                style={{ 
                  textDecoration: "underline", 
                  background: "none", 
                  border: "none", 
                  padding: 0, 
                  cursor: "pointer",
                  color: "#ff9900",
                  fontWeight: 600
                }}
              >
                Forgot password?
              </button>
            </div>
            <div>
              New here?{" "}
              <button 
                onClick={goSignup} 
                style={{ 
                  textDecoration: "underline", 
                  background: "none", 
                  border: "none", 
                  padding: 0, 
                  cursor: "pointer" 
                }}
              >
                Create an account
              </button>
            </div>
          </>
        ) : mode === "signup" ? (
          <div>
            Already have an account?{" "}
            <button 
              onClick={goLogin} 
              style={{ 
                textDecoration: "underline", 
                background: "none", 
                border: "none", 
                padding: 0, 
                cursor: "pointer" 
              }}
            >
              Log in
            </button>
          </div>
        ) : (
          <div>
            Remember your password?{" "}
            <button 
              onClick={goLogin} 
              style={{ 
                textDecoration: "underline", 
                background: "none", 
                border: "none", 
                padding: 0, 
                cursor: "pointer" 
              }}
            >
              Back to login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
