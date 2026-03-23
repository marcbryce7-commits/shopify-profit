"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import React from "react";
import {
  BarChart3,
  TrendingUp,
  Store,
  DollarSign,
  Zap,
  Shield,
  Eye,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Package,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: DollarSign,
    title: "Real-Time Profit Tracking",
    description:
      "Know your exact profit margins on every order, updated in real-time across all your stores.",
  },
  {
    icon: Store,
    title: "Multi-Store Dashboard",
    description:
      "Manage unlimited Shopify stores from one unified dashboard with automatic synchronization.",
  },
  {
    icon: TrendingUp,
    title: "Advanced Analytics",
    description:
      "Deep insights into products, customers, and trends to help you make data-driven decisions.",
  },
  {
    icon: Zap,
    title: "AI-Powered Reconciliation",
    description:
      "Automatically match shipping invoices and detect cost discrepancies before they impact profit.",
  },
  {
    icon: Shield,
    title: "Tax Compliance",
    description:
      "Monitor economic nexus thresholds and automate sales tax filing across all states.",
  },
  {
    icon: Eye,
    title: "Cost Alerts",
    description:
      "Get notified immediately when actual costs differ from expected, preventing profit leaks.",
  },
];

const stats = [
  { value: "$2.4M+", label: "Profit Tracked" },
  { value: "1,200+", label: "Active Users" },
  { value: "99.9%", label: "Uptime" },
  { value: "< 5min", label: "Setup Time" },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Founder, StyleShop",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    quote:
      "ProfitPilot helped us identify $12K in hidden costs in the first month alone. Game changer.",
  },
  {
    name: "Michael Rodriguez",
    role: "CEO, TechGear",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    quote:
      "Finally, a tool that shows real profit, not just revenue. Our margins improved 8% in 3 months.",
  },
  {
    name: "Emily Watson",
    role: "Owner, HomeGoods Co",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
    quote:
      "The shipping reconciliation feature alone saves us hours every week and catches billing errors.",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "$29",
    description: "Perfect for new businesses",
    features: [
      "1 Shopify store",
      "Up to 500 orders/month",
      "Basic profit tracking",
      "Email support",
    ],
  },
  {
    name: "Pro",
    price: "$79",
    description: "For growing businesses",
    features: [
      "Up to 5 Shopify stores",
      "Unlimited orders",
      "AI shipping reconciliation",
      "Ad spend tracking",
      "Priority support",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$199",
    description: "For established brands",
    features: [
      "Unlimited stores",
      "Unlimited orders",
      "White-glove onboarding",
      "Custom integrations",
      "Dedicated account manager",
    ],
  },
];

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [isVideoPlaying, setIsVideoPlaying] = React.useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-zinc-50 to-white dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-zinc-200/50 bg-white/80 backdrop-blur-lg dark:border-zinc-800/50 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/landing" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-50">
              <BarChart3 className="h-5 w-5 text-white dark:text-zinc-900" />
            </div>
            <span className="text-xl font-bold">ProfitPilot</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Sign in
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pb-20 pt-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Badge variant="secondary" className="mb-4 gap-1">
              <Sparkles className="h-3 w-3" />
              Trusted by 1,200+ Shopify merchants
            </Badge>
            <h1 className="mx-auto mb-6 max-w-4xl bg-gradient-to-br from-zinc-900 via-zinc-700 to-zinc-900 bg-clip-text text-6xl font-bold leading-tight text-transparent dark:from-zinc-50 dark:via-zinc-300 dark:to-zinc-50">
              Know Your Real Profit, Not Just Revenue
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-xl text-zinc-600 dark:text-zinc-400">
              The only profit tracking tool that automatically reconciles shipping
              costs, ad spend, and COGS across all your Shopify stores.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="gap-2">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsVideoPlaying(true)}
              >
                Watch Demo
              </Button>
            </div>
            <p className="mt-4 text-sm text-zinc-500">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative mt-16"
          >
            <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-3xl" />
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
              </div>
              <div className="p-6">
                <div className="grid gap-4 md:grid-cols-4">
                  {[
                    { label: "Total Revenue", value: "$45,231.89", change: "+20.1%" },
                    { label: "Net Profit", value: "$18,492.35", change: "+12.5%" },
                    { label: "Total Orders", value: "1,234", change: "+19%" },
                    { label: "Profit Margin", value: "40.9%", change: "+2.4%" },
                  ].map((metric, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <p className="text-xs text-zinc-500">{metric.label}</p>
                      <p className="mt-1 text-2xl font-bold">{metric.value}</p>
                      <p className="text-xs text-green-600">{metric.change}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-zinc-200 bg-white px-6 py-12 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="mb-2 text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                  {stat.value}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="relative overflow-hidden px-6 py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-cyan-500/20 blur-3xl" />
        </div>
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <Badge variant="secondary" className="mb-4 gap-1">
              <Play className="h-3 w-3" />
              See ProfitPilot in Action
            </Badge>
            <h2 className="mb-4 text-5xl font-bold">Watch how it works</h2>
            <p className="mx-auto max-w-2xl text-xl text-zinc-600 dark:text-zinc-400">
              Discover how ProfitPilot helps merchants maximize their profitability
              in under 2 minutes
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 blur-2xl" />
            <div className="group relative overflow-hidden rounded-3xl border-2 border-zinc-200 bg-zinc-900 shadow-2xl dark:border-zinc-700">
              <div className="relative aspect-video w-full">
                {isVideoPlaying ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                    <video
                      className="h-full w-full object-cover"
                      controls
                      autoPlay
                      src="https://www.w3schools.com/html/mov_bbb.mp4"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : (
                  <div
                    className="absolute inset-0 cursor-pointer"
                    onClick={() => setIsVideoPlaying(true)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black">
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{
                          backgroundImage: `
                            linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
                          `,
                          backgroundSize: "40px 40px",
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-all group-hover:bg-white/20"
                          >
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-2xl">
                              <Play className="ml-1 h-10 w-10 fill-zinc-900 text-zinc-900" />
                            </div>
                          </motion.div>
                          <h3 className="mb-2 text-3xl font-bold text-white">
                            Watch Demo Video
                          </h3>
                          <p className="text-lg text-zinc-300">
                            See the full platform walkthrough
                          </p>
                        </div>
                      </div>
                      <div className="absolute bottom-8 left-8 right-8 opacity-20">
                        <div className="grid gap-3 md:grid-cols-3">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="rounded-lg border border-white/20 bg-white/5 p-4 backdrop-blur-sm"
                            >
                              <div className="mb-2 h-2 w-20 rounded bg-white/30" />
                              <div className="h-4 w-32 rounded bg-white/50" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t border-zinc-700 bg-zinc-900/80 px-6 py-4 backdrop-blur-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-sm text-zinc-300">2:14 duration</span>
                    </div>
                    <div className="text-sm text-zinc-400">
                      Product walkthrough & key features
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setIsVideoPlaying(true)}
                  >
                    <Play className="h-3 w-3" />
                    Play Demo
                  </Button>
                </div>
              </div>
            </div>
            <div className="absolute -left-4 -top-4 h-24 w-24 rounded-full bg-blue-500/20 blur-2xl" />
            <div className="absolute -bottom-4 -right-4 h-32 w-32 rounded-full bg-purple-500/20 blur-2xl" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-16 grid gap-6 md:grid-cols-3"
          >
            {[
              {
                icon: Eye,
                title: "See Real Data",
                description:
                  "Watch how ProfitPilot visualizes your actual profit metrics",
              },
              {
                icon: Zap,
                title: "Quick Setup",
                description:
                  "Learn how to connect your store and start tracking in minutes",
              },
              {
                icon: TrendingUp,
                title: "Powerful Insights",
                description:
                  "Discover the analytics that help you make better decisions",
              },
            ].map((benefit, i) => (
              <div
                key={i}
                className="rounded-xl border border-zinc-200 bg-white/50 p-6 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <benefit.icon className="h-5 w-5 text-zinc-900 dark:text-zinc-50" />
                </div>
                <h3 className="mb-2 font-semibold">{benefit.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {benefit.description}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <Badge variant="secondary" className="mb-4">
              Features
            </Badge>
            <h2 className="mb-4 text-4xl font-bold">
              Everything you need to maximize profit
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
              Stop guessing at your profit margins. Get complete visibility into
              every dollar.
            </p>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="group h-full transition-all hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 transition-colors group-hover:bg-zinc-900 dark:bg-zinc-800 dark:group-hover:bg-zinc-50">
                      <feature.icon className="h-6 w-6 text-zinc-900 transition-colors group-hover:text-white dark:text-zinc-50 dark:group-hover:text-zinc-900" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-zinc-50 px-6 py-24 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <Badge variant="secondary" className="mb-4">
              How It Works
            </Badge>
            <h2 className="mb-4 text-4xl font-bold">Get started in minutes</h2>
            <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
              Connect your store and let ProfitPilot do the heavy lifting.
            </p>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Store,
                step: "01",
                title: "Connect Your Store",
                description:
                  "Link your Shopify store in seconds with our secure OAuth integration.",
              },
              {
                icon: Package,
                step: "02",
                title: "Automatic Sync",
                description:
                  "We automatically import orders, costs, and reconcile shipping invoices.",
              },
              {
                icon: TrendingUp,
                step: "03",
                title: "Track Real Profit",
                description:
                  "Get instant insights into your true profitability and cost breakdowns.",
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative"
              >
                {i < 2 && (
                  <div className="absolute left-full top-12 hidden h-px w-full bg-gradient-to-r from-zinc-300 to-transparent dark:from-zinc-700 md:block" />
                )}
                <Card>
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-50">
                        <step.icon className="h-6 w-6 text-white dark:text-zinc-900" />
                      </div>
                      <span className="text-3xl font-bold text-zinc-200 dark:text-zinc-800">
                        {step.step}
                      </span>
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <Badge variant="secondary" className="mb-4">
              Testimonials
            </Badge>
            <h2 className="mb-4 text-4xl font-bold">
              Loved by merchants worldwide
            </h2>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <p className="mb-6 text-zinc-600 dark:text-zinc-400">
                      &ldquo;{testimonial.quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="h-12 w-12 rounded-full"
                      />
                      <div>
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-sm text-zinc-500">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-zinc-50 px-6 py-24 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <Badge variant="secondary" className="mb-4">
              Pricing
            </Badge>
            <h2 className="mb-4 text-4xl font-bold">
              Simple, transparent pricing
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
              Start free and scale as you grow. No hidden fees.
            </p>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-3">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card
                  className={`relative h-full ${
                    plan.popular
                      ? "border-zinc-900 shadow-lg dark:border-zinc-50"
                      : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge>Most Popular</Badge>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className="mb-2 text-2xl font-bold">{plan.name}</h3>
                    <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {plan.description}
                    </p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-zinc-600 dark:text-zinc-400">
                        /month
                      </span>
                    </div>
                    <Button
                      className="mb-6 w-full"
                      variant={plan.popular ? "default" : "outline"}
                    >
                      Start Free Trial
                    </Button>
                    <ul className="space-y-3">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-700 p-12 text-center text-white dark:from-zinc-50 dark:to-zinc-300 dark:text-zinc-900"
          >
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20" />
            <h2 className="mb-4 text-4xl font-bold">
              Ready to maximize your profit?
            </h2>
            <p className="mb-8 text-lg text-zinc-300 dark:text-zinc-700">
              Join 1,200+ merchants who&apos;ve discovered their true profitability
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" variant="secondary" className="gap-2">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-zinc-400 dark:text-zinc-600">
              14-day free trial • No credit card required
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 px-6 py-12 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-50">
                  <BarChart3 className="h-5 w-5 text-white dark:text-zinc-900" />
                </div>
                <span className="text-xl font-bold">ProfitPilot</span>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Real-time profit tracking for Shopify merchants
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Product</h4>
              <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-zinc-900 dark:hover:text-zinc-50"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-zinc-900 dark:hover:text-zinc-50"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-zinc-900 dark:hover:text-zinc-50"
                  >
                    Integrations
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-zinc-900 dark:hover:text-zinc-50"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-zinc-900 dark:hover:text-zinc-50"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-zinc-900 dark:hover:text-zinc-50"
                  >
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-zinc-900 dark:hover:text-zinc-50"
                  >
                    Privacy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-zinc-900 dark:hover:text-zinc-50"
                  >
                    Terms
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-zinc-900 dark:hover:text-zinc-50"
                  >
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-zinc-200 pt-8 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
            © 2026 ProfitPilot. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
