import { Activity } from "lucide-react";
import { C } from "../theme";

export function AuthShell({ title, subtitle, error, children, footer }) {
  return (
    <div style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 20, boxSizing: "border-box" }}>
      <div style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", background: C.roxo, opacity: 0.22, filter: "blur(120px)", top: -140, left: -140, pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 380, height: 380, borderRadius: "50%", background: C.roxoMed, opacity: 0.16, filter: "blur(120px)", bottom: -120, right: -120, pointerEvents: "none" }} />

      <div
        className="fade-in"
        style={{
          position: "relative",
          background: "rgba(27,27,36,0.78)",
          backdropFilter: "blur(18px)",
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          padding: "44px 38px",
          width: "100%",
          maxWidth: 400,
          textAlign: "center",
          boxShadow: "0 30px 70px -25px rgba(0,0,0,0.65), 0 0 0 1px rgba(139,92,246,0.06)",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            margin: "0 auto 18px",
            background: `linear-gradient(135deg, ${C.roxo}, ${C.roxoMed})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 10px 26px -8px ${C.roxoMed}`,
          }}
        >
          <Activity size={26} color="#fff" strokeWidth={2.4} />
        </div>

        <h1 style={{ color: C.branco, marginBottom: 4, fontSize: 24, fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: "-0.02em" }}>
          {title}
        </h1>
        <p style={{ color: C.cinza, marginBottom: 26, fontSize: 13 }}>{subtitle}</p>

        {error && (
          <div
            style={{
              padding: "10px 12px",
              marginBottom: 16,
              borderRadius: 10,
              background: "rgba(244,63,94,0.10)",
              border: `1px solid rgba(244,63,94,0.35)`,
              color: C.vermelho,
              fontSize: 13,
              textAlign: "left",
            }}
          >
            {error}
          </div>
        )}

        {children}

        <div style={{ fontSize: 13, color: C.cinza, marginTop: 6 }}>{footer}</div>
      </div>
    </div>
  );
}

const focusRing = "focus:border-[#8B5CF6] focus:ring-[3px] focus:ring-[#8B5CF633] outline-none";

export function AuthInput({ icon: Icon, style, ...props }) {
  return (
    <div style={{ position: "relative", marginBottom: 14 }}>
      {Icon && (
        <Icon
          size={16}
          color={C.cinza}
          style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
        />
      )}
      <input
        {...props}
        className={`w-full text-sm transition-all duration-150 ${focusRing}`}
        style={{
          padding: Icon ? "12px 14px 12px 40px" : "12px 14px",
          borderRadius: 10,
          border: `1px solid ${C.border}`,
          background: C.panel2,
          color: C.branco,
          fontSize: 14,
          boxSizing: "border-box",
          width: "100%",
          ...style,
        }}
      />
    </div>
  );
}

export function AuthButton({ children, loading, ...props }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className="w-full text-[15px] font-bold hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_-8px_#8B5CF6] disabled:hover:translate-y-0 disabled:hover:shadow-none"
      style={{
        padding: "13px 14px",
        borderRadius: 10,
        border: "none",
        background: `linear-gradient(135deg, ${C.roxo}, ${C.roxoMed})`,
        color: "#fff",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
        marginBottom: 16,
        marginTop: 4,
      }}
    >
      {children}
    </button>
  );
}
