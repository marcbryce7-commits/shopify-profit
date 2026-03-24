"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BarChart3, Shield, Cloud } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account");
        return;
      }

      // Auto sign in after registration
      const { signIn } = await import("next-auth/react");
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Account created but sign-in failed, send to login
        router.push("/login");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0e0e10] overflow-hidden">
      {/* Decorative blurs */}
      <div className="fixed top-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#c6c6c7]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#82ff99]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[#25252b] rounded-xl flex items-center justify-center mb-4">
            <BarChart3 className="h-6 w-6 text-[#c6c6c7]" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tighter text-[#e7e4ec]">ProfitPilot</h1>
          <p className="text-xs text-[#75757c] font-medium mt-1">Terminal v2.4.0</p>
        </div>

        {/* Card */}
        <div className="bg-[#131316] rounded-xl border border-[#47474e]/10 p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-[#e7e4ec]">Create your account</h2>
            <p className="text-sm text-[#acaab1] mt-1">Start tracking your profit across all stores</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-[#7f2927]/20 border border-[#bb5551]/20 px-4 py-3 text-sm text-[#ff9993]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-xs font-semibold text-[#acaab1] uppercase tracking-wider">
                Name <span className="normal-case tracking-normal font-normal">(optional)</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2.5 bg-[#25252b] border-none rounded-lg text-[#e7e4ec] text-sm placeholder-[#75757c] focus:outline-none focus:ring-1 focus:ring-[#75757c]"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-semibold text-[#acaab1] uppercase tracking-wider">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-2.5 bg-[#25252b] border-none rounded-lg text-[#e7e4ec] text-sm placeholder-[#75757c] focus:outline-none focus:ring-1 focus:ring-[#75757c]"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-semibold text-[#acaab1] uppercase tracking-wider">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-4 py-2.5 bg-[#25252b] border-none rounded-lg text-[#e7e4ec] text-sm placeholder-[#75757c] focus:outline-none focus:ring-1 focus:ring-[#75757c]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-bold text-sm text-[#3f4041] disabled:opacity-50 transition-opacity"
              style={{ background: "linear-gradient(135deg, #c6c6c7 0%, #454747 100%)" }}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>

        {/* Sign in link */}
        <p className="text-center text-sm text-[#75757c] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#e7e4ec] hover:text-[#c6c6c7] transition-colors">
            Sign in
          </Link>
        </p>

        {/* Footer badges */}
        <div className="flex items-center justify-center gap-6 mt-8">
          <div className="flex items-center gap-1.5 text-[#75757c]">
            <Shield className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium uppercase tracking-widest">Encrypted</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#75757c]">
            <Cloud className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium uppercase tracking-widest">Global Ops</span>
          </div>
        </div>
      </div>
    </div>
  );
}
