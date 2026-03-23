"use client";

import { useRouter } from "next/navigation";

const navItems = [
  { label: "Welcome", icon: "door_open", step: 1, href: "/onboarding/step-1" },
  { label: "Store Connect", icon: "hub", step: 2, href: "/onboarding/step-2" },
  { label: "Data Sync", icon: "sync", step: 3, href: "/onboarding/step-3" },
  { label: "Summary", icon: "check_circle", step: 4, href: "/onboarding/step-4" },
];

export default function OnboardingStep4() {
  const router = useRouter();

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
              const isActive = item.step === 4;
              const isCompleted = item.step < 4;
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
              <span style={{ fontSize: "0.6875rem", color: "#82ff99" }}>100%</span>
            </div>
            <div style={{ width: "100%", height: "0.25rem", backgroundColor: "#25252b", borderRadius: "9999px" }}>
              <div
                style={{
                  width: "100%",
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
              <div style={{ fontSize: "0.6875rem", color: "#71717a" }}>Step 4 of 4</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#0e0e10" }}>
        {/* Top Header Bar */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 2rem",
            height: "4rem",
            borderBottom: "1px solid rgba(63,63,70,0.3)",
            flexShrink: 0,
          }}
        >
          {/* Left: Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.5rem", color: "#c6c6c7" }}>
              bar_chart_4_bars
            </span>
            <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#e7e4ec", letterSpacing: "-0.01em" }}>
              ProfitPilot
            </span>
          </div>

          {/* Center: Nav Links */}
          <nav style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
            {["Dashboard", "Analytics", "Settings"].map((link) => (
              <span
                key={link}
                style={{
                  fontSize: "0.8125rem",
                  color: "#71717a",
                  fontWeight: 500,
                  cursor: "default",
                }}
              >
                {link}
              </span>
            ))}
          </nav>

          {/* Right: Icons + Avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.25rem", color: "#71717a", cursor: "default" }}>
              help
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: "1.25rem", color: "#71717a", cursor: "default" }}>
              notifications
            </span>
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
          </div>
        </header>

        {/* Main Content - Centered */}
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "3rem",
            position: "relative",
          }}
        >
          {/* Celebratory Icon */}
          <div style={{ position: "relative", marginBottom: "2rem" }}>
            {/* Glow */}
            <div
              style={{
                position: "absolute",
                inset: "-1.5rem",
                borderRadius: "9999px",
                background: "rgba(211,255,211,0.2)",
                filter: "blur(30px)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "relative",
                width: "5rem",
                height: "5rem",
                borderRadius: "9999px",
                backgroundColor: "#82ff99",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "2.5rem", color: "#006127", fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </div>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: "3.5rem",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "#e7e4ec",
              marginBottom: "0.75rem",
              textAlign: "center",
            }}
          >
            You&apos;re All Set!
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "1.125rem",
              color: "#acaab1",
              marginBottom: "2.5rem",
              textAlign: "center",
              maxWidth: "28rem",
            }}
          >
            Your dashboard is ready. We&apos;ve synced your store data and configured your profit tracking.
          </p>

          {/* Bento Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.25rem",
              maxWidth: "36rem",
              width: "100%",
              marginBottom: "2.5rem",
            }}
          >
            {/* Total Revenue Found */}
            <div
              style={{
                backgroundColor: "#131316",
                borderRadius: "1rem",
                border: "1px solid rgba(63,63,70,0.3)",
                padding: "1.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "1.125rem", color: "#82ff99" }}>
                  trending_up
                </span>
                <span style={{ fontSize: "0.8125rem", color: "#acaab1", fontWeight: 500 }}>Total Revenue Found</span>
              </div>
              <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "#e7e4ec", letterSpacing: "-0.02em" }}>
                $142,580.00
              </span>
            </div>

            {/* Active Costs */}
            <div
              style={{
                backgroundColor: "#131316",
                borderRadius: "1rem",
                border: "1px solid rgba(63,63,70,0.3)",
                padding: "1.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "1.125rem", color: "#c6c6c7" }}>
                  receipt_long
                </span>
                <span style={{ fontSize: "0.8125rem", color: "#acaab1", fontWeight: 500 }}>Active Costs</span>
              </div>
              <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "#e7e4ec", letterSpacing: "-0.02em" }}>
                $58,210.00
              </span>
            </div>
          </div>

          {/* Go to Dashboard Button */}
          <button
            onClick={() => router.push("/")}
            style={{
              padding: "0.875rem 3rem",
              background: "linear-gradient(135deg, #c6c6c7 0%, #454747 100%)",
              border: "none",
              borderRadius: "9999px",
              color: "#0e0e10",
              fontSize: "0.9375rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              transition: "opacity 0.2s ease",
              marginBottom: "2rem",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Go to Dashboard
          </button>

          {/* Step Indicator Dots */}
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                style={{
                  width: step === 4 ? "1.5rem" : "0.5rem",
                  height: "0.5rem",
                  borderRadius: "9999px",
                  backgroundColor: step === 4 ? "#82ff99" : step < 4 ? "#454747" : "#25252b",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
