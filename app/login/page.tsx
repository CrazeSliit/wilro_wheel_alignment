import LoginForm from "./LoginForm";

export const metadata = {
  title: "Sign in — Iruka Motors",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen w-full">

      {/* ── Left Panel ───────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between overflow-hidden"
        style={{
          backgroundImage:
            "url('https://plus.unsplash.com/premium_photo-1661963005592-182d602c6a3f?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-linear-to-br from-black/80 via-black/60 to-black/40" />

        {/* Decorative lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-1/4 top-0 h-full w-px bg-white/5 rotate-12 scale-y-125" />
          <div className="absolute left-2/3 top-0 h-full w-px bg-white/5 rotate-12 scale-y-125" />
        </div>

        {/* Top: brand */}
        <div className="relative z-10 px-10 pt-10 flex items-center gap-3">
          <div
            style={{
              width: 40,
              height: 40,
              border: "1.5px solid rgba(255,255,255,0.3)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 900, color: "#fff", fontFamily: '"Arial Black", sans-serif', letterSpacing: -1 }}>
              IM
            </span>
          </div>
          <span className="text-white/90 text-sm font-semibold tracking-wide">Iruka Motors</span>
        </div>

        {/* Centre: tagline */}
        <div className="relative z-10 px-10 py-12">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3">
            Employee Portal
          </p>
          <h2 className="text-4xl font-extrabold text-white leading-snug">
            Have a<br />
            <span className="text-primary">Good Day</span>
          </h2>
          <p className="mt-4 text-white/50 text-sm leading-relaxed max-w-xs">
            Manage your tasks, invoices, and profile — all in one place.
          </p>
        </div>

        {/* Bottom: footer note */}
        <div className="relative z-10 px-10 pb-8">
          <p className="text-white/25 text-xs">© {new Date().getFullYear()} Iruka Motors. All rights reserved.</p>
        </div>
      </div>

      {/* ── Right Panel ──────────────────────────────── */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-background px-8 py-12">
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="flex justify-start mb-8">
            <div
              style={{
                width: 64,
                height: 64,
                border: "2px solid rgb(112, 144, 200)",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                background: "linear-gradient(135deg, rgb(232, 240, 254) 0%, rgb(200, 216, 248) 100%)",
              }}
            >
              <div style={{ textAlign: "center", lineHeight: 1 }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: "rgb(96, 48, 160)", fontFamily: '"Arial Black", sans-serif' }}>I</span>
                <span style={{ fontSize: 24, fontWeight: 900, color: "rgb(48, 96, 192)", fontFamily: '"Arial Black", sans-serif' }}>M</span>
                <div style={{ width: 7, height: 7, background: "rgb(96, 48, 160)", borderRadius: "50%", marginLeft: "auto", marginTop: -3 }} />
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Welcome back</h1>
            <p className="text-muted-foreground text-sm mt-1.5">Sign in to your Iruka Motors account</p>
          </div>

          <LoginForm />

        </div>
      </div>
    </main>
  );
}
