export const USER = {
  name: "Priya",
  initials: "PS",
  level: 8,
  xp: 1240,
  nextLevelXp: 1500,
  streak: 7,
};

export const CONTINUE_LEARNING = [
  {
    title: "Projectile Motion",
    chapter: "Ch.2 · Motion in a Plane",
    klass: "Class 9 · Physics",
    progress: 64,
    accent: "indigo",
  },
  {
    title: "Photosynthesis",
    chapter: "Ch.6 · Life Processes",
    klass: "Class 10 · Biology",
    progress: 38,
    accent: "emerald",
  },
  {
    title: "Quadratic Equations",
    chapter: "Ch.4 · Algebra",
    klass: "Class 10 · Math",
    progress: 82,
    accent: "cyan",
  },
];

export const RECENT_SIMULATIONS = [
  {
    id: "sim-1",
    topic: "Projectile Motion",
    subject: "Physics",
    klass: "Class 9",
    createdAt: "2 hours ago",
    accent: "indigo",
  },
  {
    id: "sim-2",
    topic: "Simple Pendulum",
    subject: "Physics",
    klass: "Class 9",
    createdAt: "Yesterday",
    accent: "cyan",
  },
  {
    id: "sim-3",
    topic: "Ohm's Law Circuit",
    subject: "Physics",
    klass: "Class 10",
    createdAt: "3 days ago",
    accent: "purple",
  },
  {
    id: "sim-4",
    topic: "Convex Lens Optics",
    subject: "Physics",
    klass: "Class 10",
    createdAt: "5 days ago",
    accent: "amber",
  },
  {
    id: "sim-5",
    topic: "Acid-Base Titration",
    subject: "Chemistry",
    klass: "Class 10",
    createdAt: "1 week ago",
    accent: "emerald",
  },
  {
    id: "sim-6",
    topic: "Wave Interference",
    subject: "Physics",
    klass: "Class 10",
    createdAt: "2 weeks ago",
    accent: "indigo",
  },
];

export const WEEKLY_ACTIVITY = [
  { day: "Mon", simulations: 3, topics: 2 },
  { day: "Tue", simulations: 5, topics: 4 },
  { day: "Wed", simulations: 2, topics: 1 },
  { day: "Thu", simulations: 6, topics: 5 },
  { day: "Fri", simulations: 4, topics: 3 },
  { day: "Sat", simulations: 7, topics: 6 },
  { day: "Sun", simulations: 5, topics: 4 },
];

export const SUBJECT_BREAKDOWN = [
  { name: "Physics", value: 42, color: "var(--indigo-glow)" },
  { name: "Math", value: 28, color: "var(--cyan-glow)" },
  { name: "Biology", value: 18, color: "var(--emerald-glow)" },
  { name: "Chemistry", value: 12, color: "var(--purple-glow)" },
];

export const BADGES = [
  { icon: "FlaskConical", title: "First Simulation", desc: "Run your first sim", rarity: "common", earned: true },
  { icon: "BookOpen", title: "5 Topics Learned", desc: "Complete 5 topics", rarity: "common", earned: true },
  { icon: "Flame", title: "7-Day Streak", desc: "Learn 7 days in a row", rarity: "rare", earned: true },
  { icon: "Trophy", title: "Quiz Master", desc: "Score 100% on a quiz", rarity: "rare", earned: true },
  { icon: "Zap", title: "Speed Learner", desc: "Finish a topic in <10min", rarity: "rare", earned: true },
  { icon: "Star", title: "Perfect Quiz", desc: "Ace 5 quizzes in a row", rarity: "rare", earned: false },
  { icon: "Telescope", title: "Explorer", desc: "Try 3 different subjects", rarity: "common", earned: true },
  { icon: "Lightbulb", title: "Formula Pro", desc: "Master 20 formulas", rarity: "rare", earned: false },
  { icon: "Rocket", title: "100 Simulations", desc: "Run 100 simulations", rarity: "legendary", earned: false },
  { icon: "Dna", title: "Biology Whiz", desc: "Complete all Biology topics", rarity: "legendary", earned: false },
  { icon: "Atom", title: "Physics Sage", desc: "Master all Physics chapters", rarity: "legendary", earned: false },
  { icon: "Crown", title: "Top of Class", desc: "Reach #1 on leaderboard", rarity: "legendary", earned: false },
];

export const CHALLENGES = [
  { title: "Weekly Sprint", desc: "Run 10 simulations this week", progress: 6, total: 10, xp: 250, deadline: "3d left" },
  { title: "Algebra Marathon", desc: "Complete 5 Algebra topics", progress: 2, total: 5, xp: 400, deadline: "5d left" },
  { title: "Streak Defender", desc: "Maintain a 14-day streak", progress: 7, total: 14, xp: 500, deadline: "7d left" },
];

export const LEADERBOARD = [
  { name: "Arjun Mehta", initials: "AM", xp: 4820, sims: 86, streak: 21 },
  { name: "Sara Khan", initials: "SK", xp: 4310, sims: 74, streak: 18 },
  { name: "Rohan Das", initials: "RD", xp: 3960, sims: 68, streak: 14 },
  { name: "Anika Rao", initials: "AR", xp: 3180, sims: 55, streak: 9 },
  { name: "Vikram Iyer", initials: "VI", xp: 2740, sims: 49, streak: 12 },
  { name: "Priya Sharma", initials: "PS", xp: 1240, sims: 18, streak: 7, isCurrent: true },
  { name: "Neha Gupta", initials: "NG", xp: 1180, sims: 22, streak: 4 },
  { name: "Kabir Singh", initials: "KS", xp: 980, sims: 14, streak: 3 },
];

export const PROJECTILE_FORMULAS = [
  {
    name: "Horizontal Range",
    latex: "R = \\frac{u^2 \\sin(2\\theta)}{g}",
    vars: [
      { sym: "R", meaning: "Range", unit: "m" },
      { sym: "u", meaning: "Initial velocity", unit: "m/s" },
      { sym: "θ", meaning: "Launch angle", unit: "deg" },
      { sym: "g", meaning: "Gravity", unit: "m/s²" },
    ],
  },
  {
    name: "Max Height",
    latex: "H = \\frac{u^2 \\sin^2(\\theta)}{2g}",
    vars: [
      { sym: "H", meaning: "Max height", unit: "m" },
      { sym: "u", meaning: "Initial velocity", unit: "m/s" },
      { sym: "θ", meaning: "Launch angle", unit: "deg" },
      { sym: "g", meaning: "Gravity", unit: "m/s²" },
    ],
  },
  {
    name: "Time of Flight",
    latex: "T = \\frac{2u \\sin(\\theta)}{g}",
    vars: [
      { sym: "T", meaning: "Total flight time", unit: "s" },
      { sym: "u", meaning: "Initial velocity", unit: "m/s" },
      { sym: "θ", meaning: "Launch angle", unit: "deg" },
      { sym: "g", meaning: "Gravity", unit: "m/s²" },
    ],
  },
];

export const QUIZ_QUESTIONS = [
  {
    q: "At what launch angle does a projectile achieve maximum range (no air resistance)?",
    options: ["30°", "45°", "60°", "90°"],
    correct: 1,
    explanation:
      "Range is maximized when sin(2θ) = 1, i.e. 2θ = 90°, so θ = 45°.",
  },
  {
    q: "If initial velocity doubles, the maximum height becomes:",
    options: ["2×", "3×", "4×", "Unchanged"],
    correct: 2,
    explanation: "H ∝ u², so doubling u quadruples H.",
  },
  {
    q: "Which of these stays constant during projectile motion (ignoring air)?",
    options: ["Vertical velocity", "Horizontal velocity", "Speed", "Acceleration direction"],
    correct: 1,
    explanation:
      "Only gravity acts vertically, so horizontal velocity remains constant throughout the flight.",
  },
];
