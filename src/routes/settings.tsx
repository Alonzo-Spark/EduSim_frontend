import { createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/Card";
import { Moon, Bell, Shield, User, LogOut, Globe, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="glass-strong rounded-3xl p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account preferences and platform experience.
          </p>
        </div>

        <div className="glass-strong rounded-3xl overflow-hidden border border-border">
          <div className="p-6 space-y-8">
            {/* Account Section */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <User className="w-4 h-4" /> Account Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive weekly progress reports</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Public Profile</p>
                    <p className="text-xs text-muted-foreground">Allow others to see your simulations</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </section>

            <Separator className="bg-border" />

            {/* Appearance Section */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-accent flex items-center gap-2">
                <Moon className="w-4 h-4" /> Appearance
              </h3>
              <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10 text-accent">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Futuristic Mode</p>
                    <p className="text-xs text-muted-foreground">Enable advanced glow and blur effects</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </section>

            <Separator className="bg-border" />

            {/* Privacy Section */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Shield className="w-4 h-4" /> Privacy & Security
              </h3>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-between rounded-xl hover:bg-secondary text-foreground h-12 border border-transparent hover:border-border">
                  <span className="text-sm">Change Password</span>
                  <Globe className="w-4 h-4 opacity-40" />
                </Button>
                <Button variant="ghost" className="w-full justify-between rounded-xl hover:bg-secondary text-foreground h-12 border border-transparent hover:border-border">
                  <span className="text-sm">Two-Factor Authentication</span>
                  <Bell className="w-4 h-4 opacity-40" />
                </Button>
              </div>
            </section>
          </div>

          <div className="bg-destructive/5 p-6 border-t border-destructive/20 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-red-400">Danger Zone</p>
              <p className="text-xs text-red-400/60">Once you delete your account, there is no going back.</p>
            </div>
            <Button variant="destructive" className="rounded-xl px-6">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            EduSim v2.4.0 • Science Edition
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}
