"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { BarChart3, Shield, Cloud } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
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
      {/* Decorative blur circles */}
      <div className="fixed top-[-200px] left-[-100px] h-[500px] w-[500px] rounded-full bg-[#c6c6c7]/5 blur-[120px]" />
      <div className="fixed bottom-[-200px] right-[-100px] h-[500px] w-[500px] rounded-full bg-[#82ff99]/5 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo and title */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#25252b]">
            <BarChart3 className="h-7 w-7 text-[#c6c6c7]" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight text-white">
              ProfitPilot
            </h1>
            <p className="mt-1 text-xs text-[#6e6e76]">Terminal v2.4.0</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-[#47474e]/10 bg-[#131316] p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Welcome back</h2>
            <p className="mt-1 text-sm text-[#6e6e76]">
              Sign in to your profit dashboard
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#a0a0a8]"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="h-11 w-full rounded-lg border-none bg-[#25252b] px-4 text-sm text-white placeholder-[#6e6e76] outline-none ring-0 focus:ring-2 focus:ring-[#c6c6c7]/20 transition-shadow"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#a0a0a8]"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#6e6e76] hover:text-[#a0a0a8] transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="h-11 w-full rounded-lg border-none bg-[#25252b] px-4 text-sm text-white placeholder-[#6e6e76] outline-none ring-0 focus:ring-2 focus:ring-[#c6c6c7]/20 transition-shadow"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-11 w-full rounded-lg text-sm font-semibold text-[#3f4041] transition-opacity disabled:opacity-50"
              style={{
                background:
                  "linear-gradient(135deg, #c6c6c7 0%, #454747 100%)",
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#6e6e76]">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-white hover:text-[#c6c6c7] transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* Footer badges */}
        <div className="mt-6 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2 text-xs text-[#6e6e76]">
            <Shield className="h-3.5 w-3.5" />
            <span>Encrypted</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#6e6e76]">
            <Cloud className="h-3.5 w-3.5" />
            <span>Global Ops</span>
          </div>
        </div>
      </div>
    </div>
  );
}
