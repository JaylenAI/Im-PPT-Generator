import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Upload, Check, Type as TypeIcon, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/brand-kit")({
  head: () => ({
    meta: [
      { title: "Brand Kit — Sophie's Space" },
      { name: "description", content: "Define your logo, colors, and fonts so every AI deck stays on brand." },
    ],
  }),
  component: BrandKitPage,
});

const PALETTES = [
  { name: "Indigo Studio", colors: ["#4f46e5", "#14b8a6", "#f4f5ff", "#181b3a"] },
  { name: "Midnight", colors: ["#7c6cff", "#4cc9f0", "#0e1230", "#f5f7ff"] },
  { name: "Coral Energy", colors: ["#f96167", "#f9e795", "#241026", "#fff2f4"] },
  { name: "Forest", colors: ["#2c5f2d", "#97bc62", "#f3f6f2", "#1c2b1e"] },
];

const FONTS = ["Space Grotesk", "Inter", "Georgia", "Archivo", "DM Sans"];

function BrandKitPage() {
  const [palette, setPalette] = useState(0);
  const [heading, setHeading] = useState("Space Grotesk");
  const [body, setBody] = useState("Inter");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getBrandKit().then((kit) => {
      if (!kit) return;
      if (kit.fonts?.heading) setHeading(kit.fonts.heading);
      if (kit.fonts?.body) setBody(kit.fonts.body);
      const idx = PALETTES.findIndex((p) => p.colors[0]?.toLowerCase() === kit.colors?.primary?.toLowerCase());
      if (idx >= 0) setPalette(idx);
    }).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const c = PALETTES[palette]!.colors;
      await api.patchBrandKit({
        colors: { primary: c[0], accent: c[1], background: c[2], textPrimary: c[3] },
        fonts: { heading, body },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-10 py-10">
        <h1 className="text-4xl font-bold tracking-tight">Brand Kit</h1>
        <p className="mt-2 text-muted-foreground">
          Set it once — every AI-generated deck inherits your logo, colors, and typography.
        </p>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="mb-4 text-lg font-bold">Logo</h2>
            <div className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary">
              <Upload className="mb-3 h-8 w-8" />
              <span className="text-sm font-medium">Upload your logo</span>
              <span className="text-xs">SVG, PNG (transparent recommended)</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="mb-4 text-lg font-bold">Color Palette</h2>
            <div className="grid grid-cols-2 gap-3">
              {PALETTES.map((p, i) => (
                <button
                  key={p.name}
                  onClick={() => setPalette(i)}
                  className={cn(
                    "rounded-xl border-2 p-3 text-left transition-all",
                    palette === i ? "border-primary shadow-brand" : "border-border hover:border-primary/40",
                  )}
                >
                  <div className="mb-2 flex gap-1">
                    {p.colors.map((c) => (
                      <div key={c} className="h-6 flex-1 rounded-md" style={{ background: c }} />
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium">
                    {p.name}
                    {palette === i && <Check className="h-3.5 w-3.5 text-primary" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <TypeIcon className="h-5 w-5 text-primary" /> Typography
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              { label: "Heading font", value: heading, set: setHeading },
              { label: "Body font", value: body, set: setBody },
            ].map((f) => (
              <div key={f.label}>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">{f.label}</label>
                <select
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  {FONTS.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-border bg-secondary/40 p-8">
            <div className="text-3xl font-bold" style={{ fontFamily: heading }}>
              Aa — {heading} headings
            </div>
            <p className="mt-3 text-muted-foreground" style={{ fontFamily: body }}>
              The quick brown fox jumps over the lazy dog. Body copy set in {body}.
            </p>
          </div>
        </section>

        <div className="mt-8 flex items-center justify-end gap-3">
          {saved && <span className="text-sm text-teal">저장됨 — 다음 생성부터 적용됩니다</span>}
          <button
            onClick={save}
            disabled={saving}
            data-testid="brand-save"
            className="flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-3 text-sm font-semibold text-white shadow-brand transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
            브랜드킷 저장
          </button>
        </div>
      </div>
    </AppShell>
  );
}
