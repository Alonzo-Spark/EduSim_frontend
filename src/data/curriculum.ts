export interface Topic {
  id?: string;
  name: string;
  hasSimulation?: boolean;
  simulationRoute?: string;
}

export interface Chapter {
  id?: string;
  name: string;
  topics: Topic[];
}

export interface Subject {
  id?: string;
  name: string;
  icon?: string;
  description?: string;
  chapters: number | Chapter[];
}

export interface SchoolClass {
  id: string;
  name: string;
  description?: string;
  subjects: Subject[];
}

const topic = (id: string, name: string, hasSimulation = false, simulationRoute?: string): Topic => ({
  id,
  name,
  hasSimulation,
  simulationRoute,
});

const chapter = (id: string, name: string, topics: Topic[]): Chapter => ({ id, name, topics });

const subject = (id: string, name: string, chapters: number | Chapter[], icon?: string, description?: string): Subject => ({
  id,
  name,
  icon,
  description,
  chapters,
});

const simpleClass = (id: string, name: string, subjects: Subject[]): SchoolClass => ({
  id,
  name,
  subjects,
});

export const CURRICULUM: SchoolClass[] = [
  {
    id: "class-1",
    name: "Class 1",
    description: "Foundations of numbers and counting",
    subjects: [subject("math", "Math", 10, "Calculator", "Numbers, shapes & basic operations")],
  },
  {
    id: "class-2",
    name: "Class 2",
    description: "Building early arithmetic skills",
    subjects: [subject("math", "Math", 12, "Calculator", "Addition, subtraction & patterns")],
  },
  {
    id: "class-3",
    name: "Class 3",
    description: "Curiosity meets early science",
    subjects: [
      subject("math", "Math", 14, "Calculator", "Multiplication, division, fractions"),
      subject("evs", "EVS", 14, "Leaf", "Explore the world around you"),
    ],
  },
  {
    id: "class-4",
    name: "Class 4",
    description: "Sharpen logic and observation",
    subjects: [
      subject("math", "Math", 15, "Calculator", "Decimals, geometry, measurement"),
      subject("evs", "EVS", 15, "Leaf", "Plants, animals & environment"),
    ],
  },
  {
    id: "class-5",
    name: "Class 5",
    description: "Bridging primary to middle school",
    subjects: [
      subject("math", "Math", 16, "Calculator", "Advanced arithmetic & geometry"),
      subject("evs", "EVS", 16, "Leaf", "General science foundations"),
    ],
  },
  simpleClass("class-6", "Class 6", [
    subject("mathematics", "Mathematics", [
      chapter("knowing-our-numbers", "Knowing Our Numbers", [
        topic("introduction", "Introduction"),
        topic("large-numbers", "Introduction to Large Numbers"),
        topic("numeration", "International System of Numeration"),
      ]),
      chapter("whole-numbers", "Whole Numbers", [topic("whole-numbers", "Whole Numbers"), topic("number-line", "Representation on the Number Line")]),
      chapter("fractions-decimals", "Fractions and Decimals", [topic("fractions", "A Fraction"), topic("decimals", "Decimals"), topic("decimal-addition", "Addition and Subtractions of Decimal Fractions")]),
      chapter("symmetry", "Symmetry", [topic("line-symmetry", "Line Symmetry"), topic("multiple-lines", "Multiple Lines of Symmetry")]),
    ]),
    subject("science", "General Science", [
      chapter("food", "Our Food", [topic("ingredients", "Food ingredients"), topic("preservation", "Preservation of food")]),
      chapter("magnets", "Playing with magnets", [topic("magnets", "Magnets"), topic("compass", "Magnetic Compass"), topic("repulsion", "Attraction and Repulsion between two Magnets")]),
      chapter("water-cycle", "Rain: where does it come from?", [topic("evaporation", "Evaporation and formation of clouds"), topic("condensation", "Condensation"), topic("water-cycle", "Water cycle")]),
    ]),
  ]),
  simpleClass("class-7", "Class 7", [
    subject("mathematics", "Mathematics", [
      chapter("integers", "Integers", [topic("addition", "Addition of integers"), topic("subtraction", "Subtraction of integers")]),
      chapter("fractions-rational", "Fractions, Decimals and Rational Numbers", [topic("comparison", "Comparison of fractions"), topic("rational", "Introduction to Rational numbers")]),
      chapter("lines-angles", "Lines and Angles", [topic("complementary", "Complementary Angles"), topic("transversal", "Transversal")]),
      chapter("geometry", "Triangle and its Properties", [topic("triangles", "Classification of triangles"), topic("angle-sum", "Angle-sum property of a triangle")]),
    ]),
    subject("science", "Science", [
      chapter("matter", "Matter Around Us", [topic("states", "States of matter"), topic("diffusion", "Diffusion")]),
      chapter("motion", "Motion", [topic("distance", "Distance and displacement"), topic("acceleration", "Acceleration")]),
      chapter("sound", "Sound", [topic("sound", "Production of sound"), topic("frequency", "Time period and frequency")]),
    ]),
  ]),
  simpleClass("class-8", "Class 8", [
    subject("math", "Mathematics", [
      chapter("rational-numbers", "Rational Numbers", [topic("operations", "Operations on Rational numbers"), topic("line", "Representation of Rational numbers on Number line")]),
      chapter("algebraic-expressions", "Algebraic Expressions", [topic("terms", "Like and unlike terms"), topic("identities", "Some important Identities")]),
      chapter("mensuration", "Surface Areas And Volume", [topic("cuboid", "Cuboid"), topic("volume", "Volume of Cube and Cuboid")]),
      chapter("data-handling", "Frequency Distribution Tables and Graphs", [topic("bar-graph", "Bar Graph"), topic("histogram", "Histogram")]),
    ]),
    subject("science", "Science", [
      chapter("cells", "Cell - Structure and Functions", [topic("cell-structure", "Typical Cell"), topic("organelles", "Cell organelles")]),
      chapter("tissues", "Plant and Animal Tissues", [topic("plant-tissues", "Meristematic tissues"), topic("animal-tissues", "Connective tissue")]),
      chapter("reproduction", "Reproduction", [topic("asexual", "Asexual reproduction"), topic("sexual", "Sexual reproduction")]),
    ]),
  ]),
  simpleClass("class-9", "Class 9", [
    subject("math", "Math", [
      chapter("real-numbers", "Real Numbers", [topic("irrational", "Irrational Numbers"), topic("laws", "Law of Exponents for real numbers")]),
      chapter("polynomials", "Polynomials and Factorisation", [topic("zeroes", "Zeroes of a Polynomial"), topic("factor-theorem", "Factor Theorem")]),
      chapter("triangles", "Triangles", [topic("similarity", "Criteria for Similarity of Triangles"), topic("pythagoras", "Pythagoras Theorem", true, "/simulations")]),
      chapter("statistics", "Statistics", [topic("mean", "Arithmetic Mean / Average"), topic("median", "Median")]),
      chapter("trigonometry", "Trigonometry", [topic("ratios", "Trigonometric Ratios", true, "/simulations"), topic("identities", "Trigonometric identities")]),
    ]),
    subject("physics", "Physics", [
      chapter("matter", "Matter Around Us", [topic("states", "States of matter"), topic("diffusion", "Diffusion")]),
      chapter("motion", "Motion", [topic("distance", "Distance and displacement"), topic("acceleration", "Acceleration", true, "/simulations")]),
      chapter("laws", "Laws of Motion", [topic("inertia", "Inertia and mass"), topic("momentum", "Law of conservation of momentum")]),
      chapter("gravity", "Gravitation", [topic("weight", "Weight"), topic("centre", "Centre of gravity")]),
      chapter("work-energy", "Work and Energy", [topic("work", "Work"), topic("power", "Power"), topic("energy", "Conservation of energy", true, "/simulations")]),
      chapter("sound", "Sound", [topic("waves", "Sound waves are longitudinal"), topic("echo", "Echo")]),
    ]),
    subject("biology", "Biology", [
      chapter("cell", "Cell - Structure and Functions", [topic("cell", "Typical Cell"), topic("nucleus", "Nucleus"), topic("organelles", "Cell organelles")]),
      chapter("classification", "Diversity in Living Organisms - Classification", [topic("classification", "Classification and evolution"), topic("nomenclature", "Nomenclature")]),
      chapter("nutrition", "Nutrition", [topic("photosynthesis", "Photosynthesis", true, "/simulations"), topic("digestion", "Digestive system in Human Beings")]),
      chapter("respiration", "Respiration", [topic("breathing", "Breathing (Inhalation and Exhalation)"), topic("cellular", "Cellular respiration")]),
      chapter("circulation", "Circulation", [topic("heart", "Heart Beat"), topic("blood", "Blood vessels and circulation")]),
      chapter("reproduction", "Reproduction", [topic("asexual", "Asexual reproduction"), topic("sexual", "Sexual reproduction")]),
    ]),
  ]),
  simpleClass("class-10", "Class 10", [
    subject("math", "Math", [
      chapter("real-numbers", "Real Numbers", [topic("fundamental", "The Fundamental theorem of Arithmetic"), topic("logarithms", "Exponentials and Logarithms")]),
      chapter("polynomials", "Polynomials", [topic("zeroes", "Zeroes of a Polynomial"), topic("division", "Division Algorithm for Polynomials")]),
      chapter("quadratic", "Quadratic Equations", [topic("factorisation", "Solution by Factorisation"), topic("nature-of-roots", "Nature of Roots")]),
      chapter("coordinate", "Coordinate Geometry", [topic("distance", "Distance Between Two Points"), topic("area", "Area of the Triangle")]),
      chapter("trigonometry", "Trigonometry", [topic("ratios", "Trigonometric Ratios", true, "/simulations"), topic("identities", "Trigonometric identities")]),
      chapter("probability", "Probability", [topic("theory", "Probability - A Theoretical Approach"), topic("events", "Mutually Exclusive Events")]),
    ]),
    subject("physics", "Physics", [
      chapter("light", "Reflection of light at curved surfaces", [topic("mirror", "Ray diagrams (Image formation by concave mirror)", true, "/simulations")]),
      chapter("electricity", "Electric Current", [topic("ohm", "Ohm's law", true, "/simulations"), topic("power", "Electric power")]),
      chapter("electromagnetism", "Electromagnetism", [topic("motor", "Electric Motor"), topic("induction", "Electromagnetic induction")]),
      chapter("heat", "Heat", [topic("specific-heat", "Specific Heat"), topic("evaporation", "Evaporation")]),
    ]),
    subject("biology", "Biology", [
      chapter("nutrition", "NUTRITION", [topic("photosynthesis", "Photosynthesis", true, "/simulations"), topic("digestion", "Digestive system in Human Beings")]),
      chapter("respiration", "Respiration", [topic("breathing", "Mechanism of respiration in human beings"), topic("plants", "Respiration in Plants")]),
      chapter("circulation", "Circulation", [topic("heart", "Internal structure of the heart"), topic("blood-pressure", "Blood pressure (B.P.)")]),
      chapter("reproduction", "Reproduction", [topic("sexual", "Sexual reproduction"), topic("reproductive-health", "Reproductive health")]),
      chapter("heredity", "Heredity - Evolution", [topic("mendel", "Mendel and his experiments"), topic("evolution", "Evolution")]),
      chapter("environment", "Our Environment", [topic("food-chain", "Food Chain"), topic("ecosystems", "Ecological pyramids")]),
    ]),
  ]),
];
