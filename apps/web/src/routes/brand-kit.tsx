import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Upload, Check, Type as TypeIcon, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/brand-kit")({
  head: () => ({
    meta: [
      { title: "브랜드 킷 — Im PPT Generator" },
      { name: "description", content: "색상·폰트를 지정하면 이후 생성되는 모든 덱에 브랜드가 반영됩니다." },
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
        <h1 className="text-4xl font-bold tracking-tight">브랜드 킷</h1>
        <p className="mt-2 text-muted-foreground">
          한 번 설정하면 이후 AI가 생성하는 모든 덱에 색상·폰트가 반영됩니다.
        </p>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="mb-4 text-lg font-bold">브랜드 PPTX에서 색상 가져오기</h2>
            <label className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary">
              <Upload className="mb-3 h-8 w-8" />
              <span className="text-sm font-medium">브랜드 PPTX 업로드</span>
              <span className="text-xs">테마 색상을 자동 추출합니다 (.pptx)</span>
              <input type="file" accept=".pptx" className="hidden" data-testid="pptx-upload"
                onChange={async (e) => {
                  const f = e.target.files?.[0]; e.target.value = ''
                  if (!f) return
                  try {
                    const kit = await api.brandKitFromPptx(f)
                    if (kit.colors?.primary) {
                      const idx = PALETTES.findIndex((p) => p.colors[0]?.toLowerCase() === kit.colors?.primary?.toLowerCase())
                      if (idx >= 0) setPalette(idx)
                    }
                    setSaved(true); setTimeout(() => setSaved(false), 3000)
                  } catch { /* ignore */ }
                }} />
            </label>
            {saved && <p className="mt-2 text-xs text-teal">PPTX 색상을 브랜드킷에 적용했습니다</p>}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="mb-4 text-lg font-bold">컬러 팔레트</h2>
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
            <TypeIcon className="h-5 w-5 text-primary" /> 타이포그래피
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              { label: "제목 폰트", value: heading, set: setHeading },
              { label: "본문 폰트", value: body, set: setBody },
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
              Aa — 제목은 {heading}
            </div>
            <p className="mt-3 text-muted-foreground" style={{ fontFamily: body }}>
              다람쥐 헌 쳇바퀴에 타고파. 본문은 {body}로 표시됩니다.
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
