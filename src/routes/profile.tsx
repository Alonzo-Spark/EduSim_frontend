import { createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/Card";
import { Mail, Calendar, Shield, Camera, Edit2, Check, X, Moon, Sliders, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/useAuthStore";
import { useRef, useState, useEffect } from "react";
import { fetchJsonWithRetry } from "@/services/apiClient";
import { getApiUrl } from "@/config/api";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user: authUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState("");
  
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [settings, setSettings] = useState<Record<string, boolean>>({
    email_notifications: true,
    public_profile: false,
    futuristic_mode: true,
  });

  const user = {
    name: authUser?.name || "Alex Johnson",
    email: authUser?.email || "alex.johnson@science.edu",
    avatar: authUser?.avatar || "",
    joined: "Oct 2023",
  };

  useEffect(() => {
    if (authUser?.name) {
      setDisplayNameInput(authUser.name);
    }
  }, [authUser?.name]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = useAuthStore.getState().token;
        if (!token) return;

        const response = await fetchJsonWithRetry<{ success: boolean; settings: any[] }>(
          getApiUrl("/api/persistence/settings"),
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.success && response.settings) {
          const loadedSettings: Record<string, boolean> = {
            email_notifications: true,
            public_profile: false,
            futuristic_mode: true,
          };
          response.settings.forEach((item) => {
            const key = item.setting_key;
            if (key in loadedSettings) {
              loadedSettings[key] = typeof item.setting_value === "string"
                ? item.setting_value === "true"
                : !!item.setting_value;
            }
          });
          setSettings(loadedSettings);
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        setIsSettingsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleToggleSetting = async (key: string, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));

    try {
      const token = useAuthStore.getState().token;
      const response = await fetchJsonWithRetry<{ success: boolean }>(
        getApiUrl("/api/persistence/settings"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            key,
            value,
          }),
        }
      );
      if (response.success) {
        toast.success("Settings saved");
      } else {
        toast.error("Failed to save settings");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File rejected: Only image uploads are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File rejected: Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64String = reader.result as string;
      try {
        const token = useAuthStore.getState().token;
        const response = await fetchJsonWithRetry<{ success: boolean; profile: any }>(
          getApiUrl("/api/persistence/profile"),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              avatar: base64String,
            }),
          }
        );

        if (response.success) {
          if (authUser) {
            useAuthStore.setState({
              user: {
                ...authUser,
                avatar: base64String,
              },
            });
          }
          toast.success("Avatar updated successfully!");
        } else {
          toast.error("Failed to update avatar");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to update avatar");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveName = async () => {
    if (!displayNameInput.trim()) {
      toast.warning("Display name cannot be empty");
      return;
    }

    try {
      const token = useAuthStore.getState().token;
      const response = await fetchJsonWithRetry<{ success: boolean; profile: any }>(
        getApiUrl("/api/persistence/profile"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            display_name: displayNameInput.trim(),
          }),
        }
      );

      if (response.success) {
        if (authUser) {
          useAuthStore.setState({
            user: {
              ...authUser,
              name: displayNameInput.trim(),
            },
          });
        }
        setIsEditingName(false);
        toast.success("Profile updated successfully!");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="glass-strong rounded-[2.5rem] p-8 relative overflow-hidden border border-border">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--neon-purple)]/20 to-[var(--neon-blue)]/20 blur-3xl -z-10" />
          
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
              <Avatar className="w-32 h-32 border-4 border-border shadow-2xl animate-fade-in">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-4xl bg-gradient-to-br from-[var(--neon-purple)]/20 to-[var(--neon-blue)]/20 text-foreground font-bold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <button 
                onClick={handleCameraClick}
                className="absolute bottom-0 right-0 p-2 rounded-xl bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform cursor-pointer"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            
            <div className="flex-1 text-center md:text-left w-full">
              {isEditingName ? (
                <div className="flex flex-col sm:flex-row items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    className="text-2xl font-bold bg-background border border-border rounded-xl px-3 py-1.5 outline-none focus:border-primary text-foreground w-full max-w-sm"
                    maxLength={50}
                    autoFocus
                  />
                  <div className="flex gap-2 shrink-0">
                    <Button onClick={handleSaveName} size="icon" className="rounded-xl h-10 w-10">
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button onClick={() => { setIsEditingName(false); setDisplayNameInput(user.name); }} variant="outline" size="icon" className="rounded-xl h-10 w-10">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 justify-center md:justify-start mb-2">
                  <h1 className="text-4xl font-bold text-foreground">{user.name}</h1>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsEditingName(true)} 
                    className="rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground h-8 w-8"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {user.email}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Joined {user.joined}</span>
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> 
                  {authUser?.role ? authUser.role.charAt(0).toUpperCase() + authUser.role.slice(1) : "Student"} Explorer
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-strong rounded-3xl overflow-hidden border border-border">
          <div className="px-6 py-4 border-b border-border bg-secondary/20">
            <h2 className="text-xl font-bold text-gradient">Preferences & Settings</h2>
          </div>
          
          {isSettingsLoading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
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
                    <Switch 
                      checked={settings.email_notifications} 
                      onCheckedChange={(checked) => handleToggleSetting("email_notifications", checked)} 
                    />
                  </div>
                  <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Public Profile</p>
                      <p className="text-xs text-muted-foreground">Allow others to see your simulations</p>
                    </div>
                    <Switch 
                      checked={settings.public_profile} 
                      onCheckedChange={(checked) => handleToggleSetting("public_profile", checked)} 
                    />
                  </div>
                </div>
              </section>

              <Separator className="bg-border" />

              {/* Appearance Section */}
              <section className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <Moon className="w-4 h-4" /> Appearance
                </h3>
                <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Futuristic Mode</p>
                      <p className="text-xs text-muted-foreground">Enable advanced glow and blur effects</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.futuristic_mode} 
                    onCheckedChange={(checked) => handleToggleSetting("futuristic_mode", checked)} 
                  />
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

