"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "Welcome", icon: "door_open", step: 1, href: "/onboarding/step-1" },
  { label: "Store Connect", icon: "hub", step: 2, href: "/onboarding/step-2" },
  { label: "Data Sync", icon: "sync", step: 3, href: "/onboarding/step-3" },
  { label: "Summary", icon: "check_circle", step: 4, href: "/onboarding/step-4" },
];

const syncItems = [
  { label: "API Connection Established", status: "done" },
  { label: "Importing Products", status: "done" },
  { label: "Processing Orders", status: "progress" },
];

export default function OnboardingStep3() {
  const router = useRouter();
  const [shippingRate, setShippingRate] = useState("");
  const [cogsPercent, setCogsPercent] = useState("");

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "16rem",
          backgroundColor: "#131316",
          borderRight: "1px solid rgba(63,63,70,0.5)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "1.5rem 0.75rem",
          flexShrink: 0,
        }}
      >
        <div>
          {/* Logo Area */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0 0.5rem", marginBottom: "2rem" }}>
            <div
              style={{
                width: "2.5rem",
                height: "2.5rem",
                backgroundColor: "#25252b",
                borderRadius: "0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "1.25rem", color: "#c6c6c7" }}>
                bar_chart_4_bars
              </span>
            </div>
            <div>
              <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e7e4ec" }}>Onboarding</div>
              <div style={{ fontSize: "0.75rem", color: "#75757c" }}>Setup Progress</div>
            </div>
          </div>

          {/* Nav Items */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {navItems.map((item) => {
              const isActive = item.step === 3;
              const isCompleted = item.step < 3;
              return (
                <div
                  key={item.step}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.625rem 0.75rem",
                    borderRadius: "0.5rem",
                    backgroundColor: isActive ? "rgba(63,63,70,0.5)" : "transparent",
                    transform: isActive ? "translateX(4px)" : "none",
                    color: isActive ? "#e7e4ec" : isCompleted ? "#82ff99" : "#71717a",
                    fontSize: "0.875rem",
                    fontWeight: isActive ? 500 : 400,
                    cursor: "default",
                    transition: "all 0.2s ease",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "1.25rem", color: isActive ? "#c6c6c7" : isCompleted ? "#82ff99" : "#71717a" }}
                  >
                    {isCompleted ? "check_circle" : item.icon}
                  </span>
                  {item.label}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom with progress bar */}
        <div style={{ padding: "0 0.5rem" }}>
          {/* Progress Bar */}
          <div style={{ marginBottom: "1rem", padding: "0 0.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
              <span style={{ fontSize: "0.6875rem", color: "#71717a" }}>Progress</span>
              <span style={{ fontSize: "0.6875rem", color: "#acaab1" }}>75%</span>
            </div>
            <div style={{ width: "100%", height: "0.25rem", backgroundColor: "#25252b", borderRadius: "9999px" }}>
              <div
                style={{
                  width: "75%",
                  height: "100%",
                  background: "linear-gradient(90deg, #82ff99, #73f08c)",
                  borderRadius: "9999px",
                  transition: "width 0.5s ease",
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem",
              borderRadius: "0.75rem",
              backgroundColor: "rgba(37,37,43,0.4)",
            }}
          >
            <div
              style={{
                width: "2rem",
                height: "2rem",
                borderRadius: "9999px",
                backgroundColor: "#25252b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "1rem", color: "#71717a" }}>
                person
              </span>
            </div>
            <div>
              <div style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#e7e4ec" }}>New Merchant</div>
              <div style={{ fontSize: "0.6875rem", color: "#71717a" }}>Step 3 of 4</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          backgroundColor: "#0e0e10",
          padding: "3rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2rem",
            maxWidth: "64rem",
            width: "100%",
          }}
        >
          {/* Left: Sync Status Card */}
          <div
            style={{
              backgroundColor: "#131316",
              borderRadius: "0.75rem",
              padding: "2.5rem",
              border: "1px solid rgba(63,63,70,0.3)",
            }}
          >
            {/* Circular Progress Ring */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "2rem",
              }}
            >
              <div style={{ position: "relative", width: "12rem", height: "12rem" }}>
                <svg width="192" height="192" viewBox="0 0 192 192" style={{ transform: "rotate(-90deg)" }}>
                  {/* Background circle */}
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    fill="none"
                    stroke="#25252b"
                    strokeWidth="8"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    fill="none"
                    stroke="#82ff99"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="552.92"
                    strokeDashoffset="138.23"
                    style={{ transition: "stroke-dashoffset 1s ease" }}
                  />
                </svg>
                {/* Center Text */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "#e7e4ec", letterSpacing: "-0.02em" }}>75%</span>
                  <span style={{ fontSize: "0.8125rem", color: "#71717a", fontWeight: 500 }}>Syncing</span>
                </div>
              </div>
            </div>

            {/* Sync Progress List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {syncItems.map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    backgroundColor: "rgba(37,37,43,0.4)",
                    borderRadius: "0.75rem",
                  }}
                >
                  {item.status === "done" ? (
                    <span className="material-symbols-outlined" style={{ fontSize: "1.25rem", color: "#82ff99" }}>
                      check_circle
                    </span>
                  ) : (
                    <div
                      style={{
                        width: "0.625rem",
                        height: "0.625rem",
                        borderRadius: "9999px",
                        backgroundColor: "#c6c6c7",
                        animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                        marginLeft: "0.3125rem",
                        marginRight: "0.3125rem",
                      }}
                    />
                  )}
                  <span style={{ fontSize: "0.875rem", color: "#e7e4ec", fontWeight: 500, flex: 1 }}>{item.label}</span>
                  {item.status === "progress" && (
                    <span style={{ fontSize: "0.75rem", color: "#c6c6c7", fontWeight: 500 }}>In Progress</span>
                  )}
                </div>
              ))}
            </div>

            {/* Pulse animation keyframes */}
            <style>{`
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.4; }
              }
            `}</style>
          </div>

          {/* Right: Quick Cost Setup Card */}
          <div
            style={{
              backgroundColor: "#1f1f24",
              borderRadius: "0.75rem",
              padding: "2.5rem",
              border: "1px solid rgba(63,63,70,0.3)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h2
              style={{
                fontSize: "1.875rem",
                fontWeight: 900,
                color: "#e7e4ec",
                letterSpacing: "-0.02em",
                marginBottom: "0.5rem",
              }}
            >
              Quick Cost Setup
            </h2>
            <p style={{ fontSize: "0.875rem", color: "#acaab1", marginBottom: "2rem", lineHeight: 1.5 }}>
              Set default costs to get started. You can customize these later per product.
            </p>

            {/* Flat-rate Shipping Input */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", fontWeight: 500, color: "#acaab1", marginBottom: "0.5rem" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "1.125rem", color: "#71717a" }}>
                  local_shipping
                </span>
                Flat-rate Shipping Cost
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "0.9375rem",
                    color: "#71717a",
                    fontWeight: 500,
                  }}
                >
                  $
                </span>
                <input
                  type="text"
                  value={shippingRate}
                  onChange={(e) => setShippingRate(e.target.value)}
                  placeholder="5.99"
                  style={{
                    width: "100%",
                    padding: "0.875rem 1rem 0.875rem 2rem",
                    backgroundColor: "#25252b",
                    border: "none",
                    borderRadius: "0.75rem",
                    color: "#e7e4ec",
                    fontSize: "0.9375rem",
                    outline: "none",
                    fontFamily: "'Inter', sans-serif",
                  }}
                />
              </div>
            </div>

            {/* Global COGS % Input */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", fontWeight: 500, color: "#acaab1", marginBottom: "0.5rem" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "1.125rem", color: "#71717a" }}>
                  inventory_2
                </span>
                Global COGS %
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={cogsPercent}
                  onChange={(e) => setCogsPercent(e.target.value)}
                  placeholder="30"
                  style={{
                    width: "100%",
                    padding: "0.875rem 2.5rem 0.875rem 1rem",
                    backgroundColor: "#25252b",
                    border: "none",
                    borderRadius: "0.75rem",
                    color: "#e7e4ec",
                    fontSize: "0.9375rem",
                    outline: "none",
                    fontFamily: "'Inter', sans-serif",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "0.9375rem",
                    color: "#71717a",
                    fontWeight: 500,
                  }}
                >
                  %
                </span>
              </div>
            </div>

            {/* Info Box */}
            <div
              style={{
                padding: "1rem",
                backgroundColor: "rgba(211,255,211,0.05)",
                border: "1px solid rgba(211,255,211,0.1)",
                borderRadius: "0.75rem",
                marginBottom: "1.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "1.125rem", color: "#82ff99", flexShrink: 0, marginTop: "0.125rem" }}>
                  info
                </span>
                <p style={{ fontSize: "0.8125rem", color: "#acaab1", lineHeight: 1.5 }}>
                  These defaults apply to all products. You can override costs per-product in the Products section after onboarding.
                </p>
              </div>
            </div>

            {/* Save & Continue Button */}
            <button
              onClick={() => router.push("/onboarding/step-4")}
              style={{
                width: "100%",
                padding: "0.875rem",
                background: "linear-gradient(135deg, #c6c6c7 0%, #454747 100%)",
                border: "none",
                borderRadius: "9999px",
                color: "#0e0e10",
                fontSize: "0.9375rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                transition: "opacity 0.2s ease",
                marginBottom: "1.5rem",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Save &amp; Continue
            </button>

            {/* Help Card */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.875rem 1rem",
                backgroundColor: "rgba(37,37,43,0.4)",
                borderRadius: "0.75rem",
                marginTop: "auto",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "1.25rem", color: "#71717a" }}>
                help
              </span>
              <div>
                <div style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#e7e4ec" }}>Need help?</div>
                <div style={{ fontSize: "0.75rem", color: "#71717a" }}>Check our documentation for guidance.</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
