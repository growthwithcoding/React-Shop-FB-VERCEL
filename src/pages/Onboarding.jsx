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

const IconKey = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="8" cy="15" r="4" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M10.85 12.15L19 4M22 2l-3 3m-1-1l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ---------------------------- Step Indicator ----------------------------- */
function StepIndicator({ steps, currentStep, completedSteps, onStepClick }) {
  return (
    <div className="step-indicator">
      {steps.map((step, idx) => {
        const isActive = idx === currentStep;
        const isComplete = completedSteps.includes(idx);
        const isClickable = isComplete || isActive;
        const className = isComplete ? "step-item complete" : isActive ? "step-item active" : "step-item inactive";
        
        return (
          <div 
            key={idx} 
            className={className}
            onClick={() => isClickable && onStepClick(idx)}
            style={{ cursor: isClickable ? 'pointer' : 'default' }}
          >
            {isComplete ? <IconCheck /> : step.icon}
            <span>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ----------------------------- Step Components ---------------------------- */
// Consistent card styling for all steps
const STEP_CARD_STYLE = { 
  padding: 20, 
  maxWidth: 900, 
  minHeight: 400, 
  margin: "0 auto" 
};

function FirebaseInstructionsStep({ onNext, onSkip }) {
  const [showInstructions, setShowInstructions] = useState(null);
  const [currentFirebaseStep, setCurrentFirebaseStep] = useState(0);
  const [checking, setChecking] = useState(true);
  const [validation, setValidation] = useState(null);

  useEffect(() => {
    const checkCredentials = async () => {
      setChecking(true);
      try {
        const result = await validateFirebaseCredentials();
        setValidation(result);
      } catch {
        setValidation({
          isValid: false,
          errors: [{ type: "unknown", message: "Failed to validate credentials" }],
        });
      } finally {
        setChecking(false);
      }
    };
    checkCredentials();
  }, []);

  const handleAlreadySetUp = async () => {
    // Re-verify credentials before proceeding
    setChecking(true);
    try {
      const result = await validateFirebaseCredentials();
      setValidation(result);
      if (result.isValid) {
        // Credentials are valid, proceed to next step
        onSkip();
      }
      // If invalid, stay on this screen and show the red indicator
    } catch {
      setValidation({
        isValid: false,
        errors: [{ type: "unknown", message: "Failed to validate credentials" }],
      });
    } finally {
      setChecking(false);
    }
  };

  if (showInstructions === null) {
    return (
      <div className="card" style={{ ...STEP_CARD_STYLE, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
              <IconCloud />
            </div>
            <div>
              <h2 style={{ margin: 0 }}>Firebase Setup</h2>
              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
                Do you need help setting up Firebase?
              </p>
            </div>
          </div>
          {!checking && validation?.isValid && (
            <div style={{ 
              padding: "8px 16px", 
              background: "#d4edda", 
              border: "1px solid #c3e6cb", 
              borderRadius: 8,
              color: "#155724",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              ✅ .env Configured
            </div>
          )}
          {!checking && !validation?.isValid && (
            <div style={{ 
              padding: "8px 16px", 
              background: "#f8d7da", 
              border: "1px solid #f5c6cb", 
              borderRadius: 8,
              color: "#721c24",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              ❌ .env Missing
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 16, marginBottom: 24, background: "var(--surface)" }}>
          <p style={{ margin: "0 0 16px", fontSize: 14, lineHeight: 1.6 }}>
            This application requires a Firebase project with Authentication and Firestore Database enabled. 
            If you haven't set this up yet, we can walk you through the process step-by-step.
          </p>
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)" }}>
            Choose an option below to continue:
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: "auto", paddingTop: 24, borderTop: "1px solid var(--border)" }}>
          <button
            className="btn-onboarding btn-onboarding-primary"
            style={{ padding: "24px 16px", height: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
            onClick={() => setShowInstructions(true)}
          >
            <div style={{ fontSize: 32 }}>📚</div>
            <div style={{ fontWeight: 600 }}>Show Me How</div>
            <div style={{ fontSize: 12, opacity: 0.9, fontWeight: 400 }}>
              Walk me through the setup
            </div>
          </button>
          <button
            className="btn-onboarding btn-onboarding-secondary"
            style={{ padding: "24px 16px", height: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
            onClick={handleAlreadySetUp}
            disabled={checking}
          >
            <div style={{ fontSize: 32 }}>{checking ? "⏳" : "✅"}</div>
            <div style={{ fontWeight: 600 }}>{checking ? "Verifying..." : "Already Set Up"}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 400 }}>
              {checking ? "Checking credentials..." : "I've already configured Firebase"}
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Step-by-step guide
  return (
    <div className="card" style={STEP_CARD_STYLE}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
            <IconCloud />
          </div>
          <div>
            <h2 style={{ margin: 0 }}>Firebase Setup Guide</h2>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
              Step {currentFirebaseStep + 1} of 3
            </p>
          </div>
        </div>
        {!checking && validation?.isValid && (
          <div style={{ 
            padding: "8px 16px", 
            background: "#d4edda", 
            border: "1px solid #c3e6cb", 
            borderRadius: 8,
            color: "#155724",
            fontSize: 14,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            ✅ .env Configured
          </div>
        )}
        {!checking && !validation?.isValid && (
          <div style={{ 
            padding: "8px 16px", 
            background: "#f8d7da", 
            border: "1px solid #f5c6cb", 
            borderRadius: 8,
            color: "#721c24",
            fontSize: 14,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            ❌ .env Missing
          </div>
        )}
      </div>

      {/* Progress indicator */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[0, 1, 2].map((step) => (
          <div 
            key={step}
            style={{ 
              flex: 1, 
              height: 4, 
              borderRadius: 2, 
              background: step <= currentFirebaseStep ? "var(--primary)" : "#e5e7eb" 
            }}
          />
        ))}
      </div>

      {currentFirebaseStep === 0 && (
        <>
          <div className="card" style={{ padding: 14, marginBottom: 14, background: "#e7f5ff", border: "1px solid #74c0fc" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ fontSize: 16 }}>ℹ️</div>
              <h3 style={{ margin: 0, fontSize: 14, color: "#1864ab" }}>Before You Begin</h3>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#1864ab" }}>
              You'll need a Google account. Takes ~2-3 minutes.
            </p>
          </div>

          <div className="card" style={{ padding: 14, marginBottom: 18, background: "var(--surface)" }}>
            <h3 style={{ fontSize: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                justifyContent: "center", 
                width: 20, 
                height: 20, 
                borderRadius: "50%", 
                background: "var(--primary)", 
                color: "white", 
                fontSize: 11, 
                fontWeight: 600 
              }}>1</span>
              Create a Firebase Project
            </h3>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.6 }}>
              <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)" }}>Firebase Console</a></li>
              <li>Click <strong>"Add Project"</strong></li>
              <li>Enter project name → <strong>"Continue"</strong></li>
              <li>Enable Google Analytics (optional)</li>
              <li>Click <strong>"Create Project"</strong></li>
            </ol>
          </div>
        </>
      )}

      {currentFirebaseStep === 1 && (
        <>
          <div className="card" style={{ padding: 14, marginBottom: 18, background: "var(--surface)" }}>
            <h3 style={{ fontSize: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                justifyContent: "center", 
                width: 20, 
                height: 20, 
                borderRadius: "50%", 
                background: "var(--primary)", 
                color: "white", 
                fontSize: 11, 
                fontWeight: 600 
              }}>2</span>
              Enable Authentication
            </h3>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.6 }}>
              <li>Sidebar: <strong>"Build"</strong> → <strong>"Authentication"</strong> → <strong>"Get started"</strong></li>
              <li>Click <strong>"Sign-in method"</strong> tab</li>
              <li>Enable <strong>"Email/Password"</strong>: Click it → Toggle <strong>"Enable"</strong> → <strong>"Save"</strong></li>
              <li>Enable <strong>"Google"</strong> (optional): Click it → Toggle <strong>"Enable"</strong> → Enter email → <strong>"Save"</strong></li>
            </ol>
          </div>
        </>
      )}

      {currentFirebaseStep === 2 && (
        <>
          <div className="card" style={{ padding: 14, marginBottom: 18, background: "var(--surface)" }}>
            <h3 style={{ fontSize: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                justifyContent: "center", 
                width: 20, 
                height: 20, 
                borderRadius: "50%", 
                background: "var(--primary)", 
                color: "white", 
                fontSize: 11, 
                fontWeight: 600 
              }}>3</span>
              Create Firestore Database
            </h3>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.6 }}>
              <li>Sidebar: <strong>"Build"</strong> → <strong>"Firestore Database"</strong> → <strong>"Create database"</strong></li>
              <li>Mode: <strong>Production</strong> (recommended) or Test → <strong>"Next"</strong></li>
              <li>Location: Choose nearest (e.g., us-central) → <strong>"Enable"</strong></li>
            </ol>
          </div>

        </>
      )}

      <div className="form-actions">
        <button 
          type="button" 
          className="btn-onboarding btn-onboarding-secondary" 
          onClick={() => {
            if (currentFirebaseStep > 0) {
              setCurrentFirebaseStep(currentFirebaseStep - 1);
            } else {
              setShowInstructions(null);
            }
          }}
        >
          Back
        </button>
        {currentFirebaseStep < 2 ? (
          <button 
            type="button" 
            className="btn-onboarding btn-onboarding-primary" 
            onClick={() => setCurrentFirebaseStep(currentFirebaseStep + 1)}
          >
            Continue to Next Step
          </button>
        ) : (
          <button 
            type="button" 
            className="btn-onboarding btn-onboarding-primary" 
            onClick={onNext}
          >
            I've Completed Firebase Setup
          </button>
        )}
      </div>
    </div>
  );
}

function CredentialCheckStep({ onNext, onBack }) {
  const [checking, setChecking] = useState(true);
  const [validation, setValidation] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [currentCredentialStep, setCurrentCredentialStep] = useState(0);
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
    setCurrentCredentialStep(0);
    try {
      const result = await validateFirebaseCredentials();
      setValidation(result);
    } catch (error) {
      setValidation({
        isValid: false,
        errors: [{ type: "unknown", message: "Failed to validate credentials", details: error.message }],
        warnings: [],
      });
    } finally {
      setChecking(false);
    }
  }, []);

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

  // If credentials are valid or still checking, show validation screen
  if (checking || validation?.isValid) {
    return (
      <div className="card" style={STEP_CARD_STYLE}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ 
              width: 48, 
              height: 48, 
              borderRadius: "50%", 
              background: validation?.isValid ? "#22c55e" : "var(--primary)", 
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
        </div>

        {checking ? (
          <div style={{ textAlign: "center", padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <p style={{ color: "var(--text-secondary)" }}>Checking Firebase connection...</p>
          </div>
        ) : (
          <>
            <div style={{ textAlign: "center", padding: 32 }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
              <h3 style={{ marginBottom: 8, color: "#22c55e" }}>Credentials Validated!</h3>
              <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
                Firebase and Firestore are properly configured.
              </p>
              <button 
                className="btn-onboarding btn-onboarding-primary" 
                onClick={onNext}
              >
                Continue to Admin Setup
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Step-by-step credential setup
  return (
    <div className="card" style={STEP_CARD_STYLE}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ 
          width: 48, 
          height: 48, 
          borderRadius: "50%", 
          background: "#ef4444", 
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <IconCloud />
        </div>
        <div>
          <h2 style={{ margin: 0 }}>Configure Firebase Credentials</h2>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
            Step {currentCredentialStep + 1} of 2
          </p>
        </div>
      </div>

      {/* Progress indicator */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[0, 1].map((step) => (
          <div 
            key={step}
            style={{ 
              flex: 1, 
              height: 4, 
              borderRadius: 2, 
              background: step <= currentCredentialStep ? "var(--primary)" : "#e5e7eb" 
            }}
          />
        ))}
      </div>

      {currentCredentialStep === 0 && (
        <>
          <div className="card" style={{ padding: 10, marginBottom: 12, background: "#e7f5ff", border: "1px solid #74c0fc" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#1864ab" }}>
              <div style={{ fontSize: 14, flexShrink: 0 }}>ℹ️</div>
              <div>
                <strong>Firebase Console → Project Settings → General → Your apps</strong>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 16, marginBottom: 16, background: "var(--surface)" }}>
            <h3 style={{ fontSize: 14, marginBottom: 12 }}>🔑 Enter Credentials</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label className="field">
                <div className="meta" style={{ fontSize: 12 }}>Project ID * <span style={{ fontSize: 10, fontWeight: 400, color: "var(--text-secondary)" }}>(auto-fills below)</span></div>
                <input
                  className="input"
                  style={{ padding: "6px 10px", fontSize: 13 }}
                  type="text"
                  placeholder="your-project-id"
                  value={configData.projectId}
                  onChange={(e) => handleProjectIdChange(e.target.value)}
                />
              </label>
              <label className="field">
                <div className="meta" style={{ fontSize: 12 }}>API Key *</div>
                <input
                  className="input"
                  style={{ padding: "6px 10px", fontSize: 13 }}
                  type="text"
                  placeholder="AIza..."
                  value={configData.apiKey}
                  onChange={(e) => setConfigData({ ...configData, apiKey: e.target.value })}
                />
              </label>
              <label className="field">
                <div className="meta" style={{ fontSize: 12 }}>Auth Domain *</div>
                <input
                  className="input"
                  style={{ padding: "6px 10px", fontSize: 13 }}
                  type="text"
                  placeholder="your-project.firebaseapp.com"
                  value={configData.authDomain}
                  onChange={(e) => setConfigData({ ...configData, authDomain: e.target.value })}
                />
              </label>
              <label className="field">
                <div className="meta" style={{ fontSize: 12 }}>Storage Bucket *</div>
                <input
                  className="input"
                  style={{ padding: "6px 10px", fontSize: 13 }}
                  type="text"
                  placeholder="your-project.appspot.com"
                  value={configData.storageBucket}
                  onChange={(e) => setConfigData({ ...configData, storageBucket: e.target.value })}
                />
              </label>
              <label className="field">
                <div className="meta" style={{ fontSize: 12 }}>App ID *</div>
                <input
                  className="input"
                  style={{ padding: "6px 10px", fontSize: 13 }}
                  type="text"
                  placeholder="1:123:web:abc..."
                  value={configData.appId}
                  onChange={(e) => setConfigData({ ...configData, appId: e.target.value })}
                />
              </label>
              <label className="field">
                <div className="meta" style={{ fontSize: 12 }}>Sender ID (optional)</div>
                <input
                  className="input"
                  style={{ padding: "6px 10px", fontSize: 13 }}
                  type="text"
                  placeholder="123456789"
                  value={configData.messagingSenderId}
                  onChange={(e) => setConfigData({ ...configData, messagingSenderId: e.target.value })}
                />
              </label>
            </div>
          </div>
        </>
      )}

      {currentCredentialStep === 1 && (
        <>
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

          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
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

      <div className="form-actions">
        <button 
          type="button" 
          className="btn-onboarding btn-onboarding-secondary" 
          onClick={() => {
            if (currentCredentialStep > 0) {
              setCurrentCredentialStep(currentCredentialStep - 1);
            } else {
              onBack();
            }
          }}
        >
          Back
        </button>
        {currentCredentialStep < 1 ? (
          <button 
            type="button" 
            className="btn-onboarding btn-onboarding-primary" 
            onClick={() => setCurrentCredentialStep(1)}
            disabled={!isConfigValid}
          >
            Continue to Create .env File
          </button>
        ) : null}
      </div>
    </div>
  );
}

function FirebaseAdminStep({ onNext, onBack }) {
  const [checking, setChecking] = useState(true);
  const [adminFileExists, setAdminFileExists] = useState(false);
  const [showInstructions, setShowInstructions] = useState(null);
  const [currentAdminStep, setCurrentAdminStep] = useState(0);
  const [jsonInput, setJsonInput] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Get project_id from environment if available
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || "";

  const checkFirebaseAdmin = async () => {
    setChecking(true);
    try {
      const response = await fetch('http://localhost:3001/api/check-firebase-admin');
      const result = await response.json();
      setAdminFileExists(result.exists);
    } catch (error) {
      console.error('Error checking firebase-admin.json:', error);
      setAdminFileExists(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkFirebaseAdmin();
  }, []);

  const handleCreateAdminFile = async () => {
    setError('');
    setCreating(true);
    try {
      // Parse the JSON input
      const configData = JSON.parse(jsonInput);
      
      // Validate required fields
      if (!configData.project_id || !configData.private_key_id || !configData.private_key || !configData.client_email) {
        throw new Error('Missing required fields in JSON (project_id, private_key_id, private_key, client_email)');
      }

      const response = await fetch('http://localhost:3001/api/create-firebase-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData),
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ firebase-admin.json file created successfully!\n\n🔄 The onboarding server will restart to load the new configuration...\n\nWait 3 seconds, then refresh this page to continue.');
        setAdminFileExists(true);
        setShowInstructions(null);
        setCurrentAdminStep(0);
        setJsonInput('');
      } else {
        setError('Failed to create firebase-admin.json file: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format. Please check your input and try again.');
      } else {
        setError(err.message || 'Error creating firebase-admin.json file. Make sure the onboarding server is running (npm run server)');
      }
    } finally {
      setCreating(false);
    }
  };

  if (checking) {
    return (
      <div className="card" style={STEP_CARD_STYLE}>
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
            <IconKey />
          </div>
          <div>
            <h2 style={{ margin: 0 }}>Firebase Admin SDK</h2>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
              Checking configuration...
            </p>
          </div>
        </div>
        <div style={{ textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <p style={{ color: "var(--text-secondary)" }}>Checking for firebase-admin.json...</p>
        </div>
      </div>
    );
  }


  if (adminFileExists && showInstructions === null) {
    return (
      <div className="card" style={STEP_CARD_STYLE}>
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
            <h2 style={{ margin: 0 }}>Firebase Admin SDK Configured</h2>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
              Service account credentials found
            </p>
          </div>
        </div>

        <div className="card" style={{ padding: 16, marginBottom: 24, background: "var(--surface)" }}>
          <p style={{ margin: "0 0 16px", fontSize: 14, lineHeight: 1.6 }}>
            Your firebase-admin.json file is already configured. This file contains your service account credentials needed for database seeding and admin operations.
          </p>
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)" }}>
            You can continue to the next step or reconfigure if needed.
          </p>
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
              onClick={() => setShowInstructions(true)}
            >
              Reconfigure
            </button>
            <button 
              type="button" 
              className="btn-onboarding btn-onboarding-primary" 
              onClick={onNext}
            >
              Continue to Admin Setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show choice screen: "Show Me How" or "Already Set Up"
  if (showInstructions === null) {
    const handleAlreadySetUp = async () => {
      // Re-verify file before proceeding
      await checkFirebaseAdmin();
      // The state will update and show the success screen if file exists
    };

    return (
      <div className="card" style={{ ...STEP_CARD_STYLE, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
              <IconKey />
            </div>
            <div>
              <h2 style={{ margin: 0 }}>Firebase Admin SDK Setup</h2>
              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
                Do you need help setting up the Admin SDK?
              </p>
            </div>
          </div>
          {!checking && adminFileExists && (
            <div style={{ 
              padding: "8px 16px", 
              background: "#d4edda", 
              border: "1px solid #c3e6cb", 
              borderRadius: 8,
              color: "#155724",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              ✅ Admin SDK Configured
            </div>
          )}
          {!checking && !adminFileExists && (
            <div style={{ 
              padding: "8px 16px", 
              background: "#f8d7da", 
              border: "1px solid #f5c6cb", 
              borderRadius: 8,
              color: "#721c24",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              ❌ Admin SDK Missing
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 16, marginBottom: 24, background: "var(--surface)" }}>
          <p style={{ margin: "0 0 16px", fontSize: 14, lineHeight: 1.6 }}>
            The Firebase Admin SDK allows your application to perform administrative operations like seeding the database with products and managing users. You'll need to download a service account key (JSON file) from Firebase.
          </p>
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)" }}>
            Choose an option below to continue:
          </p>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <button
            className="btn-onboarding btn-onboarding-primary"
            style={{ padding: "24px 16px", height: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
            onClick={() => setShowInstructions(true)}
          >
            <div style={{ fontSize: 32 }}>📚</div>
            <div style={{ fontWeight: 600 }}>Show Me How</div>
            <div style={{ fontSize: 12, opacity: 0.9, fontWeight: 400 }}>
              Walk me through the setup
            </div>
          </button>
          <button
            className="btn-onboarding btn-onboarding-secondary"
            style={{ padding: "24px 16px", height: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
            onClick={handleAlreadySetUp}
            disabled={checking}
          >
            <div style={{ fontSize: 32 }}>{checking ? "⏳" : "✅"}</div>
            <div style={{ fontWeight: 600 }}>{checking ? "Verifying..." : "Already Set Up"}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 400 }}>
              {checking ? "Checking configuration..." : "I've already configured this"}
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Step-by-step guide
  return (
    <div className="card" style={STEP_CARD_STYLE}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
            <IconKey />
          </div>
          <div>
            <h2 style={{ margin: 0 }}>Firebase Admin SDK Setup</h2>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
              Step {currentAdminStep + 1} of 2
            </p>
          </div>
        </div>
        {!checking && adminFileExists && (
          <div style={{ 
            padding: "8px 16px", 
            background: "#d4edda", 
            border: "1px solid #c3e6cb", 
            borderRadius: 8,
            color: "#155724",
            fontSize: 14,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            ✅ Admin SDK Configured
          </div>
        )}
        {!checking && !adminFileExists && (
          <div style={{ 
            padding: "8px 16px", 
            background: "#f8d7da", 
            border: "1px solid #f5c6cb", 
            borderRadius: 8,
            color: "#721c24",
            fontSize: 14,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            ❌ Admin SDK Missing
          </div>
        )}
      </div>

      {/* Progress indicator */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[0, 1].map((step) => (
          <div 
            key={step}
            style={{ 
              flex: 1, 
              height: 4, 
              borderRadius: 2, 
              background: step <= currentAdminStep ? "var(--primary)" : "#e5e7eb" 
            }}
          />
        ))}
      </div>

      {currentAdminStep === 0 && (
        <>
          {/* 2-column layout for instructions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            {/* Left column: What is this? */}
            <div className="card" style={{ padding: 16, background: "#e7f5ff", border: "1px solid #74c0fc" }}>
              <div style={{ display: "flex", alignItems: "start", gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 20 }}>ℹ️</div>
                <div>
                  <h3 style={{ margin: "0 0 8px", fontSize: 14, color: "#1864ab" }}>What is this?</h3>
                  <p style={{ margin: 0, fontSize: 12, color: "#1864ab", lineHeight: 1.6 }}>
                    The Firebase Admin SDK allows your application to perform administrative operations like creating users in Firestore and seeding the database. You'll need to generate a service account key from your Firebase project.
                  </p>
                </div>
              </div>
            </div>

            {/* Right column: How to Get Credentials */}
            <div className="card" style={{ padding: 16, background: "var(--surface)" }}>
              <h3 style={{ fontSize: 14, marginBottom: 8, color: "var(--primary)" }}>How to Get Service Account Credentials</h3>
              <ol style={{ margin: 0, paddingLeft: 20, fontSize: 12, lineHeight: 1.6 }}>
                <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", textDecoration: "underline" }}>Firebase Console</a></li>
                <li>Select your project{projectId && <> (<strong>{projectId}</strong>)</>}</li>
                <li>Click ⚙️ gear icon → <strong>Project settings</strong></li>
                <li>Go to <strong>"Service accounts"</strong> tab</li>
                <li>Click <strong>"Generate new private key"</strong></li>
                <li>Click <strong>"Generate key"</strong> to download JSON</li>
              </ol>
            </div>
          </div>
        </>
      )}

      {currentAdminStep === 1 && (
        <>
          <div className="card" style={{ padding: 20, marginBottom: 16, background: "#e7f5ff", border: "1px solid #74c0fc" }}>
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>📋 Paste Your JSON Content</h3>
            <p style={{ fontSize: 13, marginBottom: 12, color: "#1864ab" }}>
              Open the downloaded JSON file and paste its entire contents into the textbox below:
            </p>
            
            <textarea
              className="input"
              style={{ 
                padding: "12px", 
                fontSize: 11, 
                fontFamily: "monospace", 
                minHeight: "120px", 
                resize: "vertical", 
                lineHeight: 1.4,
                width: "100%"
              }}
              placeholder={`{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  ...
}`}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
            />
            
            {error && (
              <div style={{ marginTop: 12, padding: 10, background: "#fee", border: "1px solid #fcc", borderRadius: 4 }}>
                <p style={{ margin: 0, fontSize: 12, color: "#c33" }}>
                  <strong>Error:</strong> {error}
                </p>
              </div>
            )}

            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button 
                className="btn-onboarding btn-onboarding-primary"
                onClick={handleCreateAdminFile}
                disabled={!jsonInput.trim() || creating}
                title="Save firebase-admin.json to your project root"
              >
                {creating ? "Creating..." : "💾 Save firebase-admin.json"}
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: 16, marginBottom: 24, background: "#fff3cd", border: "1px solid #ffc107" }}>
            <div style={{ fontSize: 12, color: "#856404" }}>
              <strong>⚠️ Important:</strong> After creating the file, you can use it to seed your database with sample data. See the Database Seeding step later in this wizard.
            </div>
          </div>
        </>
      )}

      <div className="form-actions">
        <button 
          type="button" 
          className="btn-onboarding btn-onboarding-secondary" 
          onClick={() => {
            if (currentAdminStep > 0) {
              setCurrentAdminStep(currentAdminStep - 1);
            } else {
              setShowInstructions(null);
            }
          }}
        >
          Back
        </button>
        {currentAdminStep < 1 ? (
          <button 
            type="button" 
            className="btn-onboarding btn-onboarding-primary" 
            onClick={() => setCurrentAdminStep(1)}
          >
            Continue to Paste JSON
          </button>
        ) : (
          <button 
            type="button" 
            className="btn-onboarding btn-onboarding-secondary" 
            onClick={onNext}
          >
            Skip for Now
          </button>
        )}
      </div>
    </div>
  );
}

function DeployRulesStep({ onNext, onSkip }) {
  const [showInstructions, setShowInstructions] = useState(null);
  const [checking, setChecking] = useState(true);
  const [deploymentStatus, setDeploymentStatus] = useState(null);
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkDeploymentStatus = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/check-rules-deployment');
        const result = await response.json();
        setDeploymentStatus(result);
      } catch (err) {
        console.error('Error checking deployment status:', err);
        setDeploymentStatus({ canDeploy: false, error: err.message });
      } finally {
        setChecking(false);
      }
    };

    checkDeploymentStatus();
  }, []);

  const handleAutoDeploy = async () => {
    setError("");
    setDeploying(true);
    try {
      const response = await fetch('http://localhost:3001/api/deploy-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setDeployResult(result);
        setTimeout(() => {
          onNext();
        }, 2000);
      } else {
        setError(result.error || 'Failed to deploy rules');
      }
    } catch (err) {
      setError('Error deploying rules: ' + err.message + '\n\nMake sure the onboarding server is running (npm run server)');
    } finally {
      setDeploying(false);
    }
  };

  if (checking) {
    return (
      <div className="card" style={STEP_CARD_STYLE}>
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
            <IconShield />
          </div>
          <div>
            <h2 style={{ margin: 0 }}>Deploy Firestore Rules</h2>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
              Checking deployment status...
            </p>
          </div>
        </div>
        <div style={{ textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <p style={{ color: "var(--text-secondary)" }}>Verifying prerequisites...</p>
        </div>
      </div>
    );
  }

  if (deployResult) {
    return (
      <div className="card" style={STEP_CARD_STYLE}>
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
            <h2 style={{ margin: 0 }}>Rules Deployed Successfully!</h2>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
              Your Firestore security rules are now active
            </p>
          </div>
        </div>

        <div className="card" style={{ padding: 16, marginBottom: 24, background: "#d4edda", border: "1px solid #c3e6cb" }}>
          <div style={{ fontSize: 14, color: "#155724" }}>
            <div style={{ marginBottom: 8 }}>
              <strong>✅ Deployment Complete</strong>
            </div>
            <div style={{ fontSize: 13, marginBottom: 4 }}>
              Project: <strong>{deployResult.projectId}</strong>
            </div>
            <div style={{ fontSize: 13, marginBottom: 4 }}>
              Ruleset: <code style={{ fontSize: 11 }}>{deployResult.rulesetName}</code>
            </div>
            <div style={{ fontSize: 13 }}>
              Deployed at: {new Date(deployResult.createTime).toLocaleString()}
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", padding: 16 }}>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Proceeding to next step...
          </p>
        </div>
      </div>
    );
  }

  if (showInstructions === null) {
    return (
      <div className="card" style={{ ...STEP_CARD_STYLE, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
              <IconShield />
            </div>
            <div>
              <h2 style={{ margin: 0 }}>Deploy Firestore Rules</h2>
              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
                Do you need help deploying security rules?
              </p>
            </div>
          </div>
          {!checking && deploymentStatus?.rulesDeployed && (
            <div style={{ 
              padding: "8px 16px", 
              background: "#d4edda", 
              border: "1px solid #c3e6cb", 
              borderRadius: 8,
              color: "#155724",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              ✅ Rules Deployed
            </div>
          )}
          {!checking && !deploymentStatus?.rulesDeployed && (
            <div style={{ 
              padding: "8px 16px", 
              background: "#f8d7da", 
              border: "1px solid #f5c6cb", 
              borderRadius: 8,
              color: "#721c24",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              ❌ Rules Not Deployed
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 16, marginBottom: 24, background: "var(--surface)" }}>
          <p style={{ margin: "0 0 16px", fontSize: 14, lineHeight: 1.6 }}>
            After creating your Firestore database, you need to deploy security rules to allow the admin account creation and protect your data. The rules file (firestore.rules) is already in your project root.
          </p>
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)" }}>
            Choose an option below to continue:
          </p>
        </div>

        <div style={{ flex: 1 }} />

        {deploymentStatus?.canDeploy && (
          <div className="card" style={{ padding: 16, marginBottom: 16, background: "#d4edda", border: "1px solid #c3e6cb" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 20 }}>✅</div>
              <h3 style={{ margin: 0, fontSize: 16, color: "#155724" }}>Ready for Automatic Deployment</h3>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "#155724" }}>
              Your Firebase Admin SDK is configured. Click below to automatically deploy your security rules.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button 
                className="btn-onboarding btn-onboarding-primary"
                onClick={handleAutoDeploy}
                disabled={deploying}
                style={{ flex: 1 }}
              >
                {deploying ? "🚀 Deploying..." : "🚀 Deploy Rules Automatically"}
              </button>
            </div>
          </div>
        )}

        {!deploymentStatus?.canDeploy && (
          <div className="card" style={{ padding: 16, marginBottom: 16, background: "#fff3cd", border: "1px solid #ffc107" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 20 }}>⚠️</div>
              <h3 style={{ margin: 0, fontSize: 16, color: "#856404" }}>Automatic Deployment Not Available</h3>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#856404" }}>
              {!deploymentStatus?.adminExists && "Firebase Admin SDK not configured. "}
              {!deploymentStatus?.rulesExists && "Rules file not found. "}
              You'll need to deploy manually using one of the methods below.
            </p>
          </div>
        )}

        {error && (
          <div className="card" style={{ padding: 12, marginBottom: 16, background: "#f8d7da", border: "1px solid #f5c6cb" }}>
            <p style={{ margin: 0, fontSize: 13, color: "#721c24" }}>
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <button
            className="btn-onboarding btn-onboarding-secondary"
            style={{ padding: "24px 16px", height: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
            onClick={() => setShowInstructions(true)}
          >
            <div style={{ fontSize: 32 }}>📚</div>
            <div style={{ fontWeight: 600 }}>Manual Deployment</div>
            <div style={{ fontSize: 12, opacity: 0.9, fontWeight: 400 }}>
              Show me how to deploy manually
            </div>
          </button>
          <button
            className="btn-onboarding btn-onboarding-secondary"
            style={{ padding: "24px 16px", height: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
            onClick={onSkip}
          >
            <div style={{ fontSize: 32 }}>✅</div>
            <div style={{ fontWeight: 600 }}>Already Deployed</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 400 }}>
              I've already deployed the rules
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Instructions view
  return (
    <div className="card" style={STEP_CARD_STYLE}>
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
          <IconShield />
        </div>
        <div>
          <h2 style={{ margin: 0 }}>Deploy Firestore Security Rules</h2>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
            Choose your deployment method
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {/* CLI Method */}
        <div className="card" style={{ padding: 16, background: "#e7f5ff", border: "1px solid #74c0fc" }}>
          <h3 style={{ fontSize: 16, marginBottom: 12, color: "#1864ab" }}>🚀 Via Firebase CLI (Recommended)</h3>
          <p style={{ fontSize: 13, marginBottom: 12, color: "#1864ab" }}>
            If you have Firebase CLI installed:
          </p>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <div style={{ background: "#f5f5f5", padding: 10, borderRadius: 4, fontFamily: "monospace", fontSize: 12 }}>
              firebase deploy --only firestore:rules
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText('firebase deploy --only firestore:rules');
                alert('✓ Command copied to clipboard!');
              }}
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                padding: "4px 8px",
                fontSize: 10,
                background: "var(--primary)",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontWeight: 600
              }}
              title="Copy to clipboard"
            >
              📋 Copy
            </button>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "#495057" }}>
            This will deploy the firestore.rules file from your project root.
          </p>
        </div>

        {/* Console Method */}
        <div className="card" style={{ padding: 16, background: "var(--surface)" }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>🌐 Via Firebase Console</h3>
          <p style={{ fontSize: 13, marginBottom: 12, color: "var(--text-secondary)" }}>
            Manual deployment through the web interface:
          </p>
          <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.8 }}>
            <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)" }}>Firebase Console</a></li>
            <li>Select your project</li>
            <li>Click <strong>Firestore Database</strong></li>
            <li>Click the <strong>Rules</strong> tab</li>
            <li>Copy content from your <code>firestore.rules</code> file</li>
            <li>Paste into the editor</li>
            <li>Click <strong>Publish</strong></li>
          </ol>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 24, background: "#fff3cd", border: "1px solid #ffc107" }}>
        <div style={{ fontSize: 13, color: "#856404" }}>
          <strong>⚠️ Important:</strong> The security rules in firestore.rules allow authenticated users to create their profiles and admins to manage all data. This is essential for the admin account creation step.
        </div>
      </div>

      <div className="form-actions">
        <button 
          type="button" 
          className="btn-onboarding btn-onboarding-secondary" 
          onClick={() => setShowInstructions(null)}
        >
          Back
        </button>
        <button 
          type="button" 
          className="btn-onboarding btn-onboarding-primary" 
          onClick={onNext}
        >
          I've Deployed the Rules
        </button>
      </div>
    </div>
  );
}

function WelcomeStep({ onNext }) {
  return (
    <div className="card" style={{ ...STEP_CARD_STYLE, textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
      <h2 style={{ marginBottom: 16 }}>Welcome to Your New Store!</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>
        Let's get your e-commerce platform set up in just a few steps. This wizard will help you create your admin
        account, configure your store settings, and optionally seed your database with sample products.
      </p>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <div className="card" style={{ padding: 16, textAlign: "left", background: "var(--surface)", display: "inline-block", maxWidth: "fit-content" }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>What we'll set up:</h3>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}>✅ Admin account (your login credentials)</li>
            <li style={{ marginBottom: 8 }}>✅ Store information (name, email, hours)</li>
            <li style={{ marginBottom: 8 }}>✅ Basic payment & shipping settings</li>
            <li>✅ Sample product data (optional)</li>
          </ul>
        </div>
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

function AdminAccountStep({ onNext, onBack, adminData }) {
  const [checking, setChecking] = useState(true);
  const [existingAdmins, setExistingAdmins] = useState([]);
  const [showChoice, setShowChoice] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdAdmin, setCreatedAdmin] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  // Initialize selected admin when admins are loaded
  useEffect(() => {
    if (existingAdmins.length > 0 && !selectedAdmin) {
      setSelectedAdmin(createdAdmin?.uid || adminData?.uid || existingAdmins[0]?.id);
    }
  }, [existingAdmins, createdAdmin, adminData, selectedAdmin]);

  // Fetch existing admins
  const fetchAdmins = async () => {
    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      
      const adminsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'admin')
      );
      const snapshot = await getDocs(adminsQuery);
      const admins = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExistingAdmins(admins);
    } catch (err) {
      console.error('Error fetching admins:', err);
      setExistingAdmins([]);
    }
  };

  // Check for admins on mount
  useEffect(() => {
    const checkForAdmin = async () => {
      await fetchAdmins();
      setChecking(false);
    };

    checkForAdmin();
  }, []);

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
      const newAdmin = await createAdminUser({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      
      // Set the created admin data
      setCreatedAdmin({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        uid: newAdmin.uid,
        isNew: true
      });
      
      // Refresh the admin list to include the new admin
      await fetchAdmins();
      
      // Hide form and show the admin cards
      setShowForm(false);
      setShowChoice(false);
      
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(err.message || "Failed to create admin account");
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking
  if (checking) {
    return (
      <div className="card" style={STEP_CARD_STYLE}>
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
            <h2 style={{ margin: 0 }}>Admin Account Setup</h2>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
              Checking database...
            </p>
          </div>
        </div>
        <div style={{ textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <p style={{ color: "var(--text-secondary)" }}>Checking for existing admin accounts...</p>
        </div>
      </div>
    );
  }

  // Show choice screen
  if (showChoice && !showForm) {
    return (
      <div className="card" style={STEP_CARD_STYLE}>
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
            <h2 style={{ margin: 0 }}>Admin Account Setup</h2>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
              {existingAdmins.length > 0 ? `${existingAdmins.length} admin(s) found in database` : "No admin account found"}
            </p>
          </div>
        </div>

        {/* Show existing admins if any */}
        {existingAdmins.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, marginBottom: 8, fontWeight: 600 }}>Select an admin account to proceed:</h3>
            <p style={{ fontSize: 13, marginBottom: 12, color: "var(--text-secondary)" }}>
              Click on an admin card to select it
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12 }}>
              {existingAdmins.map((admin) => (
                <div 
                  key={admin.id}
                  className="card"
                  onClick={() => setSelectedAdmin(admin.id)}
                  style={{ 
                    padding: 16,
                    background: selectedAdmin === admin.id ? "#f0f9ff" : "var(--surface)",
                    border: selectedAdmin === admin.id 
                      ? "2px solid var(--primary)" 
                      : createdAdmin?.uid === admin.id 
                        ? "2px solid #22c55e" 
                        : "1px solid #e5e7eb",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "start", gap: 12 }}>
                    <div style={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: "50%", 
                      background: selectedAdmin === admin.id 
                        ? "var(--primary)"
                        : createdAdmin?.uid === admin.id 
                          ? "#22c55e" 
                          : "#9ca3af", 
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      {selectedAdmin === admin.id ? <IconCheck /> : <IconUser />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {admin.firstName} {admin.lastName}
                        </h4>
                        {createdAdmin?.uid === admin.id && (
                          <span style={{ 
                            fontSize: 10, 
                            padding: "2px 6px", 
                            background: "#22c55e", 
                            color: "white", 
                            borderRadius: 4,
                            fontWeight: 600,
                            flexShrink: 0
                          }}>
                            NEW
                          </span>
                        )}
                        {selectedAdmin === admin.id && (
                          <span style={{ 
                            fontSize: 10, 
                            padding: "2px 6px", 
                            background: "var(--primary)", 
                            color: "white", 
                            borderRadius: 4,
                            fontWeight: 600,
                            flexShrink: 0
                          }}>
                            SELECTED
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {admin.email}
                      </p>
                      {admin.createdAt && (
                        <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--text-secondary)" }}>
                          Created: {new Date(admin.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {existingAdmins.length === 0 && (
          <div className="card" style={{ padding: 16, marginBottom: 24, background: "var(--surface)" }}>
            <p style={{ margin: "0 0 16px", fontSize: 14, lineHeight: 1.6 }}>
              No admin account was found in your database. You'll need to create one to manage your store.
            </p>
            <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)" }}>
              Choose an option below to continue:
            </p>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <button
            className="btn-onboarding btn-onboarding-primary"
            style={{ padding: "24px 16px", height: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
            onClick={() => {
              setShowChoice(false);
              setShowForm(true);
            }}
          >
            <div style={{ fontSize: 32 }}>➕</div>
            <div style={{ fontWeight: 600 }}>{existingAdmins.length > 0 ? "Create Another Admin" : "Create Admin"}</div>
            <div style={{ fontSize: 12, opacity: 0.9, fontWeight: 400 }}>
              {existingAdmins.length > 0 ? "Add a new admin account" : "Set up your admin account"}
            </div>
          </button>
          <button
            className="btn-onboarding btn-onboarding-secondary"
            style={{ padding: "24px 16px", height: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
            onClick={() => {
              if (existingAdmins.length > 0) {
                const selected = existingAdmins.find(a => a.id === selectedAdmin);
                onNext(selected || existingAdmins[0]);
              } else {
                onBack();
              }
            }}
            disabled={existingAdmins.length === 0 || !selectedAdmin}
          >
            <div style={{ fontSize: 32 }}>{existingAdmins.length > 0 ? "✅" : "⚠️"}</div>
            <div style={{ fontWeight: 600 }}>{existingAdmins.length > 0 ? "Continue with Selected" : "Go Back"}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 400 }}>
              {existingAdmins.length > 0 ? "Proceed to store settings" : "Need to set up Firebase first"}
            </div>
          </button>
        </div>
      </div>
    );
  }

  // If we've created an admin and not showing the form, show the results with cards
  if (!showChoice && !showForm && (createdAdmin || existingAdmins.length > 0)) {
    return (
      <div className="card" style={STEP_CARD_STYLE}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ 
            width: 48, 
            height: 48, 
            borderRadius: "50%", 
            background: createdAdmin ? "#22c55e" : "var(--primary)", 
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {createdAdmin ? <IconCheck /> : <IconUser />}
          </div>
          <div>
            <h2 style={{ margin: 0 }}>{createdAdmin ? "Admin Account Created" : "Admin Accounts"}</h2>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
              {existingAdmins.length} admin account{existingAdmins.length > 1 ? 's' : ''} in database
            </p>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, marginBottom: 8, fontWeight: 600 }}>
            {createdAdmin ? "Select the admin account to complete onboarding:" : "Select an admin account to proceed:"}
          </h3>
          <p style={{ fontSize: 13, marginBottom: 12, color: "var(--text-secondary)" }}>
            Click on an admin card to select it, then click Continue
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12 }}>
            {existingAdmins.map((admin) => (
              <div 
                key={admin.id}
                className="card"
                onClick={() => setSelectedAdmin(admin.id)}
                style={{ 
                  padding: 16,
                  background: selectedAdmin === admin.id ? "#f0f9ff" : "var(--surface)",
                  border: selectedAdmin === admin.id 
                    ? "2px solid var(--primary)" 
                    : createdAdmin?.uid === admin.id 
                      ? "2px solid #22c55e" 
                      : "1px solid #e5e7eb",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ display: "flex", alignItems: "start", gap: 12 }}>
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: "50%", 
                    background: selectedAdmin === admin.id 
                      ? "var(--primary)"
                      : createdAdmin?.uid === admin.id 
                        ? "#22c55e" 
                        : "#9ca3af", 
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    {selectedAdmin === admin.id ? <IconCheck /> : <IconUser />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {admin.firstName} {admin.lastName}
                      </h4>
                      {createdAdmin?.uid === admin.id && (
                        <span style={{ 
                          fontSize: 10, 
                          padding: "2px 6px", 
                          background: "#22c55e", 
                          color: "white", 
                          borderRadius: 4,
                          fontWeight: 600,
                          flexShrink: 0
                        }}>
                          NEW
                        </span>
                      )}
                      {selectedAdmin === admin.id && (
                        <span style={{ 
                          fontSize: 10, 
                          padding: "2px 6px", 
                          background: "var(--primary)", 
                          color: "white", 
                          borderRadius: 4,
                          fontWeight: 600,
                          flexShrink: 0
                        }}>
                          SELECTED
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {admin.email}
                    </p>
                    {admin.createdAt && (
                      <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--text-secondary)" }}>
                        Created: {new Date(admin.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
              onClick={() => {
                const selected = existingAdmins.find(a => a.id === selectedAdmin);
                onNext(selected || existingAdmins[0]);
              }}
              disabled={!selectedAdmin}
            >
              Continue with Selected Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show the form
  return (
    <div className="card" style={STEP_CARD_STYLE}>
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

function StoreSettingsStep({ adminData, storeData, onNext, onBack }) {
  const [currentSettingsStep, setCurrentSettingsStep] = useState(0);
  const [formData, setFormData] = useState(storeData || {
    storeName: "",
    storeEmail: adminData?.email || "",
    storeLogo: "/logos/LOGO_TRANS.png",
    supportPhone: "",
    supportHours: {
      monday: { isOpen: true, open: "09:00", close: "17:00" },
      tuesday: { isOpen: true, open: "09:00", close: "17:00" },
      wednesday: { isOpen: true, open: "09:00", close: "17:00" },
      thursday: { isOpen: true, open: "09:00", close: "17:00" },
      friday: { isOpen: true, open: "09:00", close: "17:00" },
      saturday: { isOpen: false, open: "10:00", close: "14:00" },
      sunday: { isOpen: false, open: "10:00", close: "14:00" },
    },
    payments: {
      enableCards: false,
      cod: false,
      pk: "",
      acceptedMethods: [],
    },
    shipping: {
      base: 5,
      enableFreeShipping: false,
      freeAt: 50,
    },
    taxes: {
      rate: 7.5,
      origin: "UT",
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    try {
      setLoading(true);
      await initializeStoreSettings({
        storeName: formData.storeName,
        storeEmail: formData.storeEmail,
        storeLogo: formData.storeLogo,
        supportPhone: formData.supportPhone,
        supportHours: formData.supportHours,
        payments: formData.payments,
        shipping: formData.shipping,
        taxes: formData.taxes,
      });
      onNext(formData);
    } catch (err) {
      setError(err.message || "Failed to save store settings");
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    if (currentSettingsStep === 0) {
      return formData.storeName && formData.storeEmail;
    }
    return true; // Other steps have defaults or are optional
  };

  const handleNextStep = () => {
    if (currentSettingsStep < 3) {
      setCurrentSettingsStep(currentSettingsStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevStep = () => {
    if (currentSettingsStep > 0) {
      setCurrentSettingsStep(currentSettingsStep - 1);
    } else {
      onBack();
    }
  };

  return (
    <div className="card" style={STEP_CARD_STYLE}>
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
            Step {currentSettingsStep + 1} of 4
          </p>
        </div>
      </div>

      {/* Progress indicator - clickable tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { step: 0, label: "Store Info" },
          { step: 1, label: "Hours" },
          { step: 2, label: "Payments" },
          { step: 3, label: "Shipping & Tax" }
        ].map(({ step, label }) => (
          <button
            key={step}
            type="button"
            onClick={() => setCurrentSettingsStep(step)}
            style={{ 
              flex: 1,
              padding: "8px 12px",
              fontSize: 13,
              fontWeight: step === currentSettingsStep ? 600 : 400,
              borderRadius: 6,
              border: step === currentSettingsStep ? "2px solid var(--primary)" : "1px solid #e5e7eb",
              background: step === currentSettingsStep ? "var(--primary)" : "white",
              color: step === currentSettingsStep ? "white" : "#6b7280",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="card" style={{ padding: 12, marginBottom: 16, background: "#fee", border: "1px solid #fcc", color: "#c33" }}>
          {error}
        </div>
      )}

      {/* Step 0: Store Information */}
      {currentSettingsStep === 0 && (
        <>
          <div className="card" style={{ padding: 20, marginBottom: 24, background: "var(--surface)" }}>
            <h3 style={{ fontSize: 16, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                justifyContent: "center", 
                width: 24, 
                height: 24, 
                borderRadius: "50%", 
                background: "var(--primary)", 
                color: "white", 
                fontSize: 12, 
                fontWeight: 600 
              }}>1</span>
              Store Information
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label className="field">
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

            <label className="field">
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

            <label className="field">
              <div className="meta">Store Logo URL (optional)</div>
              <input
                className="input"
                type="url"
                value={formData.storeLogo}
                onChange={(e) => setFormData({ ...formData, storeLogo: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </label>

            <label className="field">
              <div className="meta">Support Phone (optional)</div>
              <input
                className="input"
                type="tel"
                value={formData.supportPhone}
                onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </label>
          </div>
        </div>
        </>
      )}

      {/* Step 1: Support Hours */}
      {currentSettingsStep === 1 && (
        <>
          <div className="card" style={{ padding: 20, marginBottom: 24, background: "var(--surface)" }}>
            <h3 style={{ fontSize: 16, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                justifyContent: "center", 
                width: 24, 
                height: 24, 
                borderRadius: "50%", 
                background: "var(--primary)", 
                color: "white", 
                fontSize: 12, 
                fontWeight: 600 
              }}>2</span>
              Support Hours
            </h3>
            <div style={{ display: "grid", gap: 8 }}>
            {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
              <div key={day} style={{ display: "grid", gridTemplateColumns: "90px 60px 1fr 1fr", gap: 6, alignItems: "center", fontSize: 13 }}>
                <div style={{ fontWeight: 600, textTransform: "capitalize" }}>{day}</div>
                <label className="checkbox" style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={formData.supportHours?.[day]?.isOpen ?? true}
                    onChange={(e) => setFormData({
                      ...formData,
                      supportHours: {
                        ...formData.supportHours,
                        [day]: { ...formData.supportHours[day], isOpen: e.target.checked }
                      }
                    })}
                  />
                  <span className="meta" style={{ fontSize: 11 }}>Open</span>
                </label>
                <input
                  type="time"
                  className="input"
                  style={{ fontSize: 12, padding: "6px 8px" }}
                  value={formData.supportHours?.[day]?.open ?? "09:00"}
                  disabled={!formData.supportHours?.[day]?.isOpen}
                  onChange={(e) => setFormData({
                    ...formData,
                    supportHours: {
                      ...formData.supportHours,
                      [day]: { ...formData.supportHours[day], open: e.target.value }
                    }
                  })}
                />
                <input
                  type="time"
                  className="input"
                  style={{ fontSize: 12, padding: "6px 8px" }}
                  value={formData.supportHours?.[day]?.close ?? "17:00"}
                  disabled={!formData.supportHours?.[day]?.isOpen}
                  onChange={(e) => setFormData({
                    ...formData,
                    supportHours: {
                      ...formData.supportHours,
                      [day]: { ...formData.supportHours[day], close: e.target.value }
                    }
                  })}
                />
              </div>
            ))}
          </div>
        </div>

        </>
      )}

      {/* Step 2: Payment Settings */}
      {currentSettingsStep === 2 && (
        <>
          <div className="card" style={{ padding: 20, marginBottom: 24, background: "var(--surface)" }}>
            <h3 style={{ fontSize: 16, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                justifyContent: "center", 
                width: 24, 
                height: 24, 
                borderRadius: "50%", 
                background: "var(--primary)", 
                color: "white", 
                fontSize: 12, 
                fontWeight: 600 
              }}>3</span>
              Payment Settings
            </h3>
            
            <div style={{ marginBottom: 16 }}>
              <label className="checkbox" style={{ display: "block", marginBottom: 8 }}>
                <input 
                  type="checkbox" 
                  checked={formData.payments.enableCards}
                  onChange={(e) => setFormData({
                    ...formData,
                    payments: { ...formData.payments, enableCards: e.target.checked }
                  })}
                /> Enable Checks
              </label>
              <label className="checkbox" style={{ display: "block" }}>
                <input 
                  type="checkbox" 
                  checked={formData.payments.cod}
                  onChange={(e) => setFormData({
                    ...formData,
                    payments: { ...formData.payments, cod: e.target.checked }
                  })}
                /> Enable Cash on Delivery
              </label>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div className="meta" style={{ marginBottom: 8, fontWeight: 700 }}>Accepted Payment Methods</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <label className="checkbox">
                  <input 
                    type="checkbox" 
                    checked={formData.payments.acceptedMethods?.includes("card")}
                    onChange={(e) => {
                      const methods = formData.payments.acceptedMethods || [];
                      setFormData({
                        ...formData,
                        payments: {
                          ...formData.payments,
                          acceptedMethods: e.target.checked 
                            ? [...methods, "card"]
                            : methods.filter(m => m !== "card")
                        }
                      });
                    }}
                  /> 💳 Credit/Debit Cards
                </label>
                <label className="checkbox" style={{ opacity: 0.5 }}>
                  <input 
                    type="checkbox" 
                    disabled
                    checked={false}
                  /> 🔵 PayPal <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>(Future Implementation)</span>
                </label>
                <label className="checkbox" style={{ opacity: 0.5 }}>
                  <input 
                    type="checkbox" 
                    disabled
                    checked={false}
                  /> 🍎 Apple Pay <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>(Future Implementation)</span>
                </label>
                <label className="checkbox" style={{ opacity: 0.5 }}>
                  <input 
                    type="checkbox" 
                    disabled
                    checked={false}
                  /> 🤖 Google Pay <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>(Future Implementation)</span>
                </label>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Step 3: Shipping & Tax Settings */}
      {currentSettingsStep === 3 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div className="card" style={{ padding: 20, background: "var(--surface)" }}>
              <h3 style={{ fontSize: 16, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ 
                  display: "inline-flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  width: 24, 
                  height: 24, 
                  borderRadius: "50%", 
                  background: "var(--primary)", 
                  color: "white", 
                  fontSize: 12, 
                  fontWeight: 600 
                }}>4</span>
                Shipping Settings
              </h3>
              <label className="field" style={{ marginBottom: 12 }}>
                <div className="meta">Base Shipping Rate ($)</div>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.shipping.base}
                  onChange={(e) => setFormData({
                    ...formData,
                    shipping: { ...formData.shipping, base: Number(e.target.value) }
                  })}
                />
              </label>
              
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, alignItems: "end" }}>
                <label className="checkbox" style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 8 }}>
                  <input 
                    type="checkbox" 
                    checked={formData.shipping.enableFreeShipping}
                    onChange={(e) => setFormData({
                      ...formData,
                      shipping: { ...formData.shipping, enableFreeShipping: e.target.checked }
                    })}
                  />
                  <span>Enable Free Shipping</span>
                </label>
                
                <label className="field">
                  <div className="meta">Free Shipping Threshold ($)</div>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.shipping.freeAt}
                    disabled={!formData.shipping.enableFreeShipping}
                    onChange={(e) => setFormData({
                      ...formData,
                      shipping: { ...formData.shipping, freeAt: Number(e.target.value) }
                    })}
                  />
                </label>
              </div>
            </div>

            <div className="card" style={{ padding: 20, background: "var(--surface)" }}>
              <h3 style={{ fontSize: 16, marginBottom: 12 }}>💰 Tax Settings</h3>
              <label className="field" style={{ marginBottom: 12 }}>
                <div className="meta">Default Tax Rate (%)</div>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.taxes.rate}
                  onChange={(e) => setFormData({
                    ...formData,
                    taxes: { ...formData.taxes, rate: Number(e.target.value) }
                  })}
                />
              </label>
              <label className="field">
                <div className="meta">Origin State</div>
                <input
                  className="input"
                  type="text"
                  value={formData.taxes.origin}
                  onChange={(e) => setFormData({
                    ...formData,
                    taxes: { ...formData.taxes, origin: e.target.value }
                  })}
                  placeholder="UT"
                />
              </label>
            </div>
          </div>
        </>
      )}

      <div className="form-actions">
        <button 
          type="button" 
          className="btn-onboarding btn-onboarding-secondary" 
          onClick={handlePrevStep}
        >
          Back
        </button>
        <button 
          type="button" 
          className="btn-onboarding btn-onboarding-primary" 
          onClick={handleNextStep}
          disabled={loading || !isStepValid()}
        >
          {currentSettingsStep === 3 
            ? (loading ? "Saving..." : "Save All Settings")
            : "Continue"
          }
        </button>
      </div>
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
    <div className="card" style={STEP_CARD_STYLE}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
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
          <h2 style={{ margin: 0, fontSize: 20 }}>Database Seeding</h2>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 13 }}>
            Add sample products to get started
          </p>
        </div>
      </div>

      {!success ? (
        <>
          <div className="card" style={{ padding: 12, marginBottom: 16, background: "var(--surface)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr 1fr", gap: "8px 12px", alignItems: "end" }}>
              <div>
                <h3 style={{ fontSize: 14, marginBottom: 6, whiteSpace: "nowrap" }}>📦 Sample Data Available</h3>
                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 11, whiteSpace: "nowrap" }}>
                  Populates 8 collections<br/>with 130 documents:
                </p>
              </div>
              <div style={{ fontSize: 11, lineHeight: 1.6 }}>
                <div><strong>Users</strong> - 13</div>
                <div><strong>Products</strong> - 27</div>
              </div>
              <div style={{ fontSize: 11, lineHeight: 1.6 }}>
                <div><strong>Orders</strong> - 30</div>
                <div><strong>Discounts</strong> - 15</div>
              </div>
              <div style={{ fontSize: 11, lineHeight: 1.6 }}>
                <div><strong>Tickets</strong> - 15</div>
                <div><strong>Settings</strong></div>
              </div>
              <div style={{ fontSize: 11, lineHeight: 1.6 }}>
                <div><strong>System</strong> - Platform</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 12, marginBottom: 16, border: "2px solid var(--primary)" }}>
            <h3 style={{ fontSize: 14, marginBottom: 10 }}>🚀 How to Seed Your Database</h3>
            <p style={{ margin: "0 0 8px", fontSize: 12 }}>
              To populate your database with sample products, run these commands:
            </p>
            <div style={{ position: "relative" }}>
              <div style={{ background: "#f5f5f5", padding: 10, borderRadius: 4, fontFamily: "monospace", fontSize: 11, marginBottom: 8 }}>
                cd seeding<br/>
                npm install<br/>
                node seed-store.mjs
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText('cd seeding\nnpm install\nnode seed-store.mjs');
                }}
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  padding: "4px 8px",
                  fontSize: 10,
                  background: "var(--primary)",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontWeight: 600
                }}
                title="Copy to clipboard"
              >
                📋 Copy
              </button>
            </div>
            <p style={{ margin: 0, fontSize: 11, color: "var(--text-secondary)" }}>
              ⚠️ Make sure you've configured <code>firebase-admin.json</code> first. See <code>seeding/README.md</code> for details.
            </p>
          </div>

          {error && (
            <div className="card" style={{ padding: 10, marginBottom: 12, background: "#fee", border: "1px solid #fcc", color: "#c33", fontSize: 12 }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button 
              type="button" 
              className="btn-onboarding btn-onboarding-primary" 
              onClick={handleSeed}
              disabled={seeding}
            >
              {seeding ? "Processing..." : "I've Run the Seeder"}
            </button>
            <button 
              type="button" 
              className="btn-onboarding btn-onboarding-secondary" 
              onClick={onSkip}
              disabled={seeding}
            >
              Skip for Now
            </button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h3 style={{ marginBottom: 6, fontSize: 18 }}>Great!</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
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
      
      // Shut down the Express onboarding server
      try {
        await fetch('http://localhost:3001/api/shutdown', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log('✅ Express onboarding server shutdown initiated');
      } catch {
        // Server might already be down or not running, that's okay
        console.log('ℹ️ Express server shutdown call completed or server not running');
      }
      
      // Reload the page to refresh onboarding status check in App.jsx
      window.location.href = "/";
    } catch (err) {
      console.error("Error completing onboarding:", err);
      // Still proceed even if marking complete fails
      window.location.href = "/";
    }
  };

  return (
    <div className="card" style={{ ...STEP_CARD_STYLE, textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎊</div>
      <h2 style={{ marginBottom: 16 }}>Setup Complete!</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6, maxWidth: 450, margin: "0 auto 24px" }}>
        Your e-commerce store is now configured and ready to use. You can now log in with your admin credentials
        and start customizing your store.
      </p>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <div className="card" style={{ padding: 16, background: "var(--surface)", textAlign: "left", display: "inline-block", maxWidth: "fit-content" }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>✨ What's Next?</h3>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}>Configure payment settings (Stripe keys)</li>
            <li style={{ marginBottom: 8 }}>Add or import your products</li>
            <li style={{ marginBottom: 8 }}>Customize your store branding</li>
            <li style={{ marginBottom: 8 }}>Review and adjust tax/shipping settings</li>
            <li>Set up your domain and go live!</li>
          </ul>
        </div>
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
  // Check if we just created .env file and should skip to Firebase setup
  const getInitialStep = () => {
    const envCreated = localStorage.getItem('onboarding_env_created');
    if (envCreated === 'true') {
      localStorage.removeItem('onboarding_env_created');
      return 1; // Skip to Firebase setup step
    }
    return 0; // Start at welcome step
  };

  const [currentStep, setCurrentStep] = useState(getInitialStep());
  const [completedSteps, setCompletedSteps] = useState([]);
  const [adminData, setAdminData] = useState(null);
  const [adminCreated, setAdminCreated] = useState(false);
  const [storeData, setStoreData] = useState(null);
  const [firebaseCompleted, setFirebaseCompleted] = useState(false);

  // Mark step as completed
  const markStepComplete = (step) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step]);
    }
  };

  const steps = [
    { label: "Welcome", icon: <span>👋</span> },
    { label: "Firebase Setup", icon: <IconCloud /> },
    { label: "Credentials", icon: <IconKey /> },
    { label: "Admin SDK", icon: <IconKey /> },
    { label: "Deploy Rules", icon: <IconShield /> },
    { label: "+ Admin", icon: <IconUser /> },
    { label: "Store", icon: <IconStore /> },
    { label: "Data", icon: <IconDatabase /> },
    { label: "Done", icon: <IconCheck /> },
  ];

  const handleAdminNext = (data) => {
    setAdminData(data);
    setAdminCreated(true);
    setCurrentStep(6);  // Go to Store Settings (step 6)
  };

  const handleStoreNext = () => {
    setCurrentStep(7);  // Go to Database Seeding (step 7)
  };

  const handleSeedNext = () => {
    setCurrentStep(8);  // Go to Completion (step 8)
  };

  const handleSeedSkip = () => {
    setCurrentStep(8);  // Go to Completion (step 8)
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
                <StepIndicator steps={steps} currentStep={currentStep} completedSteps={completedSteps} onStepClick={setCurrentStep} />
              </div>
            </div>
            {currentStep === 0 && <WelcomeStep onNext={() => { markStepComplete(0); setCurrentStep(1); }} />}
            {currentStep === 1 && (
              <FirebaseInstructionsStep 
                onNext={() => {
                  setFirebaseCompleted(true);
                  markStepComplete(1);
                  setCurrentStep(2);
                }} 
                onSkip={() => {
                  setFirebaseCompleted(true);
                  markStepComplete(1);
                  setCurrentStep(2);
                }}
                completed={firebaseCompleted}
              />
            )}
            {currentStep === 2 && (
              <CredentialCheckStep 
                onNext={() => {
                  markStepComplete(2);
                  setCurrentStep(3);
                }} 
                onBack={() => setCurrentStep(1)}
              />
            )}
            {currentStep === 3 && (
              <FirebaseAdminStep
                onNext={() => {
                  markStepComplete(3);
                  setCurrentStep(4);
                }}
                onBack={() => setCurrentStep(2)}
              />
            )}
            {currentStep === 4 && (
              <DeployRulesStep 
                onNext={() => {
                  markStepComplete(4);
                  setCurrentStep(5);
                }} 
                onSkip={() => {
                  markStepComplete(4);
                  setCurrentStep(5);
                }}
              />
            )}
            {currentStep === 5 && (
              <AdminAccountStep
                onNext={(data) => {
                  markStepComplete(5);
                  handleAdminNext(data);
                }}
                onBack={() => setCurrentStep(4)}
                adminData={adminData}
                adminCreated={adminCreated}
              />
            )}
            {currentStep === 6 && (
              <StoreSettingsStep
                adminData={adminData}
                storeData={storeData}
                onNext={(data) => {
                  setStoreData(data);
                  markStepComplete(5);
                  handleStoreNext();
                }}
                onBack={() => setCurrentStep(4)}
              />
            )}
            {currentStep === 7 && (
              <DatabaseSeedStep
                onNext={() => {
                  markStepComplete(7);
                  handleSeedNext();
                }}
                onSkip={() => {
                  markStepComplete(7);
                  handleSeedSkip();
                }}
              />
            )}
            {currentStep === 8 && <CompletionStep />}
          </div>
        </div>
      </div>
    </div>
  );
}
