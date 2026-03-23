"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useApi, apiPut } from "@/hooks/use-api";

/* ------------------------------------------------------------------ */
/*  Content field definitions per section                              */
/* ------------------------------------------------------------------ */

interface FieldDef {
  key: string;
  label: string;
  type: "text" | "textarea";
  group: string;
}

const LANDING_FIELDS: FieldDef[] = [
  // Hero
  { key: "landing.hero.badge", label: "Badge Text", type: "text", group: "Hero" },
  { key: "landing.hero.title", label: "Title Line 1", type: "text", group: "Hero" },
  { key: "landing.hero.titleAccent", label: "Title Line 2 (accent)", type: "text", group: "Hero" },
  { key: "landing.hero.subtitle", label: "Subtitle", type: "textarea", group: "Hero" },
  { key: "landing.hero.cta", label: "Primary CTA Button", type: "text", group: "Hero" },
  { key: "landing.hero.ctaSecondary", label: "Secondary CTA Button", type: "text", group: "Hero" },
  // Stats
  { key: "landing.stats.0.value", label: "Stat 1 Value", type: "text", group: "Stats Bar" },
  { key: "landing.stats.0.label", label: "Stat 1 Label", type: "text", group: "Stats Bar" },
  { key: "landing.stats.1.value", label: "Stat 2 Value", type: "text", group: "Stats Bar" },
  { key: "landing.stats.1.label", label: "Stat 2 Label", type: "text", group: "Stats Bar" },
  { key: "landing.stats.2.value", label: "Stat 3 Value", type: "text", group: "Stats Bar" },
  { key: "landing.stats.2.label", label: "Stat 3 Label", type: "text", group: "Stats Bar" },
  { key: "landing.stats.3.value", label: "Stat 4 Value", type: "text", group: "Stats Bar" },
  { key: "landing.stats.3.label", label: "Stat 4 Label", type: "text", group: "Stats Bar" },
  // Video
  { key: "landing.video.title", label: "Section Title", type: "text", group: "Demo Video" },
  { key: "landing.video.subtitle", label: "Section Subtitle", type: "text", group: "Demo Video" },
  // Features
  { key: "landing.features.heading", label: "Section Heading", type: "text", group: "Features" },
  { key: "landing.features.subheading", label: "Section Subheading", type: "text", group: "Features" },
  ...[0, 1, 2, 3, 4, 5].flatMap((i) => [
    { key: `landing.features.${i}.title`, label: `Feature ${i + 1} Title`, type: "text" as const, group: "Features" },
    { key: `landing.features.${i}.description`, label: `Feature ${i + 1} Description`, type: "textarea" as const, group: "Features" },
  ]),
  // How It Works
  { key: "landing.howItWorks.heading", label: "Section Heading", type: "text", group: "How It Works" },
  ...[0, 1, 2].flatMap((i) => [
    { key: `landing.howItWorks.${i}.title`, label: `Step ${i + 1} Title`, type: "text" as const, group: "How It Works" },
    { key: `landing.howItWorks.${i}.description`, label: `Step ${i + 1} Description`, type: "textarea" as const, group: "How It Works" },
  ]),
  // Testimonials
  { key: "landing.testimonials.heading", label: "Section Heading", type: "text", group: "Testimonials" },
  ...[0, 1, 2].flatMap((i) => [
    { key: `landing.testimonials.${i}.quote`, label: `Testimonial ${i + 1} Quote`, type: "textarea" as const, group: "Testimonials" },
    { key: `landing.testimonials.${i}.name`, label: `Testimonial ${i + 1} Name`, type: "text" as const, group: "Testimonials" },
    { key: `landing.testimonials.${i}.role`, label: `Testimonial ${i + 1} Role`, type: "text" as const, group: "Testimonials" },
  ]),
  // Pricing
  { key: "landing.pricing.heading", label: "Section Heading", type: "text", group: "Pricing" },
  { key: "landing.pricing.subheading", label: "Section Subheading", type: "text", group: "Pricing" },
  ...[0, 1, 2].flatMap((i) => [
    { key: `landing.pricing.${i}.name`, label: `Tier ${i + 1} Name`, type: "text" as const, group: "Pricing" },
    { key: `landing.pricing.${i}.price`, label: `Tier ${i + 1} Price`, type: "text" as const, group: "Pricing" },
    { key: `landing.pricing.${i}.description`, label: `Tier ${i + 1} Description`, type: "text" as const, group: "Pricing" },
    { key: `landing.pricing.${i}.cta`, label: `Tier ${i + 1} Button`, type: "text" as const, group: "Pricing" },
  ]),
  // CTA
  { key: "landing.cta.heading", label: "CTA Heading", type: "text", group: "Final CTA" },
  { key: "landing.cta.subtitle", label: "CTA Subtitle", type: "textarea", group: "Final CTA" },
  { key: "landing.cta.button", label: "CTA Button Text", type: "text", group: "Final CTA" },
];

const LOGIN_FIELDS: FieldDef[] = [
  { key: "login.title", label: "Page Title", type: "text", group: "Login Page" },
  { key: "login.subtitle", label: "Subtitle", type: "text", group: "Login Page" },
  { key: "login.button", label: "Sign In Button", type: "text", group: "Login Page" },
  { key: "login.forgotLink", label: "Forgot Password Link", type: "text", group: "Login Page" },
  { key: "login.registerPrompt", label: "Register Prompt Text", type: "text", group: "Login Page" },
  { key: "login.registerLink", label: "Register Link Text", type: "text", group: "Login Page" },
];

const REGISTER_FIELDS: FieldDef[] = [
  { key: "register.title", label: "Page Title", type: "text", group: "Register Page" },
  { key: "register.subtitle", label: "Subtitle", type: "text", group: "Register Page" },
  { key: "register.button", label: "Create Account Button", type: "text", group: "Register Page" },
  { key: "register.loginPrompt", label: "Login Prompt Text", type: "text", group: "Register Page" },
  { key: "register.loginLink", label: "Login Link Text", type: "text", group: "Register Page" },
];

const GLOBAL_FIELDS: FieldDef[] = [
  { key: "global.brandName", label: "Brand Name", type: "text", group: "Brand" },
  { key: "global.brandTagline", label: "Brand Tagline", type: "text", group: "Brand" },
  { key: "global.copyright", label: "Copyright Text", type: "text", group: "Footer" },
];

const SECTIONS = [
  { id: "landing", label: "Landing Page", fields: LANDING_FIELDS },
  { id: "login", label: "Login", fields: LOGIN_FIELDS },
  { id: "register", label: "Register", fields: REGISTER_FIELDS },
  { id: "global", label: "Global", fields: GLOBAL_FIELDS },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ContentManagerPage() {
  const [activeSection, setActiveSection] = useState("landing");
  const { data, loading, error, refetch } = useApi<Record<string, string>>("/api/content");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Sync edits when data loads
  useEffect(() => {
    if (data) setEdits({ ...data });
  }, [data]);

  const section = SECTIONS.find((s) => s.id === activeSection)!;
  const groups = [...new Set(section.fields.map((f) => f.group))];

  const handleChange = (key: string, value: string) => {
    setEdits((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const items = section.fields
        .filter((f) => edits[f.key] !== undefined && edits[f.key] !== (data?.[f.key] ?? ""))
        .map((f) => ({ key: f.key, value: edits[f.key], section: activeSection }));

      // Also save any new values that weren't in DB yet
      const newItems = section.fields
        .filter((f) => edits[f.key] !== undefined && data?.[f.key] === undefined)
        .map((f) => ({ key: f.key, value: edits[f.key], section: activeSection }));

      const allItems = [...items, ...newItems.filter((n) => !items.find((i) => i.key === n.key))];

      if (allItems.length === 0) {
        toast.info("No changes to save");
        setSaving(false);
        return;
      }

      await apiPut("/api/content", { items: allItems });
      toast.success(`Saved ${allItems.length} field(s)`);
      refetch();
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (data) setEdits({ ...data });
    toast.info("Reset to last saved values");
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#acaab1]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-sm text-[#ee7d77]">{error}</p>
        <button onClick={refetch} className="px-4 py-2 rounded-lg border border-[#47474e]/30 text-[#e7e4ec] text-sm font-medium hover:bg-[#25252b] transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#e7e4ec]">Content Manager</h1>
          <p className="text-sm text-[#acaab1] mt-1">Edit text and copy across all public-facing pages</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#47474e]/30 text-[#acaab1] text-sm font-medium hover:bg-[#25252b] transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #c6c6c7 0%, #454747 100%)", color: "#3f4041" }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#131316" }}>
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeSection === s.id
                ? "bg-[#25252b] text-[#e7e4ec] font-bold"
                : "text-[#acaab1] hover:text-[#e7e4ec]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Field Groups */}
      <div className="space-y-8">
        {groups.map((group) => (
          <div key={group} className="rounded-xl border border-[#47474e]/10 overflow-hidden" style={{ background: "#131316" }}>
            <div className="px-6 py-4 border-b border-[#47474e]/10" style={{ background: "#19191d" }}>
              <h3 className="text-sm font-bold text-[#e7e4ec] uppercase tracking-wider">{group}</h3>
            </div>
            <div className="p-6 space-y-5">
              {section.fields
                .filter((f) => f.group === group)
                .map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#acaab1] uppercase tracking-wider">
                      {field.label}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        value={edits[field.key] ?? ""}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2.5 bg-[#25252b] border-none rounded-lg text-[#e7e4ec] text-sm placeholder-[#75757c] focus:outline-none focus:ring-1 focus:ring-[#75757c] resize-y"
                      />
                    ) : (
                      <input
                        type="text"
                        value={edits[field.key] ?? ""}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#25252b] border-none rounded-lg text-[#e7e4ec] text-sm placeholder-[#75757c] focus:outline-none focus:ring-1 focus:ring-[#75757c]"
                      />
                    )}
                    <p className="text-[10px] text-[#75757c] font-mono">{field.key}</p>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
