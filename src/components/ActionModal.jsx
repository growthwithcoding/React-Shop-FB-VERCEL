// ActionModal.jsx - Reusable modal for confirmations, alerts, and prompts
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { useEffect } from "react";

export default function ActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "confirm", // "confirm", "alert", "prompt"
  variant = "default", // "default", "danger", "success", "warning", "info"
  confirmText = "Confirm",
  cancelText = "Cancel",
  showInput = false,
  inputValue = "",
  onInputChange,
  inputPlaceholder = "",
}) {
  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const variantConfig = {
    default: {
      icon: <Info style={{ width: 24, height: 24, color: "#007185" }} />,
      iconBg: "#E6F2F5",
      confirmBg: "#FF9900",
      confirmBorder: "#E88B00",
      confirmColor: "#fff",
    },
    danger: {
      icon: <AlertCircle style={{ width: 24, height: 24, color: "#c7511f" }} />,
      iconBg: "#FCE9E6",
      confirmBg: "#c7511f",
      confirmBorder: "#a83f1a",
      confirmColor: "#fff",
    },
    success: {
      icon: <CheckCircle style={{ width: 24, height: 24, color: "#067D62" }} />,
      iconBg: "#E8F5F2",
      confirmBg: "#067D62",
      confirmBorder: "#055d4a",
      confirmColor: "#fff",
    },
    warning: {
      icon: <AlertTriangle style={{ width: 24, height: 24, color: "#F08804" }} />,
      iconBg: "#FEF5E7",
      confirmBg: "#F08804",
      confirmBorder: "#d17503",
      confirmColor: "#fff",
    },
    info: {
      icon: <Info style={{ width: 24, height: 24, color: "#007185" }} />,
      iconBg: "#E6F2F5",
      confirmBg: "#007185",
      confirmBorder: "#005a6b",
      confirmColor: "#fff",
    },
  };

  const config = variantConfig[variant] || variantConfig.default;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    if (type === "alert") {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          maxWidth: 480,
          width: "100%",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
          animation: "modalFadeIn 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid #E7E7E7",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: config.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {config.icon}
            </div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "#0F1111",
                margin: 0,
              }}
            >
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#565959",
              borderRadius: 4,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F7F8F8")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px" }}>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: "#0F1111",
              margin: 0,
              marginBottom: showInput ? 16 : 0,
            }}
          >
            {message}
          </p>

          {/* Input for prompt type */}
          {showInput && (
            <input
              type="text"
              value={inputValue}
              onChange={(e) => onInputChange && onInputChange(e.target.value)}
              placeholder={inputPlaceholder}
              autoFocus
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #888C8C",
                borderRadius: 8,
                fontSize: 14,
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && inputValue.trim()) {
                  handleConfirm();
                }
              }}
            />
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: "16px 24px",
            borderTop: "1px solid #E7E7E7",
            justifyContent: "flex-end",
          }}
        >
          {type !== "alert" && (
            <button
              onClick={onClose}
              style={{
                padding: "10px 24px",
                fontSize: 14,
                fontWeight: 500,
                background: "#fff",
                border: "1px solid #D5D9D9",
                borderRadius: 8,
                color: "#0F1111",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#F7F8F8";
                e.currentTarget.style.borderColor = "#888C8C";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.borderColor = "#D5D9D9";
              }}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            disabled={showInput && !inputValue.trim()}
            style={{
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 500,
              background: config.confirmBg,
              border: `1px solid ${config.confirmBorder}`,
              borderRadius: 8,
              color: config.confirmColor,
              cursor: showInput && !inputValue.trim() ? "not-allowed" : "pointer",
              opacity: showInput && !inputValue.trim() ? 0.6 : 1,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!(showInput && !inputValue.trim())) {
                e.currentTarget.style.opacity = "0.9";
              }
            }}
            onMouseLeave={(e) => {
              if (!(showInput && !inputValue.trim())) {
                e.currentTarget.style.opacity = "1";
              }
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
