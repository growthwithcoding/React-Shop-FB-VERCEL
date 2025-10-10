// src/components/BreadcrumbNav.jsx
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { useTotalHeaderHeight } from "../hooks/useTotalHeaderHeight";

/**
 * BreadcrumbNav Component
 * A reusable breadcrumb navigation bar that sticks below the main navbar
 * 
 * @param {Object} props
 * @param {string} props.currentPage - The name of the current page
 * @param {Object} props.backButton - Back button configuration { label: string, path: string }
 * @param {React.ReactNode} props.centerContent - Optional content to display in the center
 * @param {React.ReactNode} props.rightActions - Optional actions/buttons to display on the right
 */
export default function BreadcrumbNav({ 
  currentPage, 
  backButton, 
  centerContent, 
  rightActions 
}) {
  const navigate = useNavigate();
  const { totalNavbarHeight } = useTotalHeaderHeight();

  return (
    <div 
      data-breadcrumb-nav
      style={{ 
        background: "#EAEDED", 
        borderBottom: "1px solid #D5D9D9", 
        position: "fixed", 
        top: `${totalNavbarHeight}px`,
        left: 0,
        right: 0,
        zIndex: 50
      }}
    >
      <div style={{ 
        maxWidth: 1500, 
        margin: "0 auto", 
        padding: centerContent ? "8px 16px" : "12px 24px",
        display: "flex",
        flexDirection: "column",
        gap: centerContent ? 8 : 0
      }}>
        {/* Top Row: Current Page & Back Button + Right Actions */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: centerContent ? "auto" : "unset"
        }}>
          {/* Left: Current Page & Back Button */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <span style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#0F1111",
              whiteSpace: "nowrap"
            }}>
              {currentPage}
            </span>
            {backButton && (
              <>
                <span style={{ color: "#D5D9D9" }}>|</span>
                <button 
                  onClick={() => navigate(backButton.path)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#007185",
                    fontSize: 14,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: 0,
                    fontWeight: 400,
                    whiteSpace: "nowrap"
                  }}
                >
                  <ArrowLeft style={{ width: 16, height: 16 }} />
                  {backButton.label}
                </button>
              </>
            )}
          </div>

          {/* Right: Optional Actions */}
          {rightActions && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {rightActions}
            </div>
          )}
        </div>

        {/* Bottom Row: Optional Filter/Search Content */}
        {centerContent && (
          <div style={{ width: "100%" }}>
            {centerContent}
          </div>
        )}
      </div>
    </div>
  );
}
