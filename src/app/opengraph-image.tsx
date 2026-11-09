import { ImageResponse } from "next/og";

export const alt = "Executive Global Nanny — Nanny and Childcare Services";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          color: "#ffffff",
          background: "linear-gradient(135deg, #073b45 0%, #0b5360 65%, #e87c32 160%)",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 28, fontWeight: 700 }}>
          <div style={{ display: "flex", width: 60, height: 60, alignItems: "center", justifyContent: "center", borderRadius: 16, color: "#073b45", background: "#ff974d", fontSize: 27 }}>EGN</div>
          Executive Global Nanny
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ color: "#ffb47d", fontSize: 22, fontWeight: 700, letterSpacing: 4 }}>NEW JERSEY FIRST · AVAILABLE NATIONWIDE</div>
          <div style={{ maxWidth: 1000, fontSize: 64, fontWeight: 800, lineHeight: 1.08 }}>Nanny and childcare services for your family</div>
          <div style={{ fontSize: 27, color: "#d8edf0" }}>Nanny placement · Babysitting · Backup care</div>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#d8edf0" }}>Based in Branchburg, New Jersey · executiveglobalnannyusa.com</div>
      </div>
    ),
    { ...size },
  );
}
