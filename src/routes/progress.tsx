import { createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/Card";
import { AnalyticsCard } from "@/components/analytics/AnalyticsCard";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { BookOpen, Rocket, Star, Clock, Trophy, Target } from "lucide-react";
import { MOCK_ANALYTICS } from "@/data/mockData";

export const Route = createFileRoute("/progress")({
  component: ProgressPage,
});

function ProgressPage() {
  const data = MOCK_ANALYTICS;

  const chartData = data.activityData.map((val, i) => ({
    name: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
    value: val,
  }));

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="glass-strong rounded-3xl p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">Learning Progress</h1>
          <p className="text-sm text-muted-foreground">
            Track your scientific journey and simulation milestones.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnalyticsCard 
            title="Simulations Generated" 
            value={data.totalSimulations} 
            icon={Rocket} 
            trend="+12%" 
            trendUp={true} 
            color="purple" 
          />
          <AnalyticsCard 
            title="Learning Hours" 
            value={data.timeSpent} 
            icon={Clock} 
            trend="+2.5h" 
            trendUp={true} 
            color="blue" 
          />
          <AnalyticsCard 
            title="Concepts Mastered" 
            value={data.conceptsMastered} 
            icon={Target} 
            trend="+5" 
            trendUp={true} 
            color="cyan" 
          />
          <AnalyticsCard 
            title="Weekly Streak" 
            value={`${data.weeklyStreak} Days`} 
            icon={Trophy} 
            trend="New High!" 
            trendUp={true} 
            color="purple" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-strong rounded-3xl p-6">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-[var(--neon-purple)]" />
              Weekly Activity
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--muted-foreground)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="var(--muted-foreground)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}`} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "var(--popover)", 
                      border: "1px solid var(--border)", 
                      borderRadius: "12px",
                      color: "var(--popover-foreground)"
                    }}
                    itemStyle={{ color: "var(--primary)" }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="var(--primary)" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-strong rounded-3xl p-6">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent" />
              Subject Distribution
            </h3>
            <div className="h-64 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.subjectDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="percentage"
                  >
                    {data.subjectDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`var(--chart-${index + 1})`} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "var(--popover)", 
                      border: "1px solid var(--border)", 
                      borderRadius: "12px",
                      color: "var(--popover-foreground)"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-32 space-y-3">
                {data.subjectDistribution.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `var(--chart-${i + 1})` }} />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-foreground leading-none">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground">{s.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-strong rounded-3xl p-6">
          <h3 className="text-lg font-bold mb-6">Recent Activity Log</h3>
          <div className="space-y-4">
            {[
              { action: "Generated 'Projectile Motion'", date: "2 hours ago", type: "simulation" },
              { action: "Mastered 'Newton's Second Law'", date: "Yesterday", type: "concept" },
              { action: "Studied 'Universal Gravitation'", date: "Oct 24, 2023", type: "tutor" },
            ].map((log, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 border border-border hover:border-primary/20 transition-colors">
                <div className={`p-2 rounded-xl bg-secondary ${
                  log.type === 'simulation' ? 'text-primary' : 
                  log.type === 'concept' ? 'text-accent' : 
                  'text-primary'
                }`}>
                  {log.type === 'simulation' ? <Rocket className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{log.action}</p>
                  <p className="text-xs text-muted-foreground">{log.date}</p>
                </div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground bg-secondary px-2 py-1 rounded">
                  {log.type}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

function BarChart2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20V14" />
    </svg>
  );
}
