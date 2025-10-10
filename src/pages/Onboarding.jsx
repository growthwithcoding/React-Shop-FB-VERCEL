// src/pages/Onboarding.jsx
import { useState, useEffect, useCallback } from "react";
import {
  createAdminUser,
  initializeStoreSettings,
  markOnboardingComplete,
  validateFirebaseCredentials,
} from "../services/onboardingService";
import "./Onboarding.css";

/* --------------------------------- Icons ---------------------------------- */
const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const IconStore = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M3 9l2-5h14l2 5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M4 9h16v10H4z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M9 19v-6h6v6" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const IconDatabase = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <ellipse cx="12" cy="5" rx="9" ry="3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const IconCloud = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

/* ---------------------------- Step Indicator ----------------------------- */
function StepIndicator({ steps, currentStep }) {
  return (
    <div className="step-indicator">
      {steps.map((step, idx) => {
        const isActive = idx === currentStep;
        const isComplete = idx < currentStep;
        const className = isComplete ? "step-item complete" : isActive ? "step-item active" : "step-item inactive";
        
        return (
          <div key={idx} className={className}>
            {isComplete ? <IconCheck /> : step.icon}
            <span>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ----------------------------- Step Components ---------------------------- */
function CredentialCheckStep({ onNext }) {
  const [checking, setChecking] = useState(true);
  const [validation, setValidation] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [configData, setConfigData] = useState({
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
  });

  // Auto-populate fields based on Project ID
  const handleProjectIdChange = (value) => {
    setConfigData({
      ...configData,
      projectId: value,
      authDomain: value ? `${value}.firebaseapp.com` : "",
      storageBucket: value ? `${value}.appspot.com` : "",
    });
  };

  const checkCredentials = useCallback(async () => {
    setChecking(true);
    try {
      const result = await validateFirebaseCredentials();
      setValidation(result);
      
      // Auto-proceed if valid
      if (result.isValid) {
        setTimeout(() => {
          onNext();
        }, 1500);
      } else if (result.errors?.some(e => e.type === "missing_env_vars")) {
        // Show config form if environment variables are missing
        setShowConfigForm(true);
      }
    } catch (error) {
      setValidation({
        isValid: false,
        errors: [{ type: "unknown", message: "Failed to validate credentials", details: error.message }],
        warnings: [],
      });
    } finally {
      setChecking(false);
    }
  }, [onNext]);

  useEffect(() => {
    checkCredentials();
  }, [checkCredentials]);

  const handleRetry = async () => {
    setRetrying(true);
    await checkCredentials();
    setRetrying(false);
  };

  const generateEnvFile = () => {
    return `# Firebase Configuration
VITE_FIREBASE_API_KEY=${configData.apiKey}
VITE_FIREBASE_AUTH_DOMAIN=${configData.authDomain}
VITE_FIREBASE_PROJECT_ID=${configData.projectId}
VITE_FIREBASE_STORAGE_BUCKET=${configData.storageBucket}
VITE_FIREBASE_MESSAGING_SENDER_ID=${configData.messagingSenderId}
VITE_FIREBASE_APP_ID=${configData.appId}
`;
  };

  const handleDownloadEnv = () => {
    const content = generateEnvFile();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '.env';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyEnv = () => {
    const content = generateEnvFile();
    navigator.clipboard.writeText(content).then(() => {
      alert('✓ .env content copied to clipboard!');
    });
  };

  const handleCreateEnvFile = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/create-env', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: configData.apiKey,
          authDomain: configData.authDomain,
          projectId: configData.projectId,
          storageBucket: configData.storageBucket,
          messagingSenderId: configData.messagingSenderId,
          appId: configData.appId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ .env file created successfully!\n\nThe page will reload in 2 seconds to apply the new configuration...');
        
        // Store flag to skip welcome step on reload
        localStorage.setItem('onboarding_env_created', 'true');
        
        // Signal Express server to shut down
        try {
          await fetch('http://localhost:3001/api/shutdown', { method: 'POST' });
        } catch {
          // Server may already be shutting down, ignore error
        }
        
        // Automatically reload the page to pick up new environment variables
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        alert('❌ Failed to create .env file: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('❌ Error creating .env file: ' + error.message + '\n\nMake sure the onboarding server is running (npm run server)');
    }
  };

  const isConfigValid = configData.apiKey && configData.authDomain && configData.projectId && 
    configData.storageBucket && configData.appId;

  return (
    <div className="card" style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ 
            width: 48, 
            height: 48, 
            borderRadius: "50%", 
            background: validation?.isValid ? "#22c55e" : checking ? "var(--primary)" : "#ef4444", 
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <IconCloud />
          </div>
          <div>
            <h2 style={{ margin: 0 }}>Firebase Configuration</h2>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
              Validating Firebase/Firestore credentials
            </p>
          </div>
        </div>
        {!checking && !validation?.isValid && (
          <div style={{ 
            padding: "8px 16px", 
            background: "#fee", 
            border: "1px solid #fcc", 
            borderRadius: 8,
            color: "#c33",
            fontSize: 14,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            ⚠️ Configuration Issues Detected
          </div>
        )}
      </div>

      {checking ? (
        <div style={{ textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <p style={{ color: "var(--text-secondary)" }}>Checking Firebase connection...</p>
        </div>
      ) : validation?.isValid ? (
        <div style={{ textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h3 style={{ marginBottom: 8, color: "#22c55e" }}>Credentials Validated!</h3>
          <p style={{ color: "var(--text-secondary)" }}>
            Firebase and Firestore are properly configured. Proceeding to setup...
          </p>
        </div>
      ) : (
        <>
          {showConfigForm ? (
            <>
              <div className="card" style={{ padding: 16, marginBottom: 16, background: "var(--surface)" }}>
                <h3 style={{ fontSize: 16, marginBottom: 12 }}>🔑 Enter Firebase Credentials</h3>
                <p style={{ fontSize: 13, marginBottom: 12, color: "var(--text-secondary)" }}>
                  Get these from your Firebase Console → Project Settings → General → Your apps
                </p>
                <div style={{ display: "grid", gap: 12 }}>
                  <label className="field">
                    <div className="meta">Project ID * <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-secondary)" }}>(will auto-fill Auth Domain & Storage Bucket)</span></div>
                    <input
                      className="input"
                      type="text"
                      placeholder="your-project-id"
                      value={configData.projectId}
                      onChange={(e) => handleProjectIdChange(e.target.value)}
                    />
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <label className="field">
                      <div className="meta">Auth Domain * <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-secondary)" }}>(auto-filled)</span></div>
                      <input
                        className="input"
                        type="text"
                        placeholder="your-project.firebaseapp.com"
                        value={configData.authDomain}
                        onChange={(e) => setConfigData({ ...configData, authDomain: e.target.value })}
                      />
                    </label>
                    <label className="field">
                      <div className="meta">Storage Bucket * <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-secondary)" }}>(auto-filled)</span></div>
                      <input
                        className="input"
                        type="text"
                        placeholder="your-project.appspot.com"
                        value={configData.storageBucket}
                        onChange={(e) => setConfigData({ ...configData, storageBucket: e.target.value })}
                      />
                    </label>
                  </div>
                  <label className="field">
                    <div className="meta">API Key *</div>
                    <input
                      className="input"
                      type="text"
                      placeholder="AIza..."
                      value={configData.apiKey}
                      onChange={(e) => setConfigData({ ...configData, apiKey: e.target.value })}
                    />
                  </label>
                  <label className="field">
                    <div className="meta">App ID *</div>
                    <input
                      className="input"
                      type="text"
                      placeholder="1:123:web:abc..."
                      value={configData.appId}
                      onChange={(e) => setConfigData({ ...configData, appId: e.target.value })}
                    />
                  </label>
                  <label className="field">
                    <div className="meta">Messaging Sender ID (optional)</div>
                    <input
                      className="input"
                      type="text"
                      placeholder="123456789"
                      value={configData.messagingSenderId}
                      onChange={(e) => setConfigData({ ...configData, messagingSenderId: e.target.value })}
                    />
                  </label>
                </div>
              </div>

              {isConfigValid && (
                <div className="card" style={{ padding: 16, marginBottom: 16, background: "#e7f5ff", border: "1px solid #74c0fc" }}>
                  <h3 style={{ fontSize: 16, marginBottom: 12 }}>📥 Create Your .env File</h3>
                  <p style={{ fontSize: 13, marginBottom: 12, color: "#1864ab" }}>
                    Choose one of these options to create your .env file:
                  </p>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <button 
                      className="btn-onboarding btn-onboarding-primary"
                      onClick={handleCreateEnvFile}
                      title="Automatically create .env file via backend server"
                    >
                      🚀 Create .env File
                    </button>
                    <button 
                      className="btn-onboarding btn-onboarding-secondary"
                      onClick={handleDownloadEnv}
                    >
                      📥 Download .env
                    </button>
                    <button 
                      className="btn-onboarding btn-onboarding-secondary"
                      onClick={handleCopyEnv}
                    >
                      📋 Copy to Clipboard
                    </button>
                  </div>
                  <div style={{ background: "#f5f5f5", padding: 8, borderRadius: 4, fontFamily: "monospace", fontSize: 11 }}>
                    {generateEnvFile()}
                  </div>
                  <p style={{ fontSize: 12, marginTop: 12, marginBottom: 0, color: "#495057" }}>
                    ⚠️ After saving the .env file to your project root, <strong>restart your dev server</strong> then click "Retry Validation"
                  </p>
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button 
                  className="btn-onboarding btn-onboarding-secondary" 
                  onClick={() => setShowConfigForm(false)}
                >
                  Back to Instructions
                </button>
                <button 
                  className="btn-onboarding btn-onboarding-primary" 
                  onClick={handleRetry}
                  disabled={retrying}
                >
                  {retrying ? "Retrying..." : "Retry Validation"}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="card" style={{ padding: 16, marginBottom: 24, background: "var(--surface)" }}>
                <h3 style={{ fontSize: 16, marginBottom: 12 }}>🔧 How to Fix</h3>
                <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14 }}>
                  <li style={{ marginBottom: 8 }}>
                    Get your Firebase credentials from the Firebase Console
                  </li>
                  <li style={{ marginBottom: 8 }}>
                    Click the button below to enter your credentials and generate a .env file
                  </li>
                  <li style={{ marginBottom: 8 }}>
                    Download or copy the generated .env file to your project root
                  </li>
                  <li>
                    Restart your development server and retry validation
                  </li>
                </ol>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button 
                  className="btn-onboarding btn-onboarding-primary" 
                  onClick={() => setShowConfigForm(true)}
                >
                  🔑 Enter Firebase Credentials
                </button>
                <button 
                  className="btn-onboarding btn-onboarding-secondary" 
                  onClick={handleRetry}
                  disabled={retrying}
                >
                  {retrying ? "Retrying..." : "Retry Validation"}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function WelcomeStep({ onNext }) {
  return (
    <div className="card" style={{ padding: 32, maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
      <h2 style={{ marginBottom: 16 }}>Welcome to Your New Store!</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>
        Let's get your e-commerce platform set up in just a few steps. This wizard will help you create your admin
        account, configure your store settings, and optionally seed your database with sample products.
      </p>
      <div className="card" style={{ padding: 16, marginBottom: 24, textAlign: "left", background: "var(--surface)" }}>
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>What we'll set up:</h3>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li style={{ marginBottom: 8 }}>✅ Admin account (your login credentials)</li>
          <li style={{ marginBottom: 8 }}>✅ Store information (name, email, hours)</li>
          <li style={{ marginBottom: 8 }}>✅ Basic payment & shipping settings</li>
          <li>✅ Sample product data (optional)</li>
        </ul>
      </div>
      <button 
        className="btn-onboarding btn-onboarding-primary btn-onboarding-large" 
        onClick={onNext}
      >
        Get Started
      </button>
    </div>
  );
}

function AdminAccountStep({ onNext, onBack, adminData, adminCreated }) {
  const [showForm, setShowForm] = useState(!adminCreated);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      await createAdminUser({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      onNext(formData);
    } catch (err) {
      setError(err.message || "Failed to create admin account");
    } finally {
      setLoading(false);
    }
  };

  // If admin already created and not showing form, show the created admin
  if (adminCreated && !showForm) {
    return (
      <div className="card" style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ 
            width: 48, 
            height: 48, 
            borderRadius: "50%", 
            background: "#22c55e", 
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <IconCheck />
          </div>
          <div>
            <h2 style={{ margin: 0 }}>Admin Account Created</h2>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
              Your admin account is ready
            </p>
          </div>
        </div>

        <div className="card" style={{ padding: 16, marginBottom: 24, background: "var(--surface)" }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Admin Account Details</h3>
          <div style={{ fontSize: 14 }}>
            <div style={{ marginBottom: 8 }}>
              <strong>Name:</strong> {adminData?.firstName} {adminData?.lastName}
            </div>
            <div>
              <strong>Email:</strong> {adminData?.email}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="btn-onboarding btn-onboarding-secondary" 
            onClick={onBack}
          >
            Back
          </button>
          <div style={{ display: "flex", gap: 12 }}>
            <button 
              type="button" 
              className="btn-onboarding btn-onboarding-secondary" 
              onClick={() => setShowForm(true)}
            >
              Create Another Admin
            </button>
            <button 
              type="button" 
              className="btn-onboarding btn-onboarding-primary" 
              onClick={() => onNext(adminData)}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ 
          width: 48, 
          height: 48, 
          borderRadius: "50%", 
          background: "var(--primary)", 
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <IconUser />
        </div>
        <div>
          <h2 style={{ margin: 0 }}>Create Admin Account</h2>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
            This will be your login to manage the store
          </p>
        </div>
      </div>

      {error && (
        <div className="card" style={{ padding: 12, marginBottom: 16, background: "#fee", border: "1px solid #fcc", color: "#c33" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <label className="field">
            <div className="meta">First Name *</div>
            <input
              className="input"
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="John"
            />
          </label>
          <label className="field">
            <div className="meta">Last Name *</div>
            <input
              className="input"
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Doe"
            />
          </label>
        </div>

        <label className="field" style={{ marginBottom: 12 }}>
          <div className="meta">Email Address *</div>
          <input
            className="input"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="admin@example.com"
          />
        </label>

        <label className="field" style={{ marginBottom: 12 }}>
          <div className="meta">Password * (min. 6 characters)</div>
          <input
            className="input"
            type="password"
            required
            minLength={6}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
          />
        </label>

        <label className="field" style={{ marginBottom: 12 }}>
          <div className="meta">Confirm Password *</div>
          <input
            className="input"
            type="password"
            required
            minLength={6}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="••••••••"
          />
        </label>

        <div className="form-actions">
          <button 
            type="button" 
            className="btn-onboarding btn-onboarding-secondary" 
            onClick={onBack}
          >
            Back
          </button>
          <button 
            type="submit" 
            className="btn-onboarding btn-onboarding-primary" 
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Admin Account"}
          </button>
        </div>
      </form>
    </div>
  );
}

function StoreSettingsStep({ adminData, onNext, onBack }) {
  const [formData, setFormData] = useState({
    storeName: "",
    storeEmail: adminData?.email || "",
    storeLogo: "",
    supportPhone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      await initializeStoreSettings({
        storeName: formData.storeName,
        storeEmail: formData.storeEmail,
        storeLogo: formData.storeLogo,
        supportPhone: formData.supportPhone,
      });
      onNext(formData);
    } catch (err) {
      setError(err.message || "Failed to save store settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ 
          width: 48, 
          height: 48, 
          borderRadius: "50%", 
          background: "var(--primary)", 
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <IconStore />
        </div>
        <div>
          <h2 style={{ margin: 0 }}>Store Settings</h2>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
            Configure your store information
          </p>
        </div>
      </div>

      {error && (
        <div className="card" style={{ padding: 12, marginBottom: 16, background: "#fee", border: "1px solid #fcc", color: "#c33" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label className="field" style={{ marginBottom: 12 }}>
          <div className="meta">Store Name *</div>
          <input
            className="input"
            type="text"
            required
            value={formData.storeName}
            onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
            placeholder="My Awesome Store"
          />
        </label>

        <label className="field" style={{ marginBottom: 12 }}>
          <div className="meta">Support Email *</div>
          <input
            className="input"
            type="email"
            required
            value={formData.storeEmail}
            onChange={(e) => setFormData({ ...formData, storeEmail: e.target.value })}
            placeholder="support@example.com"
          />
        </label>

        <label className="field" style={{ marginBottom: 12 }}>
          <div className="meta">Store Logo URL (optional)</div>
          <input
            className="input"
            type="url"
            value={formData.storeLogo}
            onChange={(e) => setFormData({ ...formData, storeLogo: e.target.value })}
            placeholder="https://example.com/logo.png"
          />
        </label>

        <label className="field" style={{ marginBottom: 24 }}>
          <div className="meta">Support Phone (optional)</div>
          <input
            className="input"
            type="tel"
            value={formData.supportPhone}
            onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
            placeholder="(555) 123-4567"
          />
        </label>

        <div className="card" style={{ padding: 12, marginBottom: 16, background: "var(--surface)" }}>
          <div className="meta" style={{ marginBottom: 8, fontSize: 13 }}>
            ℹ️ <strong>Note:</strong> Default settings will be applied for:
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "var(--text-secondary)" }}>
            <li>Payment methods (cards enabled, Stripe pending setup)</li>
            <li>Shipping ($5 base, free at $50+)</li>
            <li>Taxes (7.5% rate, UT origin)</li>
            <li>Store hours (Mon-Fri 9AM-5PM)</li>
          </ul>
          <div className="meta" style={{ marginTop: 8, fontSize: 13 }}>
            You can customize these in Settings after setup.
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="btn-onboarding btn-onboarding-secondary" 
            onClick={onBack}
          >
            Back
          </button>
          <button 
            type="submit" 
            className="btn-onboarding btn-onboarding-primary" 
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

function DatabaseSeedStep({ onNext, onSkip }) {
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSeed = async () => {
    setError("");
    setSeeding(true);
    try {
      // Instructions for manual seeding
      setSuccess(true);
      setTimeout(() => {
        onNext();
      }, 2000);
    } catch (err) {
      setError(err.message || "Seeding instructions displayed");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="card" style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ 
          width: 48, 
          height: 48, 
          borderRadius: "50%", 
          background: "var(--primary)", 
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <IconDatabase />
        </div>
        <div>
          <h2 style={{ margin: 0 }}>Database Seeding</h2>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
            Add sample products to get started
          </p>
        </div>
      </div>

      {!success ? (
        <>
          <div className="card" style={{ padding: 16, marginBottom: 24, background: "var(--surface)" }}>
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>📦 Sample Data Available</h3>
            <p style={{ margin: "0 0 12px", color: "var(--text-secondary)", fontSize: 14 }}>
              The seeding utility includes sample products across multiple categories:
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14 }}>
              <li>Mechanical Keyboards</li>
              <li>Programming Books</li>
              <li>Development Boards</li>
              <li>Software Tools</li>
              <li>And more...</li>
            </ul>
          </div>

          <div className="card" style={{ padding: 16, marginBottom: 24, border: "2px solid var(--primary)" }}>
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>🚀 How to Seed Your Database</h3>
            <p style={{ margin: "0 0 12px", fontSize: 14 }}>
              To populate your database with sample products, run these commands:
            </p>
            <div style={{ background: "#f5f5f5", padding: 12, borderRadius: 4, fontFamily: "monospace", fontSize: 13, marginBottom: 12 }}>
              cd seeding<br/>
              npm install<br/>
              node seed-store.mjs
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
              ⚠️ Make sure you've configured <code>firebase-admin.json</code> first. See <code>seeding/README.md</code> for details.
            </p>
          </div>

          {error && (
            <div className="card" style={{ padding: 12, marginBottom: 16, background: "#fee", border: "1px solid #fcc", color: "#c33" }}>
              {error}
            </div>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              className="btn-onboarding btn-onboarding-secondary" 
              onClick={onSkip}
              disabled={seeding}
            >
              Skip for Now
            </button>
            <button 
              type="button" 
              className="btn-onboarding btn-onboarding-primary" 
              onClick={handleSeed}
              disabled={seeding}
            >
              {seeding ? "Processing..." : "I've Run the Seeder"}
            </button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h3 style={{ marginBottom: 8 }}>Great!</h3>
          <p style={{ color: "var(--text-secondary)" }}>
            Proceeding to final step...
          </p>
        </div>
      )}
    </div>
  );
}

function CompletionStep() {
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    setLoading(true);
    try {
      await markOnboardingComplete();
      // Reload the page to refresh onboarding status check in App.jsx
      window.location.href = "/";
    } catch (err) {
      console.error("Error completing onboarding:", err);
      // Still proceed even if marking complete fails
      window.location.href = "/";
    }
  };

  return (
    <div className="card" style={{ padding: 32, maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎊</div>
      <h2 style={{ marginBottom: 16 }}>Setup Complete!</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>
        Your e-commerce store is now configured and ready to use. You can now log in with your admin credentials
        and start customizing your store.
      </p>

      <div className="card" style={{ padding: 16, marginBottom: 24, background: "var(--surface)", textAlign: "left" }}>
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>✨ What's Next?</h3>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li style={{ marginBottom: 8 }}>Configure payment settings (Stripe keys)</li>
          <li style={{ marginBottom: 8 }}>Add or import your products</li>
          <li style={{ marginBottom: 8 }}>Customize your store branding</li>
          <li style={{ marginBottom: 8 }}>Review and adjust tax/shipping settings</li>
          <li>Set up your domain and go live!</li>
        </ul>
      </div>

      <button 
        className="btn-onboarding btn-onboarding-primary btn-onboarding-large" 
        onClick={handleFinish}
        disabled={loading}
      >
        {loading ? "Finalizing..." : "Go to Dashboard"}
      </button>
    </div>
  );
}

/* ----------------------------- Main Component ----------------------------- */
export default function Onboarding() {
  // Check if we just created .env file and should skip welcome step
  const getInitialStep = () => {
    const envCreated = localStorage.getItem('onboarding_env_created');
    if (envCreated === 'true') {
      localStorage.removeItem('onboarding_env_created');
      return 1; // Skip to Firebase check step
    }
    return 0; // Start at welcome step
  };

  const [currentStep, setCurrentStep] = useState(getInitialStep());
  const [adminData, setAdminData] = useState(null);
  const [adminCreated, setAdminCreated] = useState(false);

  const steps = [
    { label: "Welcome", icon: <span>👋</span> },
    { label: "Firebase", icon: <IconCloud /> },
    { label: "Admin", icon: <IconUser /> },
    { label: "Store", icon: <IconStore /> },
    { label: "Data", icon: <IconDatabase /> },
    { label: "Done", icon: <IconCheck /> },
  ];

  const handleAdminNext = (data) => {
    setAdminData(data);
    setAdminCreated(true);
    setCurrentStep(3);
  };

  const handleStoreNext = () => {
    setCurrentStep(4);
  };

  const handleSeedNext = () => {
    setCurrentStep(5);
  };

  const handleSeedSkip = () => {
    setCurrentStep(5);
  };

  return (
    <div className="onboarding-container">
      <div className="container-xl">
        <div style={{ display: "flex", gap: 48, alignItems: "center" }}>
          <div style={{ flexShrink: 0 }}>
            <img 
              src="/logos/LOGO.png" 
              alt="Store Logo" 
              style={{ height: 400, width: "auto" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <h1 className="onboarding-title" style={{ marginBottom: 8 }}>Store Setup</h1>
              <p className="onboarding-subtitle" style={{ marginBottom: 24 }}>Let's get your store up and running</p>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <StepIndicator steps={steps} currentStep={currentStep} />
              </div>
            </div>
            {currentStep === 0 && <WelcomeStep onNext={() => setCurrentStep(1)} />}
            {currentStep === 1 && <CredentialCheckStep onNext={() => setCurrentStep(2)} />}
            {currentStep === 2 && (
              <AdminAccountStep
                onNext={handleAdminNext}
                onBack={() => setCurrentStep(1)}
                adminData={adminData}
                adminCreated={adminCreated}
              />
            )}
            {currentStep === 3 && (
              <StoreSettingsStep
                adminData={adminData}
                onNext={handleStoreNext}
                onBack={() => setCurrentStep(2)}
              />
            )}
            {currentStep === 4 && (
              <DatabaseSeedStep
                onNext={handleSeedNext}
                onSkip={handleSeedSkip}
              />
            )}
            {currentStep === 5 && <CompletionStep />}
          </div>
        </div>
      </div>
    </div>
  );
}
