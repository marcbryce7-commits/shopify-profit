"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "Welcome", icon: "door_open", step: 1, href: "/onboarding/step-1" },
  { label: "Store Connect", icon: "hub", step: 2, href: "/onboarding/step-2" },
  { label: "Data Sync", icon: "sync", step: 3, href: "/onboarding/step-3" },
  { label: "Summary", icon: "check_circle", step: 4, href: "/onboarding/step-4" },
];

export default function OnboardingStep1() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [currency, setCurrency] = useState("USD");

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
              const isActive = item.step === 1;
              return (
                <div
                  key={item.step}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.625rem 0.75rem",
                    borderRadius: isActive ? "0.5rem" : "0.5rem",
                    backgroundColor: isActive ? "rgba(63,63,70,0.5)" : "transparent",
                    transform: isActive ? "translateX(4px)" : "none",
                    color: isActive ? "#e7e4ec" : "#71717a",
                    fontSize: "0.875rem",
                    fontWeight: isActive ? 500 : 400,
                    cursor: "default",
                    transition: "all 0.2s ease",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "1.25rem", color: isActive ? "#c6c6c7" : "#71717a" }}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Area */}
        <div style={{ padding: "0 0.5rem" }}>
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
              <div style={{ fontSize: "0.6875rem", color: "#71717a" }}>Step 1 of 4</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          backgroundColor: "#0e0e10",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "3rem",
        }}
      >
        {/* Decorative Blurs */}
        <div
          style={{
            position: "absolute",
            top: "-10rem",
            right: "-10rem",
            width: "30rem",
            height: "30rem",
            borderRadius: "9999px",
            background: "rgba(198,198,199,0.05)",
            filter: "blur(100px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-10rem",
            left: "-10rem",
            width: "30rem",
            height: "30rem",
            borderRadius: "9999px",
            background: "rgba(211,255,211,0.05)",
            filter: "blur(100px)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 10, maxWidth: "64rem", width: "100%", margin: "0 auto" }}>
          {/* Phase Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.375rem 1rem",
              borderRadius: "9999px",
              backgroundColor: "#1f1f24",
              color: "#c6c6c7",
              fontSize: "0.75rem",
              fontWeight: 500,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              marginBottom: "1.5rem",
            }}
          >
            Phase 01 — Identity
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: "3.75rem",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              color: "#e7e4ec",
              marginBottom: "0.75rem",
            }}
          >
            Welcome to{" "}
            <span style={{ color: "#71717a" }}>ProfitPilot</span>
          </h1>

          {/* Subtitle */}
          <p style={{ fontSize: "1.125rem", color: "#acaab1", marginBottom: "3rem", maxWidth: "32rem" }}>
            Let&apos;s personalize your dashboard for your business.
          </p>

          {/* Grid: 8/4 split */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem", alignItems: "start" }}>
            {/* Left: Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Business Name */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "#acaab1", marginBottom: "0.5rem" }}>
                  Business Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Acme Commerce"
                  style={{
                    width: "100%",
                    padding: "0.875rem 1rem",
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

              {/* Currency */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "#acaab1", marginBottom: "0.5rem" }}>
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.875rem 1rem",
                    backgroundColor: "#25252b",
                    border: "none",
                    borderRadius: "0.75rem",
                    color: "#e7e4ec",
                    fontSize: "0.9375rem",
                    outline: "none",
                    fontFamily: "'Inter', sans-serif",
                    appearance: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — British Pound</option>
                  <option value="CAD">CAD — Canadian Dollar</option>
                  <option value="AUD">AUD — Australian Dollar</option>
                </select>
              </div>

              {/* Continue Button */}
              <button
                onClick={() => router.push("/onboarding/step-2")}
                style={{
                  marginTop: "0.5rem",
                  padding: "0.875rem 2.5rem",
                  background: "linear-gradient(135deg, #c6c6c7 0%, #454747 100%)",
                  border: "none",
                  borderRadius: "9999px",
                  color: "#0e0e10",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  alignSelf: "flex-start",
                  transition: "opacity 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Continue
              </button>
            </div>

            {/* Right: Glass Panel */}
            <div
              style={{
                backgroundColor: "rgba(37,37,43,0.6)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                borderRadius: "1rem",
                border: "1px solid rgba(63,63,70,0.3)",
                padding: "1.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "1.25rem", color: "#82ff99" }}>
                  info
                </span>
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e7e4ec" }}>Why this matters?</span>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "#acaab1", lineHeight: 1.6, marginBottom: "1rem" }}>
                Your business name and currency are used throughout your dashboard to generate accurate financial reports and profit calculations.
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.625rem 0.75rem",
                  backgroundColor: "rgba(37,37,43,0.5)",
                  borderRadius: "0.5rem",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "1rem", color: "#71717a" }}>
                  lock
                </span>
                <span style={{ fontSize: "0.75rem", color: "#71717a" }}>Your data is encrypted and secure</span>
              </div>
            </div>
          </div>

          {/* Ghost Bento Card */}
          <div
            className="hidden xl:block"
            style={{
              position: "absolute",
              bottom: "-2rem",
              right: "-2rem",
              width: "16rem",
              height: "10rem",
              backgroundColor: "rgba(37,37,43,0.3)",
              borderRadius: "1rem",
              border: "1px solid rgba(63,63,70,0.2)",
              opacity: 0.2,
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Fixed Step Indicator Dots */}
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              style={{
                width: step === 1 ? "1.5rem" : "0.5rem",
                height: "0.5rem",
                borderRadius: "9999px",
                backgroundColor: step === 1 ? "#c6c6c7" : "#25252b",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
