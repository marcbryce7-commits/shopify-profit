import Link from "next/link";

export default function LandingPage() {
  return (
    <div
      className="antialiased overflow-x-hidden"
      style={{
        fontFamily: "'Inter', sans-serif",
        backgroundColor: "#0e0e10",
        color: "#e7e4ec",
      }}
    >
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 h-16 z-50 border-b" style={{ background: "rgba(14,14,16,0.8)", backdropFilter: "blur(24px)", borderColor: "rgba(71,71,78,0.2)" }}>
        <div className="max-w-7xl mx-auto h-full flex justify-between items-center px-6 lg:px-12">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#25252b" }}>
              <span className="material-symbols-outlined text-xl" style={{ color: "#c6c6c7" }}>bar_chart_4_bars</span>
            </div>
            <span className="font-extrabold text-xl tracking-tighter" style={{ color: "#e7e4ec" }}>ProfitPilot</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a className="text-sm font-medium hover:text-[#e7e4ec] transition-colors" href="#" style={{ color: "#acaab1" }}>Features</a>
            <a className="text-sm font-medium hover:text-[#e7e4ec] transition-colors" href="#" style={{ color: "#acaab1" }}>How it works</a>
            <a className="text-sm font-medium hover:text-[#e7e4ec] transition-colors" href="#" style={{ color: "#acaab1" }}>Pricing</a>
            <a className="text-sm font-medium hover:text-[#e7e4ec] transition-colors" href="#" style={{ color: "#acaab1" }}>Testimonials</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium px-4 py-2 hover:rounded-xl transition-colors" style={{ color: "#e7e4ec" }}>Login</Link>
            <Link href="/register" className="text-sm font-bold px-5 py-2 rounded-xl hover:scale-[1.02] active:scale-100 transition-all" style={{ background: "#c6c6c7", color: "#3f4041", boxShadow: "0 10px 15px -3px rgba(198,198,199,0.05)" }}>Start Free Trial</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6" style={{ background: "radial-gradient(circle at top center, rgba(198,198,199,0.08) 0%, transparent 70%)" }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6" style={{ background: "#1f1f24", border: "1px solid rgba(71,71,78,0.3)" }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#73f08c" }}></span>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#acaab1" }}>V2.4 Now Live</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[0.9] mb-8" style={{ color: "#e7e4ec" }}>
              Stop Guessing. <br /><span style={{ color: "#b8b9b9" }}>Start Profiting.</span>
            </h1>
            <p className="text-lg max-w-lg mb-10 leading-relaxed" style={{ color: "#acaab1" }}>
              The precision-engineered profit tracker for Shopify stores. Automate your margins, shipping costs, and ad spend in one kinetic interface.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register" className="px-8 py-4 font-bold rounded-xl flex items-center justify-center gap-2 transition-all" style={{ background: "#c6c6c7", color: "#3f4041" }}>
                Connect Shopify Store
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
              <button className="px-8 py-4 font-semibold rounded-xl transition-all" style={{ background: "#1f1f24", color: "#e7e4ec" }}>
                View Demo
              </button>
            </div>
          </div>
          <div className="lg:col-span-6 relative">
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl" style={{ background: "rgba(37,37,43,0.6)", backdropFilter: "blur(12px)", border: "1px solid rgba(117,117,124,0.1)" }}>
              <img className="w-full h-auto opacity-90" alt="Modern dark dashboard UI with financial growth charts" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBuqdAUuSCsHvzmglgnBre_mqtvoJ5reXIu7nKMKqAD-9tqJDHeGQs1F6jZyYxmuQ3qw9i-cQBH5WoYK2yzScJePmLeHUeJnXF_qH3dW5XtJc2yhf-vi4DVxQ4B195UTQNuPyDIaJrLErtus4tPZ_Tzp11BCsIzufJHExUlquDgh2HfTw3SIlv1Mpv54Hbciv5Bjo5abI2_cjqfO7KuJ3Ecd_l2YD450F4f4B7eWrKwYiXlZ8MdPwvq6P3FAea7Wo5rKFFDBZfB7yc" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(14,14,16,0.8), transparent, transparent)" }}></div>
            </div>
            <div className="absolute -top-6 -right-6 w-32 h-32 blur-[80px]" style={{ background: "rgba(198,198,199,0.1)" }}></div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 blur-[100px]" style={{ background: "rgba(115,240,140,0.1)" }}></div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-10 px-6" style={{ borderTop: "1px solid rgba(71,71,78,0.1)", borderBottom: "1px solid rgba(71,71,78,0.1)", background: "#131316" }}>
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between gap-12">
          <div className="flex flex-col">
            <span className="text-3xl font-extrabold tracking-tighter" style={{ color: "#e7e4ec" }}>$2.4B+</span>
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "#acaab1" }}>Revenue Tracked</span>
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-extrabold tracking-tighter" style={{ color: "#e7e4ec" }}>12,400+</span>
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "#acaab1" }}>Active Merchants</span>
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-extrabold tracking-tighter" style={{ color: "#e7e4ec" }}>99.9%</span>
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "#acaab1" }}>Data Accuracy</span>
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-extrabold tracking-tighter" style={{ color: "#e7e4ec" }}>24/7</span>
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "#acaab1" }}>Real-time Sync</span>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="py-24 px-6" style={{ background: "#0e0e10" }}>
        <div className="max-w-5xl mx-auto text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6" style={{ color: "#e7e4ec" }}>See ProfitPilot in Action</h2>
          <p style={{ color: "#acaab1" }}>The fastest way to understand your store&apos;s financial health.</p>
        </div>
        <div className="max-w-6xl mx-auto aspect-video rounded-3xl flex items-center justify-center relative group overflow-hidden" style={{ background: "rgba(37,37,43,0.6)", backdropFilter: "blur(12px)", border: "1px solid rgba(117,117,124,0.1)" }}>
          <img className="absolute inset-0 w-full h-full object-cover opacity-30" alt="Abstract cinematic background for video player" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBp_qriWFjsgjMnDt811rJ9aiUxulW8JAX0TnV2Jqe52yKYhtG77qRUZ2NpXUxZ_1KHunPXZKGUyx-4Rz-38P-qPRlWnYWS7H2h1D5eOw3Ku502nkr_JHXBRwm9haS13OceoCeYQkEGgQX95prMRj_Gcq7_4JR_1CbsLU_u9HdS8sGe-qCi5VNdlTNIyT1Z5bj6WIJSrxF5AOokJ7BBqzodADX9u-TcE1hbQ86eAxiUJ8whQM7OtMefTzwSPdKuv-ckzgq4tMHEpiI" />
          <div className="z-10 w-20 h-20 rounded-full flex items-center justify-center cursor-pointer group-hover:scale-110 transition-transform" style={{ background: "#c6c6c7", boxShadow: "0 20px 25px -5px rgba(198,198,199,0.2)" }}>
            <span className="material-symbols-outlined text-4xl" style={{ color: "#3f4041" }}>play_arrow</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6" style={{ background: "#131316" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col mb-16">
            <span className="font-bold text-sm tracking-widest uppercase mb-2" style={{ color: "#c6c6c7" }}>Core Engine</span>
            <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight" style={{ color: "#e7e4ec" }}>Powerful by Design.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl flex flex-col items-start transition-all" style={{ background: "#19191d", border: "1px solid rgba(71,71,78,0.05)" }}>
              <span className="material-symbols-outlined mb-6 text-3xl" style={{ color: "#c6c6c7" }}>monitoring</span>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#e7e4ec" }}>Live Margin Analysis</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#acaab1" }}>Calculate exact net profit after COGS, shipping, and processing fees in real-time.</p>
            </div>
            {/* Feature 2 */}
            <div className="p-8 rounded-2xl flex flex-col items-start transition-all" style={{ background: "#19191d", border: "1px solid rgba(71,71,78,0.05)" }}>
              <span className="material-symbols-outlined mb-6 text-3xl" style={{ color: "#c6c6c7" }}>campaign</span>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#e7e4ec" }}>Ad Spend Integration</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#acaab1" }}>Direct sync with Meta, Google, and TikTok ads for true ROAS tracking.</p>
            </div>
            {/* Feature 3 */}
            <div className="p-8 rounded-2xl flex flex-col items-start transition-all" style={{ background: "#19191d", border: "1px solid rgba(71,71,78,0.05)" }}>
              <span className="material-symbols-outlined mb-6 text-3xl" style={{ color: "#c6c6c7" }}>inventory_2</span>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#e7e4ec" }}>Inventory Valuation</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#acaab1" }}>Automatic cost-of-goods-sold tracking based on your current stock levels.</p>
            </div>
            {/* Feature 4 */}
            <div className="p-8 rounded-2xl flex flex-col items-start transition-all" style={{ background: "#19191d", border: "1px solid rgba(71,71,78,0.05)" }}>
              <span className="material-symbols-outlined mb-6 text-3xl" style={{ color: "#c6c6c7" }}>auto_awesome</span>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#e7e4ec" }}>Smart Insights</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#acaab1" }}>AI-driven recommendations on which products to scale and which to cut.</p>
            </div>
            {/* Feature 5 */}
            <div className="p-8 rounded-2xl flex flex-col items-start transition-all" style={{ background: "#19191d", border: "1px solid rgba(71,71,78,0.05)" }}>
              <span className="material-symbols-outlined mb-6 text-3xl" style={{ color: "#c6c6c7" }}>language</span>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#e7e4ec" }}>Global Multi-Currency</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#acaab1" }}>Sell in EUR, track in USD. Live exchange rates handled automatically.</p>
            </div>
            {/* Feature 6 */}
            <div className="p-8 rounded-2xl flex flex-col items-start transition-all" style={{ background: "#19191d", border: "1px solid rgba(71,71,78,0.05)" }}>
              <span className="material-symbols-outlined mb-6 text-3xl" style={{ color: "#c6c6c7" }}>verified_user</span>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#e7e4ec" }}>Audit-Ready Reports</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#acaab1" }}>Export formatted P&amp;L statements for your accountant in one click.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6" style={{ background: "#0e0e10" }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold mb-16 text-center" style={{ color: "#e7e4ec" }}>Ready in 3 Minutes</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 relative">
            <div className="hidden lg:block absolute top-12 left-0 w-full h-[1px] z-0" style={{ background: "rgba(71,71,78,0.2)" }}></div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl mb-8" style={{ background: "#25252b", border: "1px solid rgba(71,71,78,0.3)", color: "#c6c6c7" }}>1</div>
              <h3 className="text-xl font-bold mb-4" style={{ color: "#e7e4ec" }}>Connect Store</h3>
              <p className="text-sm" style={{ color: "#acaab1" }}>OAuth 2.0 secure connection to your Shopify store with one click.</p>
            </div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl mb-8" style={{ background: "#25252b", border: "1px solid rgba(71,71,78,0.3)", color: "#c6c6c7" }}>2</div>
              <h3 className="text-xl font-bold mb-4" style={{ color: "#e7e4ec" }}>Input Costs</h3>
              <p className="text-sm" style={{ color: "#acaab1" }}>Sync your marketing platforms and upload your product unit costs.</p>
            </div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl mb-8" style={{ background: "#25252b", border: "1px solid rgba(71,71,78,0.3)", color: "#c6c6c7" }}>3</div>
              <h3 className="text-xl font-bold mb-4" style={{ color: "#e7e4ec" }}>Scale Profit</h3>
              <p className="text-sm" style={{ color: "#acaab1" }}>Watch the real-time profit dashboard and make data-driven decisions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 overflow-hidden" style={{ background: "#131316" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-8">
            <h2 className="text-4xl lg:text-5xl font-extrabold max-w-xl" style={{ color: "#e7e4ec" }}>Loved by high-growth merchants.</h2>
            <div className="flex gap-4">
              <button className="w-12 h-12 rounded-full flex items-center justify-center transition-all" style={{ border: "1px solid #75757c", color: "#acaab1" }}>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button className="w-12 h-12 rounded-full flex items-center justify-center transition-all" style={{ border: "1px solid #75757c", color: "#acaab1" }}>
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-10 rounded-3xl flex flex-col justify-between h-full" style={{ background: "rgba(37,37,43,0.6)", backdropFilter: "blur(12px)", border: "1px solid rgba(117,117,124,0.1)" }}>
              <p className="italic text-lg leading-relaxed mb-10" style={{ color: "#e7e4ec" }}>&ldquo;ProfitPilot revealed that our best-selling product was actually losing us money after shipping. Total game changer.&rdquo;</p>
              <div className="flex items-center gap-4">
                <img className="w-12 h-12 rounded-full object-cover" alt="Portrait of a male business owner" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB5mr-kJ3rb0YyEjz_Gq1tNmWhkSe8v_o_KR0jBF18RK6X3C7tFTNAxUHlUHlv1waioL0kbjb8NrEizLmxlFaaou6Z6Hm4vYdSeioSGj6smFAVphVFtCW0bUKwmdWBe9UwostM2yXaFItOnH4d58F8uyTvlg_7IWYPuFXNiuT_kHtaGRqTddNCJqP8tn430jbjXLYTlwEVM6DDfMzIBBhtVHEqPZ33R_3Y7lBaH8q6eIqTC2VuLovuxCG1efylRNd0aBN3JKLgYK8s" />
                <div>
                  <p className="font-bold" style={{ color: "#e7e4ec" }}>Alex Rivera</p>
                  <p className="text-xs" style={{ color: "#acaab1" }}>CEO, Nova Aesthetics</p>
                </div>
              </div>
            </div>
            <div className="p-10 rounded-3xl flex flex-col justify-between h-full" style={{ background: "rgba(37,37,43,0.6)", backdropFilter: "blur(12px)", border: "1px solid rgba(117,117,124,0.1)" }}>
              <p className="italic text-lg leading-relaxed mb-10" style={{ color: "#e7e4ec" }}>&ldquo;Finally, a dashboard that matches our brand&apos;s aesthetic. The kinetic minimalist UI is as fast as it is beautiful.&rdquo;</p>
              <div className="flex items-center gap-4">
                <img className="w-12 h-12 rounded-full object-cover" alt="Portrait of a female e-commerce founder" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEAtTT_-lhieG0QoQboUQiTo3wYGflpWFDzi0mhjK8DRaCSPPBrHqINY39e1d4mPmZbUG7XV9Tcb-5uoyuzusBjmume6kjfSZynXAG3QcicQyNEeFU6O5fqITRgv5nUaZWIGYO4Pu8IBtQXUEUGwCHdWNjWIThGwD6vrnf7Jn9xlorLECkTwIc1tgty3IncYryF8QwiO3O6Cb6PRfqCauQersd3oWstrqUXZYe5KllJsGB9jarfx9W_4fnLGoQifH_1oAhXH9cIkY" />
                <div>
                  <p className="font-bold" style={{ color: "#e7e4ec" }}>Sarah Chen</p>
                  <p className="text-xs" style={{ color: "#acaab1" }}>Founder, Silk &amp; Soul</p>
                </div>
              </div>
            </div>
            <div className="p-10 rounded-3xl flex flex-col justify-between h-full" style={{ background: "rgba(37,37,43,0.6)", backdropFilter: "blur(12px)", border: "1px solid rgba(117,117,124,0.1)" }}>
              <p className="italic text-lg leading-relaxed mb-10" style={{ color: "#e7e4ec" }}>&ldquo;The ad spend integration is seamless. I can see my exact contribution margin per order in real-time.&rdquo;</p>
              <div className="flex items-center gap-4">
                <img className="w-12 h-12 rounded-full object-cover" alt="Portrait of a male marketing manager" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB03_zjszoDvE2CJRVPVO62Rt5gShKaQSKm4V_leFej7RlbzPQ3eLv0sSU2XBvvDFLYPK4F-yCR7jQCSs6yHCVTUzU4abddEXAZ-1Hg-MGcET2HZmSvRCk8SRQm2HOxAWquU2CUA6OfKoyrjkcfqqNre1zogNMpNLN4qRmSAsLl7_NSeW0qQKdKHezVeW21QY9K7GY46d2tiuJqyK_077L5shYL5TDUyphQ9QUKFenWTFEkrB5Nazgzb7WEOdpZlhi3XToQqPmmfB4" />
                <div>
                  <p className="font-bold" style={{ color: "#e7e4ec" }}>Mark Thompson</p>
                  <p className="text-xs" style={{ color: "#acaab1" }}>Growth Lead, Urban Edge</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-6" style={{ background: "#0e0e10" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4" style={{ color: "#e7e4ec" }}>Simple, Scalable Pricing</h2>
            <p style={{ color: "#acaab1" }}>Start free, upgrade as you grow. No hidden fees.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Tier 1 */}
            <div className="p-8 rounded-3xl flex flex-col" style={{ background: "#131316", border: "1px solid rgba(71,71,78,0.1)" }}>
              <h3 className="text-xl font-bold mb-2" style={{ color: "#e7e4ec" }}>Starter</h3>
              <p className="text-sm mb-6" style={{ color: "#acaab1" }}>For new stores finding their feet.</p>
              <div className="mb-8">
                <span className="text-4xl font-extrabold" style={{ color: "#e7e4ec" }}>$0</span>
                <span className="text-sm" style={{ color: "#acaab1" }}>/mo</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                <li className="flex items-center gap-3 text-sm" style={{ color: "#acaab1" }}>
                  <span className="material-symbols-outlined text-lg" style={{ color: "#73f08c" }}>check_circle</span>
                  Up to 50 orders/mo
                </li>
                <li className="flex items-center gap-3 text-sm" style={{ color: "#acaab1" }}>
                  <span className="material-symbols-outlined text-lg" style={{ color: "#73f08c" }}>check_circle</span>
                  Standard Dashboard
                </li>
              </ul>
              <button className="w-full py-3 rounded-xl font-bold transition-all" style={{ background: "#1f1f24", color: "#e7e4ec" }}>Get Started</button>
            </div>
            {/* Tier 2 */}
            <div className="p-8 rounded-3xl flex flex-col relative scale-105 shadow-2xl" style={{ background: "#25252b", border: "2px solid rgba(198,198,199,0.3)" }}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full" style={{ background: "#c6c6c7", color: "#3f4041" }}>Most Popular</div>
              <h3 className="text-xl font-bold mb-2" style={{ color: "#e7e4ec" }}>Growth</h3>
              <p className="text-sm mb-6" style={{ color: "#acaab1" }}>For established scaling brands.</p>
              <div className="mb-8">
                <span className="text-4xl font-extrabold" style={{ color: "#e7e4ec" }}>$49</span>
                <span className="text-sm" style={{ color: "#acaab1" }}>/mo</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                <li className="flex items-center gap-3 text-sm" style={{ color: "#e7e4ec" }}>
                  <span className="material-symbols-outlined text-lg" style={{ color: "#c6c6c7" }}>check_circle</span>
                  Unlimited Orders
                </li>
                <li className="flex items-center gap-3 text-sm" style={{ color: "#e7e4ec" }}>
                  <span className="material-symbols-outlined text-lg" style={{ color: "#c6c6c7" }}>check_circle</span>
                  All Ad Integrations
                </li>
                <li className="flex items-center gap-3 text-sm" style={{ color: "#e7e4ec" }}>
                  <span className="material-symbols-outlined text-lg" style={{ color: "#c6c6c7" }}>check_circle</span>
                  Inventory Tracking
                </li>
              </ul>
              <button className="w-full py-4 rounded-xl font-bold transition-all" style={{ background: "#c6c6c7", color: "#3f4041", boxShadow: "0 10px 15px -3px rgba(198,198,199,0.1)" }}>Start 14-Day Free Trial</button>
            </div>
            {/* Tier 3 */}
            <div className="p-8 rounded-3xl flex flex-col" style={{ background: "#131316", border: "1px solid rgba(71,71,78,0.1)" }}>
              <h3 className="text-xl font-bold mb-2" style={{ color: "#e7e4ec" }}>Scale</h3>
              <p className="text-sm mb-6" style={{ color: "#acaab1" }}>For multi-store e-commerce empires.</p>
              <div className="mb-8">
                <span className="text-4xl font-extrabold" style={{ color: "#e7e4ec" }}>$149</span>
                <span className="text-sm" style={{ color: "#acaab1" }}>/mo</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                <li className="flex items-center gap-3 text-sm" style={{ color: "#acaab1" }}>
                  <span className="material-symbols-outlined text-lg" style={{ color: "#73f08c" }}>check_circle</span>
                  Multi-Store Dashboard
                </li>
                <li className="flex items-center gap-3 text-sm" style={{ color: "#acaab1" }}>
                  <span className="material-symbols-outlined text-lg" style={{ color: "#73f08c" }}>check_circle</span>
                  Priority Support
                </li>
                <li className="flex items-center gap-3 text-sm" style={{ color: "#acaab1" }}>
                  <span className="material-symbols-outlined text-lg" style={{ color: "#73f08c" }}>check_circle</span>
                  Custom Reporting
                </li>
              </ul>
              <button className="w-full py-3 rounded-xl font-bold transition-all" style={{ background: "#1f1f24", color: "#e7e4ec" }}>Contact Sales</button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6" style={{ background: "#0e0e10" }}>
        <div className="max-w-5xl mx-auto rounded-[2.5rem] p-12 lg:p-20 text-center relative overflow-hidden" style={{ background: "rgba(37,37,43,0.6)", backdropFilter: "blur(12px)", border: "1px solid rgba(117,117,124,0.1)" }}>
          <div className="absolute top-0 right-0 w-96 h-96 blur-[120px]" style={{ background: "rgba(198,198,199,0.05)" }}></div>
          <div className="relative z-10">
            <h2 className="text-4xl lg:text-6xl font-extrabold mb-8 tracking-tighter" style={{ color: "#e7e4ec" }}>Your profit deserves <br />better pilots.</h2>
            <p className="text-lg max-w-2xl mx-auto mb-12" style={{ color: "#acaab1" }}>Join 12,000+ merchants who turned their data into their biggest competitive advantage.</p>
            <Link href="/register" className="inline-block px-12 py-5 font-bold rounded-2xl text-lg hover:scale-[1.03] transition-transform" style={{ background: "#c6c6c7", color: "#3f4041", boxShadow: "0 25px 50px -12px rgba(198,198,199,0.2)" }}>Get Started for Free</Link>
            <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em]" style={{ color: "#acaab1" }}>No credit card required</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6" style={{ background: "#000000", borderTop: "1px solid rgba(71,71,78,0.1)" }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-24">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#25252b" }}>
                <span className="material-symbols-outlined text-xl" style={{ color: "#c6c6c7" }}>bar_chart_4_bars</span>
              </div>
              <span className="font-extrabold text-xl tracking-tighter" style={{ color: "#e7e4ec" }}>ProfitPilot</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "#acaab1" }}>Precision profit tracking for modern Shopify merchants.</p>
          </div>
          <div>
            <h4 className="font-bold mb-6" style={{ color: "#e7e4ec" }}>Platform</h4>
            <ul className="space-y-4 text-sm" style={{ color: "#acaab1" }}>
              <li><a className="hover:text-[#c6c6c7] transition-colors" href="#">Features</a></li>
              <li><a className="hover:text-[#c6c6c7] transition-colors" href="#">Integrations</a></li>
              <li><a className="hover:text-[#c6c6c7] transition-colors" href="#">Pricing</a></li>
              <li><a className="hover:text-[#c6c6c7] transition-colors" href="#">Changelog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6" style={{ color: "#e7e4ec" }}>Resources</h4>
            <ul className="space-y-4 text-sm" style={{ color: "#acaab1" }}>
              <li><a className="hover:text-[#c6c6c7] transition-colors" href="#">Documentation</a></li>
              <li><a className="hover:text-[#c6c6c7] transition-colors" href="#">Help Center</a></li>
              <li><a className="hover:text-[#c6c6c7] transition-colors" href="#">API Reference</a></li>
              <li><a className="hover:text-[#c6c6c7] transition-colors" href="#">Profit Calculator</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6" style={{ color: "#e7e4ec" }}>Connect</h4>
            <div className="flex gap-4 mb-8">
              <a className="w-10 h-10 rounded-xl flex items-center justify-center transition-all" href="#" style={{ background: "#1f1f24", color: "#acaab1" }}>
                <span className="material-symbols-outlined text-lg">public</span>
              </a>
              <a className="w-10 h-10 rounded-xl flex items-center justify-center transition-all" href="#" style={{ background: "#1f1f24", color: "#acaab1" }}>
                <span className="material-symbols-outlined text-lg">alternate_email</span>
              </a>
            </div>
            <p className="text-xs" style={{ color: "rgba(172,170,177,0.5)" }}>&copy; 2024 ProfitPilot Inc. All rights reserved. Built for Shopify.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
