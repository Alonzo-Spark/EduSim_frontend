import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo } from "react";
import {
  FlaskConical,
  Bookmark,
  RotateCcw,
  Trash2,
  Plus,
  Filter,
  Play,
  Pause,
  SkipForward,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  LineChart as LineIcon,
  BookOpen,
  HelpCircle,
  Lightbulb,
  Save,
  ChevronsUpDown,
  Clock,
  Activity,
  Layout,
  FileCheck2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";
import { InlineMath, BlockMath } from "react-katex";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
} from "recharts";
import { CURRICULUM } from "@/data/curriculum";

export const Route = createFileRoute("/simulations")({
  component: SimulationsWorkspacePage,
  head: () => ({
    meta: [
      { title: "Dynamic Laboratory Workspace — EduSim" },
      {
        name: "description",
        content:
          "AI-powered interactive laboratory workspace featuring physics animation loops, math coordinate systems, and biology zooms.",
      },
    ],
  }),
});

// Custom Types for Simulation Schema
interface SimParameter {
  name: string;
  label: string;
  min: number;
  max: number;
  default: number;
  unit: string;
  step: number;
  description: string;
}

interface SimFormula {
  name: string;
  latex: string;
  desc: string;
}

interface SimStep {
  step_number: number;
  title: string;
  instructions: string;
  target_task: string;
}

interface SimQuiz {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface SimulationConfig {
  simulation_type:
    | "projectile_motion"
    | "newtons_laws"
    | "friction"
    | "gravitation"
    | "work_energy"
    | "electricity_circuit"
    | "wave"
    | "optics"
    | "graph_plotting"
    | "trigonometry"
    | "cell_structure"
    | "photosynthesis"
    | "respiration"
    | "custom";
  title: string;
  description: string;
  parameters: SimParameter[];
  formulas: SimFormula[];
  controls: string[];
  visualization: {
    width: number;
    height: number;
    background: string;
    gridLines: boolean;
    scale: number;
  };
  steps: SimStep[];
  quiz_questions: SimQuiz[];
}

interface SavedSimulation {
  id: string;
  title: string;
  subject: string;
  className: string;
  chapter: string;
  topic: string;
  createdAt: string;
  accent: "indigo" | "cyan" | "purple" | "amber" | "emerald";
  config: SimulationConfig;
}

function SimulationsWorkspacePage() {
  const [tab, setTab] = useState("All");
  const [filterSubject, setFilterSubject] = useState("All");
  const [savedSims, setSavedSims] = useState<SavedSimulation[]>([]);
  const [activeSim, setActiveSim] = useState<SavedSimulation | null>(null);
  const curriculumSubjects = Array.from(new Set(CURRICULUM.flatMap((schoolClass) => schoolClass.subjects.map((subject) => subject.name))));

  // Load simulations from mock-data and localStorage
  useEffect(() => {
    // High-Fidelity Pre-configured RAG Simulation Models for major NCERT topics
    const defaultLabs: SavedSimulation[] = [
      {
        id: "lab-projectile",
        title: "Projectile Flight Vector Sandbox",
        subject: "Physics",
        className: "Class 9",
        chapter: "Motion in a Plane",
        topic: "Projectile Motion",
        createdAt: "2 hours ago",
        accent: "indigo",
        config: {
          simulation_type: "projectile_motion",
          title: "Horizontal Projectile Kinematics",
          description: "Observe horizontal and vertical velocity components under constant gravitational acceleration.",
          parameters: [
            { name: "velocity", label: "Initial Velocity", min: 10, max: 60, default: 30, unit: "m/s", step: 1, description: "Launch speed vector" },
            { name: "angle", label: "Launch Angle", min: 15, max: 80, default: 45, unit: "°", step: 1, description: "Launch elevation relative to base" },
            { name: "gravity", label: "Gravity Level (g)", min: 1.6, max: 25.8, default: 9.8, unit: "m/s²", step: 0.1, description: "Planetary pull" }
          ],
          formulas: [
            { name: "Range Equation", latex: "R = \\frac{u^2 \\sin(2\\theta)}{g}", desc: "Determines total horizontal coverage displacement." },
            { name: "Time of Flight", latex: "T = \\frac{2u \\sin(\\theta)}{g}", desc: "Total airborne path time." }
          ],
          controls: ["play", "pause", "reset", "step", "zoom"],
          visualization: { width: 800, height: 480, background: "#0b0f1e", gridLines: true, scale: 6.5 },
          steps: [
            { step_number: 1, title: "Find Optimal Coverage", instructions: "Slide gravity to 9.8 m/s² and angle to 45°. Play the simulation.", target_task: "Observe maximal range profile." },
            { step_number: 2, title: "Simulate Lunar Mechanics", instructions: "Lower gravity to 1.6 m/s² (Moon level) and check trajectory heights.", target_task: "Record flight times exceeding 10 seconds." }
          ],
          quiz_questions: [
            {
              question: "At what elevation angle is horizontal displacement minimized (excluding vertical firing)?",
              options: ["30° elevation", "45° optimal", "15° shallow", "75° steep"],
              correctIndex: 2,
              explanation: "Shallow angles hit the ground extremely quickly, minimizing total flight coverage distance."
            }
          ]
        }
      },
      {
        id: "lab-friction",
        title: "Newton's Sliding Block & Friction",
        subject: "Physics",
        className: "Class 9",
        chapter: "Force and Laws of Motion",
        topic: "Newton's Laws",
        createdAt: "Yesterday",
        accent: "cyan",
        config: {
          simulation_type: "friction",
          title: "Friction Vectors & Accelerations",
          description: "Explore the balance between applied forces and opposing static/kinetic friction coefficients.",
          parameters: [
            { name: "appliedForce", label: "Applied Pulling Force", min: 10, max: 200, default: 80, unit: "N", step: 2, description: "Rightward pulling force" },
            { name: "mass", label: "Block Mass", min: 5, max: 50, default: 20, unit: "kg", step: 1, description: "Mass of block block" },
            { name: "frictionCoeff", label: "Friction Coefficient (μ)", min: 0.1, max: 0.8, default: 0.3, unit: "coeff", step: 0.05, description: "Surface roughness" }
          ],
          formulas: [
            { name: "Frictional Threshold", latex: "f_k = \\mu_k N = \\mu_k m g", desc: "Opposing force of sliding surface roughness." },
            { name: "Acceleration Equation", latex: "a = \\frac{F_{app} - f_k}{m}", desc: "Net Newtonian block acceleration rate." }
          ],
          controls: ["play", "pause", "reset"],
          visualization: { width: 800, height: 480, background: "#0b0f1e", gridLines: true, scale: 8 },
          steps: [
            { step_number: 1, title: "Overcome Roughness", instructions: "Slide Applied Force until the block begins to accelerate. Note friction.", target_task: "Observe block movement." }
          ],
          quiz_questions: [
            {
              question: "If mass doubles while coefficient stays constant, friction force:",
              options: ["Reduces by half", "Doubles", "Remains identical", "Quadruples"],
              correctIndex: 1,
              explanation: "Friction force is directly proportional to normal force ($N = m g$). Doubling mass doubles friction."
            }
          ]
        }
      },
      {
        id: "lab-circuit",
        title: "DC Ohm's Law Circuit loop",
        subject: "Physics",
        className: "Class 10",
        chapter: "Electricity",
        topic: "Electricity",
        createdAt: "3 days ago",
        accent: "purple",
        config: {
          simulation_type: "electricity_circuit",
          title: "Ohm's Law Wiring Schematic",
          description: "Observe electron flows and glowing filament lightbulbs in dynamic active DC circuits.",
          parameters: [
            { name: "voltage", label: "DC Battery Voltage (V)", min: 2, max: 24, default: 12, unit: "V", step: 0.5, description: "Electrical potential push" },
            { name: "resistance", label: "Resistor Load (R)", min: 1, max: 20, default: 4, unit: "Ω", step: 0.5, description: "Flow bottleneck resistance" }
          ],
          formulas: [
            { name: "Ohm's Relation", latex: "I = \\frac{V}{R}", desc: "Calculates total circuit current in Amperes." },
            { name: "Bulb Heat Power", latex: "P = I^2 R = V I", desc: "Filament lighting dissipation rate in Watts." }
          ],
          controls: ["play", "pause", "reset"],
          visualization: { width: 800, height: 480, background: "#0c0a1a", gridLines: false, scale: 50 },
          steps: [
            { step_number: 1, title: "Max Current Flow", instructions: "Set voltage to maximum (24V) and resistance to minimum (1 Ohm). Observe flow.", target_task: "Verify current spikes to 24 Amps." }
          ],
          quiz_questions: [
            {
              question: "If voltage stays constant while resistor load is cut in half, circuit current:",
              options: ["Doubles", "Reduces by half", "Quadruples", "Stays constant"],
              correctIndex: 0,
              explanation: "Since I = V/R, dividing resistance by 2 doubles the resulting electron current flow."
            }
          ]
        }
      },
      {
        id: "lab-energy",
        title: "Work & Energy Rollercoaster Conservation",
        subject: "Physics",
        className: "Class 9",
        chapter: "Work and Energy",
        topic: "Work & Energy",
        createdAt: "5 days ago",
        accent: "amber",
        config: {
          simulation_type: "work_energy",
          title: "Total Mechanical Conservation",
          description: "Slide a coaster cart along slopes to visualize Kinetic Energy (KE) and Potential Energy (PE) conservation profiles.",
          parameters: [
            { name: "cartMass", label: "Coaster Mass", min: 100, max: 1000, default: 500, unit: "kg", step: 50, description: "Cart inertia mass" },
            { name: "hillHeight", label: "Starting Hill Height", min: 5, max: 25, default: 20, unit: "m", step: 1, description: "Starting lift elevation" }
          ],
          formulas: [
            { name: "Potential Energy", latex: "E_p = m g h", desc: "Gravitational potential stored energy." },
            { name: "Kinetic Velocity", latex: "E_k = \\frac{1}{2} m v^2", desc: "Energy of active motion." }
          ],
          controls: ["play", "pause", "reset"],
          visualization: { width: 800, height: 480, background: "#0b0f1e", gridLines: true, scale: 15 },
          steps: [
            { step_number: 1, title: "Observe Conservation", instructions: "Start coaster slide. Note how Kinetic spikes at the bottom while Potential dips.", target_task: "Check total mechanical sum constancy." }
          ],
          quiz_questions: [
            {
              question: "At what point in a track path is Kinetic Energy exactly equal to zero?",
              options: ["Absolute lowest trough", "Halfway down hill", "Highest peak starting tip", "During landing breaks"],
              correctIndex: 2,
              explanation: "At the peak, velocity is zero, meaning KE = 0, and all energy is stored as potential gravitational energy ($m g h$)."
            }
          ]
        }
      },
      {
        id: "lab-trig",
        title: "Trigonometric Unit Wave Circle",
        subject: "Math",
        className: "Class 10",
        chapter: "Trigonometry",
        topic: "Trigonometry",
        createdAt: "1 week ago",
        accent: "emerald",
        config: {
          simulation_type: "trigonometry",
          title: "Sin / Cos Vector Projections",
          description: "Visualize unit circles, amplitude heights, and real-time sine/cosine wave projection lines.",
          parameters: [
            { name: "amplitude", label: "Wave Amplitude (A)", min: 20, max: 100, default: 60, unit: "px", step: 2, description: "Radius of rotation" },
            { name: "frequency", label: "Wave Frequency (f)", min: 1, max: 8, default: 3, unit: "Hz", step: 0.5, description: "Rotation rate per frame" }
          ],
          formulas: [
            { name: "Sine Coordinate", latex: "y = A \\sin(\\omega t)", desc: "Vertical height vector displacement." },
            { name: "Cosine Coordinate", latex: "x = A \\cos(\\omega t)", desc: "Horizontal projection width vector." }
          ],
          controls: ["play", "pause", "reset"],
          visualization: { width: 800, height: 480, background: "#0b0c15", gridLines: true, scale: 1 },
          steps: [
            { step_number: 1, title: "Frequencies impact", instructions: "Increase wave frequency to 8Hz and watch the plotted wavelength shrink.", target_task: "Notice density spikes in lines." }
          ],
          quiz_questions: [
            {
              question: "When the rotating circle vector points straight upward (90 degrees), Cosine component is:",
              options: ["Maximum positive", "Zero", "Maximum negative", "Half of radius"],
              correctIndex: 1,
              explanation: "At 90°, cos(90°) = 0, so the horizontal projection vector drops to exactly zero width."
            }
          ]
        }
      }
    ];

    const saved = localStorage.getItem("edusim:saved-simulations");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          setSavedSims(parsed);
        } else {
          setSavedSims(defaultLabs);
        }
      } catch {
        setSavedSims(defaultLabs);
      }
    } else {
      setSavedSims(defaultLabs);
    }
  }, []);

  const handleLaunch = (sim: SavedSimulation) => {
    setActiveSim(sim);
  };

  const filtered = savedSims.filter(
    (s) => filterSubject === "All" || s.subject === filterSubject,
  );

  return (
    <AppShell>
      {activeSim ? (
        // ==============================================
        // ACTIVE INTERACTIVE STUDIO VIEW
        // ==============================================
        <ActiveLaboratoryStudio
          sim={activeSim}
          onClose={() => setActiveSim(null)}
        />
      ) : (
        // ==============================================
        // STANDARD CATALOG VIEW
        // ==============================================
        <div className="mx-auto max-w-7xl flex flex-col gap-6 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display flex items-center gap-2">
                <FlaskConical className="h-7 w-7 text-indigo-glow animate-float-slow" /> Interactive Laboratory Workspace
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Run dynamic physics loops, mathematical coordinate visualizers, and biological process models.
              </p>
            </div>
            <Link
              to="/tutor"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-glow to-purple-glow px-4 py-2.5 text-sm font-semibold text-white shadow-glow-indigo hover:opacity-90 transition"
            >
              <Plus className="h-4 w-4" /> Ask Tutor for New Lab
            </Link>
          </div>

          {/* Gamified Workspace stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
            {[
              { label: "Active Laboratories", value: savedSims.length },
              { label: "Experiment Checkpoints Aced", value: "9 / 12" },
              { label: "Simulation Subjects", value: 3 },
              { label: "Total Physics Hours", value: "14.2 hrs" },
            ].map((s, i) => (
              <div key={i} className="glow-card p-4 bg-surface/50 border border-border/80">
                <div className="text-2xl font-bold font-display text-indigo-glow">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Subjects and filter controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 rounded-xl border border-border/60 bg-surface/60 p-1 shrink-0">
              {["All", "Recent Labs"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-lg transition",
                    tab === t ? "bg-indigo-glow/20 text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            
            <div className="ml-auto flex items-center gap-2 overflow-x-auto scrollbar-none pr-1">
              <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              {(["All", ...curriculumSubjects]).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterSubject(s)}
                  className={cn(
                    "px-3 py-1 text-xs rounded-full border transition shrink-0",
                    filterSubject === s
                      ? "border-cyan-glow bg-cyan-glow/10 text-cyan-glow"
                      : "border-border/80 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Grid Layout mapping cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((s) => (
              <div key={s.id} className="glow-card p-5 flex flex-col justify-between bg-surface/40 hover:scale-[1.02] duration-300">
                <div>
                  {/* Cosmic Preview Graphic Box */}
                  <div className="relative h-32 rounded-xl overflow-hidden mb-3 border border-border/60 bg-background/60">
                    <div
                      className={cn(
                        "absolute inset-0 opacity-40 bg-gradient-to-br",
                        s.accent === "indigo" && "from-indigo-glow/40 to-purple-glow/10",
                        s.accent === "cyan" && "from-cyan-glow/40 to-indigo-glow/10",
                        s.accent === "purple" && "from-purple-glow/40 to-cyan-glow/10",
                        s.accent === "amber" && "from-amber-glow/40 to-purple-glow/10",
                        s.accent === "emerald" && "from-emerald-glow/40 to-cyan-glow/10",
                      )}
                    />
                    <FlaskConical className="absolute right-3 top-3 h-5 w-5 text-indigo-glow/60" />
                    
                    <div className="absolute inset-0 grid place-items-center">
                      <span className="text-4xl opacity-50 animate-float-slow">⚛︎</span>
                    </div>
                  </div>

                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {s.className} · {s.subject}
                  </div>
                  <h3 className="font-bold text-foreground font-display mt-0.5">{s.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {s.config.description}
                  </p>
                </div>

                <div className="mt-5 flex gap-2">
                  <button
                    onClick={() => handleLaunch(s)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-glow to-purple-glow text-white px-3 py-2 text-xs font-semibold shadow-glow-indigo hover:opacity-90 transition"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Launch Active Lab
                  </button>
                  <button className="grid h-9 w-9 place-items-center rounded-xl border border-border/80 bg-white/5 hover:bg-white/10 transition">
                    <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}

// ==========================================================
// ACTIVE HIGH-FIDELITY SIMULATION LABORATORY WORKBENCH HUD
// ==========================================================
interface LabStudioProps {
  sim: SavedSimulation;
  onClose: () => void;
}

function ActiveLaboratoryStudio({ sim, onClose }: LabStudioProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Custom Dynamic State initialized from AI Schema parameters
  const [params, setParams] = useState<Record<string, number>>(() => {
    const defaults: Record<string, number> = {};
    sim.config.parameters.forEach((p) => {
      defaults[p.name] = p.default;
    });
    return defaults;
  });

  // Timeline Player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeStep, setTimeStep] = useState(0.016);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(sim.config.visualization.gridLines);
  
  // Guided Checklist tasks tracking
  const [tasksDone, setTasksDone] = useState<boolean[]>(
    new Array(sim.config.steps.length).fill(false),
  );

  // Real-time plotting dataset hooks
  const [graphData, setGraphData] = useState<Array<{ time: string; value1: number; value2: number }>>([]);
  const runningTimeRef = useRef(0);
  const rafRef = useRef<number>(0);
  const stateRef = useRef({ time: 0, x: 0, y: 0, vx: 0, vy: 0, blockX: 0, blockV: 0, angleOrbit: 0 });

  // Quiz evaluation state
  const [selectedAns, setSelectedAns] = useState<number | null>(null);

  // Update dynamic params safely
  const setParamValue = (name: string, value: number) => {
    setParams((prev) => ({ ...prev, [name]: value }));
  };

  // Reset Physics states
  const handleReset = () => {
    setIsPlaying(false);
    runningTimeRef.current = 0;
    setGraphData([]);
    stateRef.current = { time: 0, x: 0, y: 0, vx: 0, vy: 0, blockX: 0, blockV: 0, angleOrbit: 0 };
  };

  // Guided checklist checker function evaluated in real-time
  useEffect(() => {
    const checks = sim.config.steps.map((st) => {
      if (sim.config.simulation_type === "projectile_motion") {
        if (st.step_number === 1) {
          return params["angle"] === 45 && params["gravity"] === 9.8;
        }
        if (st.step_number === 2) {
          return params["gravity"] === 1.6;
        }
      }
      if (sim.config.simulation_type === "friction") {
        return params["appliedForce"] > params["mass"] * 9.8 * params["frictionCoeff"];
      }
      if (sim.config.simulation_type === "electricity_circuit") {
        return params["voltage"] === 24 && params["resistance"] === 1;
      }
      return false;
    });
    setTasksDone(checks);
  }, [params, sim.config.simulation_type]);

  // Main high-performance Animation physics engine loop
  useEffect(() => {
    const animate = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // 1. Draw Lab Neon Grid
      if (showGrid) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, H);
          ctx.stroke();
        }
        for (let y = 0; y < H; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(W, y);
          ctx.stroke();
        }
      }

      // 2. Select Specialized Physics Solver Scene based on Simulation Type
      const type = sim.config.simulation_type;

      // ==========================================
      // PROJECTILE PHYSICS CANVAS
      // ==========================================
      if (type === "projectile_motion") {
        const speed = params["velocity"];
        const angle = params["angle"];
        const g = params["gravity"] ?? 9.8;

        const rad = (angle * Math.PI) / 180;
        const ux = speed * Math.cos(rad);
        const uy = speed * Math.sin(rad);
        const flightTime = (2 * uy) / g;
        
        const scaleFactor = sim.config.visualization.scale * zoom;
        const groundY = H - 50;

        // Dashed optimal trajectory pathway
        ctx.beginPath();
        ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        for (let t = 0; t <= flightTime; t += flightTime / 100) {
          const px = 50 + ux * t * scaleFactor;
          const py = groundY - (uy * t - 0.5 * g * t * t) * scaleFactor;
          if (t === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Active projectile positions
        if (isPlaying) {
          runningTimeRef.current += timeStep;
          if (runningTimeRef.current > flightTime) {
            runningTimeRef.current = 0;
          }
        }

        const t = runningTimeRef.current;
        const bx = 50 + ux * t * scaleFactor;
        const by = groundY - (uy * t - 0.5 * g * t * t) * scaleFactor;

        // Render moving glowing mass ball
        ctx.shadowBlur = 20;
        ctx.shadowColor = "rgba(99, 102, 241, 0.9)";
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(bx, by, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw cannon launching base pad
        ctx.fillStyle = "rgba(168, 85, 247, 0.75)";
        ctx.save();
        ctx.translate(50, groundY);
        ctx.rotate(-rad);
        ctx.fillRect(-8, -25, 16, 30);
        ctx.restore();

        // Draw target green flag marker
        const totalR = (speed * speed * Math.sin(2 * rad)) / g;
        const targetX = 50 + totalR * scaleFactor;
        ctx.fillStyle = "rgba(34, 197, 94, 0.8)";
        ctx.fillRect(targetX - 2, groundY - 20, 4, 20);
        ctx.beginPath();
        ctx.moveTo(targetX, groundY - 20);
        ctx.lineTo(targetX + 12, groundY - 15);
        ctx.lineTo(targetX, groundY - 10);
        ctx.fill();

        // Push time-series plots to Graph Panel
        if (isPlaying && Math.random() < 0.25) {
          setGraphData((prev) =>
            [
              ...prev,
              {
                time: t.toFixed(2),
                value1: parseFloat((uy * t - 0.5 * g * t * t).toFixed(1)), // Height
                value2: parseFloat((ux * t).toFixed(1)), // Range
              },
            ].slice(-18),
          );
        }
      }

      // ==========================================
      // NEWTONIAN BLOCK & SURFACE FRICTION CANVAS
      // ==========================================
      else if (type === "friction") {
        const Fapp = params["appliedForce"];
        const mass = params["mass"];
        const mu = params["frictionCoeff"];
        const g = 9.8;

        const maxStatic = mu * mass * g;
        const netForce = Fapp > maxStatic ? Fapp - maxStatic : 0;
        const acc = netForce / mass;

        if (isPlaying) {
          stateRef.current.blockV += acc * 0.05;
          stateRef.current.blockX += stateRef.current.blockV * 0.5;
          if (stateRef.current.blockX > W - 150) {
            stateRef.current.blockX = 50;
            stateRef.current.blockV = 0;
          }
        }

        const bx = 50 + stateRef.current.blockX;
        const by = H / 2;

        // Draw rough ground platform plane
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(40, by + 40, W - 80, 8);

        // Draw sliding sliding mass block
        ctx.fillStyle = "rgba(6, 182, 212, 0.7)";
        ctx.strokeStyle = "rgba(6, 182, 212, 0.9)";
        ctx.lineWidth = 2;
        ctx.fillRect(bx, by - 40, 80, 80);
        ctx.strokeRect(bx, by - 40, 80, 80);

        // Draw force vector indicators (arrows drawn directly on the canvas)
        // 1. Pull force arrow (Rightward)
        ctx.strokeStyle = "#a855f7";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bx + 80, by);
        ctx.lineTo(bx + 140, by);
        ctx.stroke();
        ctx.fillStyle = "#a855f7";
        ctx.beginPath();
        ctx.moveTo(bx + 140, by);
        ctx.lineTo(bx + 130, by - 6);
        ctx.lineTo(bx + 130, by + 6);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "10px sans-serif";
        ctx.fillText(`Applied: ${Fapp}N`, bx + 85, by - 10);

        // 2. Friction opposing arrow (Leftward)
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx - 50, by);
        ctx.stroke();
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.moveTo(bx - 50, by);
        ctx.lineTo(bx - 40, by - 6);
        ctx.lineTo(bx - 40, by + 6);
        ctx.fill();
        ctx.fillText(`Friction: ${maxStatic.toFixed(0)}N`, bx - 70, by + 20);

        if (isPlaying && Math.random() < 0.2) {
          setGraphData((prev) =>
            [
              ...prev,
              {
                time: (runningTimeRef.current += 0.05).toFixed(1),
                value1: parseFloat(stateRef.current.blockV.toFixed(2)), // Velocity
                value2: parseFloat(acc.toFixed(2)), // Acceleration
              },
            ].slice(-18),
          );
        }
      }

      // ==========================================
      // ELECTRIC OHM'S DC CIRCUIT CANVAS
      // ==========================================
      else if (type === "electricity_circuit") {
        const V = params["voltage"];
        const R = params["resistance"];
        const I = V / R;

        const loopX = 150;
        const loopY = 100;
        const loopW = 500;
        const loopH = 260;

        // Draw circuit connector loops wires
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 4;
        ctx.strokeRect(loopX, loopY, loopW, loopH);

        // Render battery cell plates on left wire
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(loopX - 10, loopY + loopH / 2 - 20, 20, 8);
        ctx.fillRect(loopX - 25, loopY + loopH / 2 - 5, 50, 8);
        ctx.fillStyle = "#ffffff";
        ctx.font = "11px monospace";
        ctx.fillText(`V = ${V}V`, loopX + 30, loopY + loopH / 2);

        // Render resistor zig-zag on bottom wire
        ctx.strokeStyle = "#a855f7";
        ctx.lineWidth = 4;
        ctx.beginPath();
        const rx = loopX + loopW / 2;
        const ry = loopY + loopH;
        ctx.moveTo(rx - 40, ry);
        ctx.lineTo(rx - 30, ry - 15);
        ctx.lineTo(rx - 10, ry + 15);
        ctx.lineTo(rx + 10, ry - 15);
        ctx.lineTo(rx + 30, ry + 15);
        ctx.lineTo(rx + 40, ry);
        ctx.stroke();
        ctx.fillText(`R = ${R}Ω`, rx - 20, ry + 30);

        // Render glowing lightbulb on top wire
        const bx = loopX + loopW / 2;
        const by = loopY;
        ctx.beginPath();
        ctx.arc(bx, by, 18, 0, Math.PI * 2);
        const glowRad = Math.min(I * 8, 55);
        const glow = ctx.createRadialGradient(bx, by, 5, bx, by, glowRad);
        glow.addColorStop(0, "rgba(234, 179, 8, 0.95)");
        glow.addColorStop(1, "rgba(234, 179, 8, 0)");
        ctx.fillStyle = glow;
        ctx.fill();
        ctx.strokeStyle = "#eab308";
        ctx.stroke();

        // Draw flowing electron blue bubble dots
        if (isPlaying) {
          stateRef.current.blockX += I * 0.7; // Speed proportional to current
          if (stateRef.current.blockX > 1520) {
            stateRef.current.blockX = 0;
          }
        }

        const dist = stateRef.current.blockX;
        ctx.fillStyle = "#06b6d4";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#06b6d4";
        
        // Draw 6 running electrons separated by loop paths
        for (let i = 0; i < 6; i++) {
          const eDist = (dist + i * 250) % 1520;
          let ex = loopX;
          let ey = loopY;
          if (eDist < loopW) {
            ex = loopX + eDist;
            ey = loopY;
          } else if (eDist < loopW + loopH) {
            ex = loopX + loopW;
            ey = loopY + (eDist - loopW);
          } else if (eDist < loopW * 2 + loopH) {
            ex = loopX + loopW - (eDist - loopW - loopH);
            ey = loopY + loopH;
          } else {
            ex = loopX;
            ey = loopY + loopH - (eDist - loopW * 2 - loopH);
          }
          ctx.beginPath();
          ctx.arc(ex, ey, 5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;

        // Current meter
        ctx.fillStyle = "rgba(6, 182, 212, 0.75)";
        ctx.font = "12px monospace";
        ctx.fillText(`Current: ${I.toFixed(2)} Amps`, W / 2 - 60, H / 2);

        if (isPlaying && Math.random() < 0.15) {
          setGraphData((prev) =>
            [
              ...prev,
              {
                time: (runningTimeRef.current += 0.05).toFixed(1),
                value1: parseFloat(I.toFixed(2)), // Current
                value2: parseFloat((I * V).toFixed(1)), // Power Watts
              },
            ].slice(-18),
          );
        }
      }

      // ==========================================
      // CONSERVATION OF ENERGY ROLLERCOASTER CANVAS
      // ==========================================
      else if (type === "work_energy") {
        const mass = params["cartMass"];
        const startH = params["hillHeight"];
        const g = 9.8;

        const maxEnergy = mass * g * startH;
        
        // Cosine rollercoaster track curve
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.lineWidth = 6;
        for (let x = 50; x < W - 50; x++) {
          const cy = H - 100 - Math.cos((x / (W - 100)) * Math.PI * 2) * 120 - 120;
          if (x === 50) ctx.moveTo(x, cy);
          else ctx.lineTo(x, cy);
        }
        ctx.stroke();

        // Animate coaster slide position
        if (isPlaying) {
          stateRef.current.blockX += 2.5;
          if (stateRef.current.blockX > W - 100) {
            stateRef.current.blockX = 50;
          }
        }

        const cx = stateRef.current.blockX || 50;
        const cy = H - 100 - Math.cos((cx / (W - 100)) * Math.PI * 2) * 120 - 120;
        
        // Potential energy calculations
        const curHeight = (H - 50 - cy) / 15; // Scaled height in meters
        const pe = mass * g * curHeight;
        const ke = Math.max(0, maxEnergy - pe);
        const speed = Math.sqrt((2 * ke) / mass);

        // Draw cart box
        ctx.fillStyle = "rgba(234, 179, 8, 0.85)";
        ctx.fillRect(cx - 10, cy - 8, 20, 16);

        // Render dynamic bar graphs (KE vs PE side-by-side in real-time)
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        ctx.fillRect(W - 160, 30, 120, 110);
        
        ctx.fillStyle = "#ef4444"; // PE Red
        const peHeight = Math.min((pe / maxEnergy) * 90, 90);
        ctx.fillRect(W - 140, 120 - peHeight, 20, peHeight);
        ctx.font = "9px sans-serif";
        ctx.fillText("PE", W - 138, 132);

        ctx.fillStyle = "#22c55e"; // KE Green
        const keHeight = Math.min((ke / maxEnergy) * 90, 90);
        ctx.fillRect(W - 100, 120 - keHeight, 20, keHeight);
        ctx.fillText("KE", W - 98, 132);

        if (isPlaying && Math.random() < 0.2) {
          setGraphData((prev) =>
            [
              ...prev,
              {
                time: cx.toFixed(0),
                value1: parseFloat((pe / 1000).toFixed(0)), // PE (kJ)
                value2: parseFloat((ke / 1000).toFixed(0)), // KE (kJ)
              },
            ].slice(-18),
          );
        }
      }

      // ==========================================
      // TRIGONOMETRIC WAVE PLOTTER CANVAS
      // ==========================================
      else if (type === "trigonometry") {
        const A = params["amplitude"];
        const f = params["frequency"];

        const cx = 150;
        const cy = H / 2;

        // Draw unit circle radius limits
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, A, 0, Math.PI * 2);
        ctx.stroke();

        // Increment rotation offset
        if (isPlaying) {
          stateRef.current.angleOrbit += (f * Math.PI) / 180;
        }

        const theta = stateRef.current.angleOrbit;
        const vx = cx + A * Math.cos(theta);
        const vy = cy - A * Math.sin(theta);

        // Vector projections
        // 1. Rotating radius vector (White)
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(vx, vy);
        ctx.stroke();

        // 2. Sine Projection Vector (Red)
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(vx, cy);
        ctx.lineTo(vx, vy);
        ctx.stroke();
        ctx.fillStyle = "#ef4444";
        ctx.fillText(`Sin: ${(A * Math.sin(theta)).toFixed(0)}`, vx - 20, vy - 10);

        // 3. Cosine Projection Vector (Blue)
        ctx.strokeStyle = "#06b6d4";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(vx, cy);
        ctx.stroke();

        // Render Sine wave generation scrolling on right
        ctx.beginPath();
        ctx.strokeStyle = "rgba(168,85,247,0.7)";
        ctx.lineWidth = 2;
        for (let x = cx + 80; x < W - 50; x++) {
          const deltaX = x - (cx + 80);
          const wy = cy - A * Math.sin(theta - deltaX * 0.05);
          if (x === cx + 80) ctx.moveTo(x, wy);
          else ctx.lineTo(x, wy);
        }
        ctx.stroke();

        if (isPlaying && Math.random() < 0.2) {
          setGraphData((prev) =>
            [
              ...prev,
              {
                time: (theta * (180 / Math.PI)).toFixed(0) + "°",
                value1: parseFloat(Math.sin(theta).toFixed(2)),
                value2: parseFloat(Math.cos(theta).toFixed(2)),
              },
            ].slice(-18),
          );
        }
      }

      // Default Custom Fallback Scene
      else {
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.font = "14px monospace";
        ctx.fillText("Dynamic AI Schema loaded.", W / 2 - 100, H / 2);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [params, isPlaying, showGrid, timeStep, zoom]);

  return (
    <div className="w-full flex flex-col gap-4 animate-in slide-in-from-bottom-6 duration-500">
      
      {/* ==============================================
          STUDIO HEADER BAR
          ============================================== */}
      <header className="glow-card p-4 flex flex-wrap items-center justify-between gap-3 bg-surface/80">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-xl border border-border/80 hover:bg-white/5 hover:text-indigo-glow transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-indigo-glow tracking-wider">
                ACTIVE LAB WORKBENCH
              </span>
              <span className="rounded bg-indigo-glow/10 border border-indigo-glow/20 px-1.5 py-0.5 text-[9px] font-bold text-indigo-glow">
                {sim.config.simulation_type.replace("_", " ")}
              </span>
            </div>
            <h1 className="text-xl font-bold font-display text-foreground">{sim.config.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-glow animate-pulse-glow" />
          <span className="text-xs font-bold text-muted-foreground">Experiment Mode active</span>
        </div>
      </header>

      {/* ==============================================
          STUDIO MAIN VIEW GRID
          ============================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr_320px] gap-4 min-h-[500px]">
        
        {/* ==============================================
            LEFT PANEL: INTERACTIVE CONTROLS & CHECKLISTS
            ============================================== */}
        <aside className="glow-card p-4 flex flex-col gap-4 bg-surface/70 backdrop-blur-xl">
          
          {/* Timeline player controls */}
          <div>
            <div className="text-[10px] font-bold uppercase text-indigo-glow tracking-wider mb-2">
              Simulation Timeline
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-glow to-purple-glow text-white px-3 py-2 text-xs font-bold shadow-glow-indigo hover:opacity-90 transition"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? "Pause" : "Play"}
              </button>
              
              <button
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-bold"
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
            </div>
          </div>

          {/* Dynamic AI parameters sliders */}
          <div className="border-t border-border/40 pt-3 flex-1 overflow-y-auto scrollbar-none space-y-3">
            <div className="text-[10px] font-bold uppercase text-indigo-glow tracking-wider mb-1">
              Laboratory Parameters
            </div>

            {sim.config.parameters.map((p) => (
              <div key={p.name} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{p.label}:</span>
                  <span className="font-bold font-mono text-cyan-glow">
                    {params[p.name]} {p.unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={p.min}
                  max={p.max}
                  step={p.step}
                  value={params[p.name]}
                  onChange={(e) => setParamValue(p.name, parseFloat(e.target.value))}
                  className="w-full accent-cyan-glow cursor-pointer"
                />
                <p className="text-[9px] text-muted-foreground leading-normal">{p.description}</p>
              </div>
            ))}
          </div>

          {/* Guided Checklist Steps */}
          <div className="border-t border-border/40 pt-3 mt-auto shrink-0">
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-indigo-glow tracking-wider mb-2">
              <FileCheck2 className="h-3.5 w-3.5" /> Experiment Checkpoints
            </div>
            
            <div className="space-y-2 text-xs">
              {sim.config.steps.map((st, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "rounded-xl border p-2.5 flex items-start gap-2.5 transition",
                    tasksDone[idx]
                      ? "bg-emerald-glow/5 border-emerald-glow/30 text-emerald-glow"
                      : "bg-white/5 border-border/80 text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "h-4 w-4 rounded-md border grid place-items-center font-bold text-[9px] shrink-0 mt-0.5",
                      tasksDone[idx] ? "border-emerald-glow bg-emerald-glow" : "border-border"
                    )}
                  >
                    {tasksDone[idx] ? "✓" : idx + 1}
                  </span>
                  <div>
                    <span className="font-bold block text-foreground">{st.title}</span>
                    <span className="text-[10px] leading-relaxed block mt-0.5">{st.instructions}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </aside>

        {/* ==============================================
            CENTER COLUMN: HIGH-PERFORMANCE PHYSICAL CANVAS
            ============================================== */}
        <section className="flex flex-col gap-4 min-h-0">
          
          {/* Canvas Wrapper */}
          <div className="glow-card flex-1 bg-surface/50 border border-border/60 rounded-2xl overflow-hidden relative flex items-center justify-center p-2 min-h-[360px]">
            
            <canvas
              ref={canvasRef}
              width={800}
              height={480}
              className="w-full h-full block rounded-xl bg-[#0b0f1e] shadow-inner"
            />

            {/* Display Visual overlays (active coordinates/equations) */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-[10px] uppercase font-bold transition",
                  showGrid ? "bg-cyan-glow/20 border-cyan-glow text-foreground" : "bg-card border-border/80 text-muted-foreground"
                )}
              >
                Grid: {showGrid ? "ON" : "OFF"}
              </button>
              
              <div className="rounded-lg border border-border/80 bg-card/90 px-2.5 py-1 text-[10px] font-mono text-indigo-glow font-bold uppercase">
                Zoom: {zoom.toFixed(1)}x
              </div>
            </div>
          </div>

          {/* Mathematical Formulas overlay Panel */}
          <div className="glow-card p-4 bg-surface/70 backdrop-blur-xl">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-indigo-glow tracking-wider mb-2">
              <BookOpen className="h-4 w-4" /> Textbook Grounded Formulas
            </div>
            
            <div className="grid md:grid-cols-2 gap-3.5">
              {sim.config.formulas.map((f, i) => (
                <div key={i} className="rounded-xl border border-border bg-background/50 p-3">
                  <div className="text-xs font-bold text-foreground mb-1">{f.name}</div>
                  <div className="bg-card/75 border border-border/40 rounded-lg py-2 my-1 text-center text-sm text-cyan-glow overflow-x-auto scrollbar-none font-mono">
                    <BlockMath math={f.latex} />
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-normal">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>

        </section>

        {/* ==============================================
            RIGHT PANEL: GRAPHS & MCQ CHECKPOINTS
            ============================================== */}
        <aside className="glow-card p-4 flex flex-col gap-4 bg-surface/70 backdrop-blur-xl">
          
          {/* Time Series Graph Panel */}
          <div className="flex-1 flex flex-col min-h-[220px]">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-indigo-glow tracking-wider mb-2">
              <LineIcon className="h-4 w-4" /> Real-time Vectors Graph
            </div>

            <div className="flex-1 border border-border bg-background/40 rounded-2xl p-2 min-h-[160px]">
              {graphData.length === 0 ? (
                <div className="h-full grid place-items-center text-center p-4">
                  <Clock className="h-6 w-6 text-muted-foreground/60 mb-1 animate-pulse" />
                  <span className="text-[10px] text-muted-foreground leading-relaxed">
                    Play the simulation timeline to record vector coordinates over time.
                  </span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graphData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" fontSize={9} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={9} />
                    <ChartTooltip
                      contentStyle={{ background: "#0b0f1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "10px" }}
                    />
                    <Line type="monotone" dataKey="value1" stroke="#06b6d4" strokeWidth={2} dot={false} name="Val 1" />
                    <Line type="monotone" dataKey="value2" stroke="#a855f7" strokeWidth={2} dot={false} name="Val 2" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* MCQ Conceptual Quiz Panel */}
          <div className="border-t border-border/40 pt-3 mt-auto shrink-0">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-indigo-glow tracking-wider mb-2">
              <HelpCircle className="h-4 w-4" /> Conceptual Checkpoint
            </div>

            {sim.config.quiz_questions.slice(0, 1).map((q, idx) => (
              <div key={idx} className="space-y-3">
                <p className="text-xs text-foreground font-semibold leading-relaxed">
                  {q.question}
                </p>

                <div className="space-y-1.5">
                  {q.options.map((opt, oIdx) => {
                    const finished = selectedAns !== null;
                    const isCorrect = oIdx === q.correctIndex;
                    const isPicked = selectedAns === oIdx;

                    return (
                      <button
                        key={oIdx}
                        disabled={finished}
                        onClick={() => setSelectedAns(oIdx)}
                        className={cn(
                          "w-full text-left rounded-xl border p-2.5 text-xs transition",
                          !finished && "border-border bg-background/50 hover:bg-white/5 hover:border-indigo-glow",
                          finished && isCorrect && "border-emerald-glow bg-emerald-glow/10 text-emerald-glow font-bold",
                          finished && isPicked && !isCorrect && "border-destructive bg-destructive/10 text-destructive",
                          finished && !isPicked && !isCorrect && "opacity-40"
                        )}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {selectedAns !== null && (
                  <div className="rounded-xl border border-border bg-card/60 p-2.5 text-[11px] animate-in fade-in-40 duration-300">
                    {selectedAns === q.correctIndex ? (
                      <span className="text-emerald-glow font-bold flex items-center gap-1 mb-1">
                        ✓ Correct! +100 XP Aced.
                      </span>
                    ) : (
                      <span className="text-destructive font-bold flex items-center gap-1 mb-1">
                        ✗ Incorrect. Review explanation.
                      </span>
                    )}
                    <p className="text-muted-foreground leading-relaxed">
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

        </aside>

      </div>

    </div>
  );
}
