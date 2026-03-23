"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "Welcome", icon: "door_open", step: 1, href: "/onboarding/step-1" },
  { label: "Store Connect", icon: "hub", step: 2, href: "/onboarding/step-2" },
  { label: "Data Sync", icon: "sync", step: 3, href: "/onboarding/step-3" },
  { label: "Summary", icon: "check_circle", step: 4, href: "/onboarding/step-4" },
];

const features = [
  {
    icon: "bolt",
    title: "Real-time Data",
    description: "Live sync with your Shopify store for up-to-the-minute metrics.",
    color: "#82ff99",
    bgColor: "rgba(130,255,153,0.1)",
  },
  {
    icon: "ads_click",
    title: "Ad Spend Integration",
    description: "Connect Facebook, Google, and TikTok ad accounts automatically.",
    color: "#c6c6c7",
    bgColor: "rgba(198,198,199,0.1)",
  },
  {
    icon: "category",
    title: "Auto-Categorization",
    description: "AI-powered expense categorization for accurate profit tracking.",
    color: "#9d9da6",
    bgColor: "rgba(157,157,166,0.1)",
  },
];

export default function OnboardingStep2() {
  const router = useRouter();
  const [shopifyDomain, setShopifyDomain] = useState("");

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
              const isActive = item.step === 2;
              const isCompleted = item.step < 2;
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
              <div style={{ fontSize: "0.6875rem", color: "#71717a" }}>Step 2 of 4</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          backgroundColor: "#131316",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Progress Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.5rem 2.5rem",
            borderBottom: "1px solid rgba(63,63,70,0.3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "0.8125rem", color: "#acaab1", fontWeight: 500 }}>Step 2 of 4</span>
            {/* Segmented Progress Bar */}
            <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  style={{
                    width: "3rem",
                    height: "0.25rem",
                    borderRadius: "9999px",
                    backgroundColor: step <= 2 ? "#c6c6c7" : "#25252b",
                    transition: "background-color 0.3s ease",
                  }}
                />
              ))}
            </div>
          </div>
          <button
            style={{
              background: "none",
              border: "none",
              color: "#71717a",
              fontSize: "0.8125rem",
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              padding: "0.5rem",
            }}
          >
            Save and exit
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "3rem 2.5rem",
          }}
        >
          {/* Glass Panel Card */}
          <div
            style={{
              backgroundColor: "rgba(37,37,43,0.6)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderRadius: "1.5rem",
              border: "1px solid rgba(63,63,70,0.3)",
              padding: "3rem",
              maxWidth: "36rem",
              width: "100%",
              marginBottom: "3rem",
            }}
          >
            <h1
              style={{
                fontSize: "clamp(1.875rem, 4vw, 2.25rem)",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                color: "#e7e4ec",
                marginBottom: "0.75rem",
              }}
            >
              Connect Your Store
            </h1>
            <p style={{ fontSize: "0.9375rem", color: "#acaab1", marginBottom: "2rem", lineHeight: 1.6 }}>
              Enter your Shopify store domain to securely connect and start syncing your data.
            </p>

            {/* Form */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "#acaab1", marginBottom: "0.5rem" }}>
                Shopify Domain
              </label>
              <div style={{ position: "relative" }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: "absolute",
                    left: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "1.25rem",
                    color: "#71717a",
                  }}
                >
                  link
                </span>
                <input
                  type="text"
                  value={shopifyDomain}
                  onChange={(e) => setShopifyDomain(e.target.value)}
                  placeholder="your-store.myshopify.com"
                  style={{
                    width: "100%",
                    padding: "0.875rem 1rem 0.875rem 3rem",
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

            {/* Connect Store Button */}
            <button
              onClick={() => router.push("/onboarding/step-3")}
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
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Connect Store
            </button>

            {/* Footer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "1rem", color: "#71717a" }}>
                lock
              </span>
              <span style={{ fontSize: "0.75rem", color: "#71717a" }}>Secure connection via Shopify Partner API</span>
            </div>
          </div>

          {/* Feature Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1.25rem",
              maxWidth: "54rem",
              width: "100%",
            }}
          >
            {features.map((feature) => (
              <div
                key={feature.title}
                style={{
                  backgroundColor: "rgba(31,31,36,0.6)",
                  borderRadius: "1rem",
                  border: "1px solid rgba(63,63,70,0.2)",
                  padding: "1.5rem",
                }}
              >
                <div
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    borderRadius: "0.75rem",
                    backgroundColor: feature.bgColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "1.25rem", color: feature.color }}>
                    {feature.icon}
                  </span>
                </div>
                <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#e7e4ec", marginBottom: "0.375rem" }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: "0.8125rem", color: "#acaab1", lineHeight: 1.5 }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Fixed Help Button */}
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
          }}
        >
          <button
            style={{
              width: "3rem",
              height: "3rem",
              borderRadius: "9999px",
              backgroundColor: "#25252b",
              border: "1px solid rgba(63,63,70,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "background-color 0.2s ease",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "1.25rem", color: "#acaab1" }}>
              help
            </span>
          </button>
        </div>
      </main>
    </div>
  );
}
