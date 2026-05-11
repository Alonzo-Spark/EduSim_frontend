import { createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/Card";
import { User, Mail, Calendar, Settings2, Shield, Camera, Rocket, GraduationCap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const user = {
    name: "Alex Johnson",
    email: "alex.johnson@science.edu",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop",
    joined: "Oct 2023",
    stats: {
      sims: 42,
      concepts: 128,
      hours: 56
    }
  };

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="glass-strong rounded-[2.5rem] p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--neon-purple)]/20 to-[var(--neon-blue)]/20 blur-3xl -z-10" />
          
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
              <Avatar className="w-32 h-32 border-4 border-border shadow-2xl">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-4xl">AJ</AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 p-2 rounded-xl bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold text-foreground mb-2">{user.name}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {user.email}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Joined {user.joined}</span>
                <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> Student Explorer</span>
              </div>
            </div>
            
            <Button variant="secondary" className="rounded-2xl border border-border shadow-sm">
              <Settings2 className="w-4 h-4 mr-2" /> Edit Profile
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Simulations Created", value: user.stats.sims, icon: Rocket, color: "purple" },
            { label: "Concepts Explored", value: user.stats.concepts, icon: GraduationCap, color: "cyan" },
            { label: "Hours Learned", value: user.stats.hours, icon: Clock, color: "blue" },
          ].map((stat, i) => (
            <div key={i} className="glass-strong rounded-3xl p-6 flex items-center gap-6 group hover:border-primary/30 transition-all border border-border">
              <div className={`p-4 rounded-2xl bg-secondary group-hover:scale-110 transition-transform text-[var(--neon-${stat.color})]`}>
                <stat.icon className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-strong rounded-3xl p-6">
            <h3 className="text-lg font-bold mb-6">Favorite Subjects</h3>
            <div className="space-y-4">
              {[
                { name: "Quantum Physics", level: 85, color: "purple" },
                { name: "Organic Chemistry", level: 62, color: "cyan" },
                { name: "Calculus III", level: 45, color: "blue" },
              ].map((s, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground font-medium">{s.name}</span>
                    <span className="text-muted-foreground">{s.level}% Mastery</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-1000" 
                      style={{ 
                        width: `${s.level}%`, 
                        backgroundColor: `var(--neon-${s.color})`,
                        boxShadow: `0 0 10px var(--neon-${s.color})` 
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-strong rounded-3xl p-6">
            <h3 className="text-lg font-bold mb-6">Learning Goals</h3>
            <div className="space-y-4">
              {[
                { goal: "Generate 50 Simulations", current: 42, total: 50 },
                { goal: "Master Thermodynamics", current: 3, total: 10 },
                { goal: "Weekly Streak: 7 Days", current: 5, total: 7 },
              ].map((g, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-secondary border border-border">
                  <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary flex items-center justify-center text-[10px] font-bold text-foreground">
                    {Math.round((g.current / g.total) * 100)}%
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{g.goal}</p>
                    <p className="text-xs text-muted-foreground">{g.current} of {g.total} completed</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
