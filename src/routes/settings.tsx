import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Settings — EduSim" },
      { name: "description", content: "Customize appearance, learning preferences and notifications." },
    ],
  }),
});

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border/40 last:border-0">
      <div className="text-sm">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn(!on)}
      className={cn(
        "relative h-6 w-11 rounded-full transition-all",
        on ? "bg-gradient-to-r from-indigo-glow to-purple-glow" : "bg-white/10",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
          on ? "left-[22px]" : "left-0.5",
        )}
      />
    </button>
  );
}

function Pills({ options, defaultValue }: { options: string[]; defaultValue?: string }) {
  const [val, setVal] = useState(defaultValue ?? options[0]);
  return (
    <div className="flex gap-1 rounded-lg border border-border/60 bg-surface/40 p-1">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => setVal(o)}
          className={cn(
            "px-3 py-1 text-xs rounded-md transition",
            val === o ? "bg-indigo-glow/20 text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glow-card p-5">
      <h2 className="font-semibold font-display mb-2">{title}</h2>
      <div>{children}</div>
    </div>
  );
}

function SettingsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl flex flex-col gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Make EduSim yours.</p>
        </div>

        <Section title="Appearance">
          <Row label="Theme">
            <Pills options={["Dark", "Light", "System"]} />
          </Row>
          <Row label="Font size">
            <Pills options={["Small", "Medium", "Large"]} defaultValue="Medium" />
          </Row>
          <Row label="Sidebar">
            <Pills options={["Always visible", "Auto-collapse"]} />
          </Row>
        </Section>

        <Section title="Learning Preferences">
          <Row label="Default class">
            <select className="rounded-lg border border-border/60 bg-surface/40 px-3 py-1.5 text-sm">
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i}>Class {i + 1}</option>
              ))}
            </select>
          </Row>
          <Row label="AI explanation style">
            <Pills options={["Simple", "Detailed", "Technical"]} defaultValue="Detailed" />
          </Row>
          <Row label="Quiz difficulty">
            <Pills options={["Easy", "Mixed", "Hard"]} defaultValue="Mixed" />
          </Row>
        </Section>

        <Section title="Notifications">
          <Row label="Daily learning reminder"><Toggle defaultOn /></Row>
          <Row label="Streak alerts"><Toggle defaultOn /></Row>
          <Row label="New badge unlocked"><Toggle defaultOn /></Row>
          <Row label="Leaderboard updates"><Toggle /></Row>
        </Section>

        <Section title="Data & Privacy">
          <Row label="Clear simulation history">
            <button className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
              Clear
            </button>
          </Row>
          <Row label="Export my data">
            <button className="rounded-lg border border-border-glow bg-white/5 px-3 py-1.5 text-xs">
              Export
            </button>
          </Row>
          <Row label="Reset all preferences">
            <button className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
              Reset
            </button>
          </Row>
        </Section>
      </div>
    </AppShell>
  );
}
