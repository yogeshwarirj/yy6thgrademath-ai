import { Calculator, Hash, Divide, CircleDot, Percent, Superscript, Ruler, Variable, Equal, Pentagon, BarChart3 } from "lucide-react";

export interface Domain {
  id: string;
  name: string;
  icon: typeof Calculator;
  colorKey: string;
  topics: string[];
}

export const domains: Domain[] = [
  {
    id: "whole-numbers",
    name: "Whole Number Operations",
    icon: Calculator,
    colorKey: "whole-numbers",
    topics: [
      "Adding Whole Numbers", "Subtracting Whole Numbers", "Multiplying Whole Numbers",
      "Dividing Hundreds", "Long Division by Two Digits", "Division with Remainders",
      "Rounding Whole Numbers", "Whole Number Estimation",
    ],
  },
  {
    id: "integers",
    name: "Integers & Number Theory",
    icon: Hash,
    colorKey: "integers",
    topics: [
      "Adding and Subtracting Integers", "Multiplying and Dividing Integers",
      "Order of Operations", "Ordering Integers and Numbers", "Integers and Absolute Value",
      "Factoring Numbers", "Prime Factorization", "Divisibility Rules",
      "Greatest Common Factor", "Least Common Multiple",
    ],
  },
  {
    id: "fractions",
    name: "Fractions",
    icon: Divide,
    colorKey: "fractions",
    topics: [
      "Simplifying Fractions", "Adding and Subtracting Fractions",
      "Multiplying and Dividing Fractions", "Adding and Subtracting Mixed Numbers",
      "Multiplying and Dividing Mixed Numbers",
    ],
  },
  {
    id: "decimals",
    name: "Decimals",
    icon: CircleDot,
    colorKey: "decimals",
    topics: [
      "Adding and Subtracting Decimals", "Multiplying and Dividing Decimals",
      "Comparing Decimals", "Rounding Decimals", "Convert Fraction to Decimal",
      "Convert Decimal to Percent", "Convert Fraction to Percent",
    ],
  },
  {
    id: "ratios",
    name: "Proportions, Ratios & Percent",
    icon: Percent,
    colorKey: "ratios",
    topics: [
      "Simplifying Ratios", "Proportional Ratios", "Similarity and Ratios",
      "Ratio and Rates Word Problems", "Percentage Calculations",
      "Percent Problems", "Discount Tax and Tip",
    ],
  },
  {
    id: "exponents",
    name: "Exponents & Radicals",
    icon: Superscript,
    colorKey: "exponents",
    topics: [
      "Adding and Subtracting Exponents", "Multiplication Property of Exponents",
      "Zero and Negative Exponents", "Division Property of Exponents",
      "Powers of Products and Quotients", "Negative Exponents and Negative Bases",
      "Scientific Notation", "Square Roots",
    ],
  },
  {
    id: "measurements",
    name: "Measurements",
    icon: Ruler,
    colorKey: "measurements",
    topics: [
      "Reference Measurement", "Metric Length Measurement", "Customary Length Measurement",
      "Metric Capacity Measurement", "Customary Capacity Measurement",
      "Metric Weight and Mass Measurement", "Customary Weight and Mass Measurement",
      "Temperature", "Time",
    ],
  },
  {
    id: "algebra",
    name: "Algebraic Expressions",
    icon: Variable,
    colorKey: "algebra",
    topics: [
      "Find a Rule", "Translate Phrases into an Algebraic Statement",
      "Simplifying Variable Expressions", "The Distributive Property",
      "Evaluating One Variable Expressions", "Combining Like Terms",
    ],
  },
  {
    id: "equations",
    name: "Equations & Inequalities",
    icon: Equal,
    colorKey: "equations",
    topics: [
      "One-Step Equations", "One-Step Equation Word Problems", "Two-Step Equations",
      "Multi-Step Equations", "One-Step Inequalities", "Graphing Inequalities",
      "Two-Step Inequalities", "Multi-Step Inequalities",
    ],
  },
  {
    id: "geometry",
    name: "Geometry & Solid Figures",
    icon: Pentagon,
    colorKey: "geometry",
    topics: [
      "Angles", "Pythagorean Relationship", "Triangles", "Polygons", "Trapezoids",
      "Circles", "Cubes", "Rectangular Prism", "Cylinder",
    ],
  },
  {
    id: "statistics",
    name: "Statistics & Probability",
    icon: BarChart3,
    colorKey: "statistics",
    topics: [
      "Mean and Median", "Mode and Range", "Time Series", "Stem-and-Leaf Plot",
      "Quartile of a Data Set", "Box and Whisker Plots", "Pie Graph", "Probability Problems",
    ],
  },
];

export const totalTopics = domains.reduce((sum, d) => sum + d.topics.length, 0);

export const domainColorMap: Record<string, string> = {
  "whole-numbers": "domain-whole-numbers",
  integers: "domain-integers",
  fractions: "domain-fractions",
  decimals: "domain-decimals",
  ratios: "domain-ratios",
  exponents: "domain-exponents",
  measurements: "domain-measurements",
  algebra: "domain-algebra",
  equations: "domain-equations",
  geometry: "domain-geometry",
  statistics: "domain-statistics",
};

export const domainHexMap: Record<string, string> = {
  "whole-numbers": "#3B82F6",
  integers: "#8B5CF6",
  fractions: "#EC4899",
  decimals: "#F59E0B",
  ratios: "#10B981",
  exponents: "#EF4444",
  measurements: "#06B6D4",
  algebra: "#7C3AED",
  equations: "#D97706",
  geometry: "#059669",
  statistics: "#DC2626",
};
