// Quick tips & points to remember for each topic

export const topicTips: Record<string, { tip: string; points: string[] }> = {
  // Whole Number Operations
  "Adding Whole Numbers": {
    tip: "Line up place values before adding.",
    points: ["Carry over when sum ≥ 10", "Check by estimating first"],
  },
  "Subtracting Whole Numbers": {
    tip: "Borrow from the next place value when needed.",
    points: ["Regroup before subtracting", "Use addition to check your answer"],
  },
  "Multiplying Whole Numbers": {
    tip: "Break large numbers into parts using the distributive property.",
    points: ["Multiply each digit separately", "Don't forget to add partial products"],
  },
  "Dividing Hundreds": {
    tip: "Use patterns of 10s and 100s to simplify.",
    points: ["400 ÷ 20 = 40 ÷ 2 = 20", "Remove equal zeros from both numbers"],
  },
  "Long Division by Two Digits": {
    tip: "Divide → Multiply → Subtract → Bring down. Repeat.",
    points: ["Estimate the quotient first", "Check: quotient × divisor + remainder = dividend"],
  },
  "Division with Remainders": {
    tip: "The remainder must always be less than the divisor.",
    points: ["Remainder = Dividend − (Quotient × Divisor)", "Interpret remainders in word problems carefully"],
  },
  "Rounding Whole Numbers": {
    tip: "Look at the digit to the RIGHT of the rounding place.",
    points: ["5 or more → round up", "4 or less → keep the same"],
  },
  "Whole Number Estimation": {
    tip: "Round each number first, then compute.",
    points: ["Use front-end estimation for quick answers", "Estimation helps check if your answer is reasonable"],
  },

  // Integers & Number Theory
  "Adding and Subtracting Integers": {
    tip: "Same signs → add and keep the sign. Different signs → subtract and keep the larger absolute value's sign.",
    points: ["−3 + (−5) = −8", "−7 + 4 = −3 (larger absolute value is negative)"],
  },
  "Multiplying and Dividing Integers": {
    tip: "Same signs → positive result. Different signs → negative result.",
    points: ["(−3) × (−4) = 12", "(−6) ÷ 3 = −2"],
  },
  "Order of Operations": {
    tip: "Remember PEMDAS: Parentheses, Exponents, Multiply/Divide, Add/Subtract.",
    points: ["Multiply and Divide left to right", "Add and Subtract left to right"],
  },
  "Ordering Integers and Numbers": {
    tip: "Use a number line — numbers increase going right.",
    points: ["Negative numbers: farther from 0 = smaller", "−5 < −2 < 0 < 3"],
  },
  "Integers and Absolute Value": {
    tip: "Absolute value = distance from 0 (always positive).",
    points: ["|−7| = 7", "|0| = 0"],
  },
  "Factoring Numbers": {
    tip: "Find all pairs of numbers that multiply to give the target.",
    points: ["Start from 1 and work up", "Every number has at least two factors: 1 and itself"],
  },
  "Prime Factorization": {
    tip: "Break a number down into a product of prime numbers.",
    points: ["Use a factor tree", "36 = 2 × 2 × 3 × 3 = 2² × 3²"],
  },
  "Divisibility Rules": {
    tip: "Quick checks: divisible by 2 (even), by 3 (digit sum ÷ 3), by 5 (ends in 0 or 5).",
    points: ["Divisible by 6 = divisible by both 2 and 3", "Divisible by 9 = digit sum divisible by 9"],
  },
  "Greatest Common Factor": {
    tip: "GCF = largest number that divides both numbers evenly.",
    points: ["List factors or use prime factorization", "GCF of 12 and 18 = 6"],
  },
  "Least Common Multiple": {
    tip: "LCM = smallest number that both numbers divide into.",
    points: ["List multiples or use prime factorization", "LCM of 4 and 6 = 12"],
  },

  // Fractions
  "Simplifying Fractions": {
    tip: "Divide numerator and denominator by their GCF.",
    points: ["12/18 → ÷6 → 2/3", "A fraction is simplest when GCF = 1"],
  },
  "Adding and Subtracting Fractions": {
    tip: "Find a common denominator first.",
    points: ["LCD = Least Common Denominator", "Only add/subtract numerators, keep the denominator"],
  },
  "Multiplying and Dividing Fractions": {
    tip: "Multiply: top × top, bottom × bottom. Divide: flip and multiply.",
    points: ["Cross-cancel before multiplying to simplify", "2/3 ÷ 4/5 = 2/3 × 5/4"],
  },
  "Adding and Subtracting Mixed Numbers": {
    tip: "Convert to improper fractions OR work whole numbers and fractions separately.",
    points: ["Borrow from the whole number if the fraction part isn't large enough", "Always simplify the result"],
  },
  "Multiplying and Dividing Mixed Numbers": {
    tip: "Always convert mixed numbers to improper fractions first.",
    points: ["2½ = 5/2", "Simplify before multiplying when possible"],
  },

  // Decimals
  "Adding and Subtracting Decimals": {
    tip: "Line up the decimal points before computing.",
    points: ["Add zeros as placeholders if needed", "Bring the decimal point straight down"],
  },
  "Multiplying and Dividing Decimals": {
    tip: "Multiply normally, then count total decimal places.",
    points: ["0.3 × 0.2 = 0.06 (2 decimal places)", "When dividing, move decimal to make divisor whole"],
  },
  "Comparing Decimals": {
    tip: "Compare digit by digit from left to right.",
    points: ["Add trailing zeros to match lengths", "0.50 = 0.5"],
  },
  "Rounding Decimals": {
    tip: "Same rule as whole numbers — look at the digit to the right.",
    points: ["3.456 rounded to tenths = 3.5", "3.456 rounded to hundredths = 3.46"],
  },
  "Convert Fraction to Decimal": {
    tip: "Divide numerator by denominator.",
    points: ["3/4 = 3 ÷ 4 = 0.75", "Some fractions give repeating decimals: 1/3 = 0.333..."],
  },
  "Convert Decimal to Percent": {
    tip: "Multiply by 100 (move decimal 2 places right).",
    points: ["0.75 = 75%", "1.5 = 150%"],
  },
  "Convert Fraction to Percent": {
    tip: "Convert to decimal first, then multiply by 100.",
    points: ["3/5 = 0.6 = 60%", "Or set up a proportion: x/100"],
  },

  // Proportions, Ratios & Percent
  "Simplifying Ratios": {
    tip: "Divide both parts by their GCF, just like fractions.",
    points: ["12:8 → ÷4 → 3:2", "Ratios can be written as 3:2, 3 to 2, or 3/2"],
  },
  "Proportional Ratios": {
    tip: "Cross-multiply to check if two ratios are proportional.",
    points: ["2/3 = 4/6 because 2×6 = 3×4", "Equivalent ratios form a proportion"],
  },
  "Similarity and Ratios": {
    tip: "Similar figures have the same shape but different sizes — corresponding sides are proportional.",
    points: ["Set up a proportion with matching sides", "Scale factor = ratio of corresponding sides"],
  },
  "Ratio and Rates Word Problems": {
    tip: "A rate is a ratio comparing two different units.",
    points: ["Unit rate = amount per 1 unit", "$12 for 4 lbs → $3 per lb"],
  },
  "Percentage Calculations": {
    tip: "Part = Percent × Whole (use decimal form).",
    points: ["30% of 50 = 0.30 × 50 = 15", "\"Of\" means multiply"],
  },
  "Percent Problems": {
    tip: "Use the formula: Part/Whole = Percent/100.",
    points: ["Find percent: (Part ÷ Whole) × 100", "Find whole: Part ÷ (Percent ÷ 100)"],
  },
  "Discount Tax and Tip": {
    tip: "Discount → subtract percentage from price. Tax/Tip → add percentage to price.",
    points: ["Sale price = Original − Discount", "Total = Price + Tax"],
  },

  // Exponents & Radicals
  "Adding and Subtracting Exponents": {
    tip: "You can NOT add/subtract exponents directly — compute each power first.",
    points: ["2³ + 2² = 8 + 4 = 12 (not 2⁵)", "Only combine like terms with same base AND exponent"],
  },
  "Multiplication Property of Exponents": {
    tip: "Same base → ADD the exponents.",
    points: ["x³ × x⁴ = x⁷", "2² × 2³ = 2⁵ = 32"],
  },
  "Zero and Negative Exponents": {
    tip: "Any number to the 0 power = 1. Negative exponent = reciprocal.",
    points: ["5⁰ = 1", "2⁻³ = 1/2³ = 1/8"],
  },
  "Division Property of Exponents": {
    tip: "Same base → SUBTRACT the exponents.",
    points: ["x⁵ ÷ x² = x³", "Keep the base, subtract bottom from top"],
  },
  "Powers of Products and Quotients": {
    tip: "(ab)ⁿ = aⁿ × bⁿ and (a/b)ⁿ = aⁿ/bⁿ.",
    points: ["(2x)³ = 8x³", "(3/4)² = 9/16"],
  },
  "Negative Exponents and Negative Bases": {
    tip: "Negative base: (−2)² = 4 but −2² = −4 (parentheses matter!).",
    points: ["Even exponent → positive result", "Odd exponent → negative result"],
  },
  "Scientific Notation": {
    tip: "A number between 1 and 10 multiplied by a power of 10.",
    points: ["4,500 = 4.5 × 10³", "0.003 = 3 × 10⁻³"],
  },
  "Square Roots": {
    tip: "√n asks: what number times itself = n?",
    points: ["√49 = 7 because 7 × 7 = 49", "Perfect squares: 1, 4, 9, 16, 25, 36, 49, 64, 81, 100"],
  },

  // Measurements
  "Reference Measurement": {
    tip: "Use familiar objects to estimate measurements.",
    points: ["A door is about 2 meters tall", "A paper clip is about 1 cm wide"],
  },
  "Metric Length Measurement": {
    tip: "King Henry Died By Drinking Chocolate Milk — km, hm, dam, m, dm, cm, mm.",
    points: ["1 km = 1,000 m", "1 m = 100 cm = 1,000 mm"],
  },
  "Customary Length Measurement": {
    tip: "12 inches = 1 foot, 3 feet = 1 yard, 5,280 feet = 1 mile.",
    points: ["Convert larger → smaller: multiply", "Convert smaller → larger: divide"],
  },
  "Metric Capacity Measurement": {
    tip: "1 liter = 1,000 milliliters.",
    points: ["A water bottle ≈ 500 mL", "Move the decimal for metric conversions"],
  },
  "Customary Capacity Measurement": {
    tip: "Remember: 2 cups = 1 pint, 2 pints = 1 quart, 4 quarts = 1 gallon.",
    points: ["1 gallon = 16 cups", "Use \"Gallon Man\" to remember"],
  },
  "Metric Weight and Mass Measurement": {
    tip: "1 kilogram = 1,000 grams.",
    points: ["A paper clip ≈ 1 gram", "1 metric ton = 1,000 kg"],
  },
  "Customary Weight and Mass Measurement": {
    tip: "16 ounces = 1 pound, 2,000 pounds = 1 ton.",
    points: ["A loaf of bread ≈ 1 pound", "Always check units in word problems"],
  },
  "Temperature": {
    tip: "°F to °C: (°F − 32) × 5/9. °C to °F: (°C × 9/5) + 32.",
    points: ["Water freezes at 0°C / 32°F", "Water boils at 100°C / 212°F"],
  },
  "Time": {
    tip: "60 seconds = 1 minute, 60 minutes = 1 hour.",
    points: ["Elapsed time: subtract start from end", "Watch for AM/PM in word problems"],
  },

  // Algebraic Expressions
  "Find a Rule": {
    tip: "Look at the pattern between input and output values.",
    points: ["Check: +, −, ×, ÷ relationships", "Test your rule with ALL given values"],
  },
  "Translate Phrases into an Algebraic Statement": {
    tip: "\"Sum\" → +, \"difference\" → −, \"product\" → ×, \"quotient\" → ÷.",
    points: ["\"5 more than x\" = x + 5", "\"Twice a number\" = 2n"],
  },
  "Simplifying Variable Expressions": {
    tip: "Combine like terms (same variable, same exponent).",
    points: ["3x + 5x = 8x", "You can't combine 2x and 3x²"],
  },
  "The Distributive Property": {
    tip: "a(b + c) = ab + ac — multiply what's outside to each term inside.",
    points: ["3(x + 4) = 3x + 12", "Works with subtraction too: 2(x − 5) = 2x − 10"],
  },
  "Evaluating One Variable Expressions": {
    tip: "Substitute the given value, then follow order of operations.",
    points: ["If x = 3, then 2x + 1 = 2(3) + 1 = 7", "Use parentheses when substituting"],
  },
  "Combining Like Terms": {
    tip: "Like terms have the same variable raised to the same power.",
    points: ["4a + 2b + 3a = 7a + 2b", "Constants are like terms with each other"],
  },

  // Equations & Inequalities
  "One-Step Equations": {
    tip: "Use inverse operations to isolate the variable.",
    points: ["x + 5 = 12 → x = 7", "Always do the same thing to BOTH sides"],
  },
  "One-Step Equation Word Problems": {
    tip: "Translate the words into an equation, then solve.",
    points: ["Define your variable clearly", "Check your answer in the original problem"],
  },
  "Two-Step Equations": {
    tip: "Undo addition/subtraction first, then multiplication/division.",
    points: ["2x + 3 = 11 → 2x = 8 → x = 4", "Reverse PEMDAS when solving"],
  },
  "Multi-Step Equations": {
    tip: "Simplify each side first (distribute, combine like terms), then solve.",
    points: ["Variables on both sides? Move them to one side first", "Check by substituting back"],
  },
  "One-Step Inequalities": {
    tip: "Solve like equations, but FLIP the sign when multiplying/dividing by a negative.",
    points: ["x + 3 > 7 → x > 4", "−2x < 6 → x > −3 (flipped!)"],
  },
  "Graphing Inequalities": {
    tip: "Open circle for < or >, closed circle for ≤ or ≥.",
    points: ["Shade right for > or ≥", "Shade left for < or ≤"],
  },
  "Two-Step Inequalities": {
    tip: "Same as two-step equations — just watch for sign flips.",
    points: ["3x − 1 ≥ 8 → 3x ≥ 9 → x ≥ 3", "Graph the solution on a number line"],
  },
  "Multi-Step Inequalities": {
    tip: "Distribute, combine like terms, then isolate the variable.",
    points: ["Remember to flip the inequality when dividing by a negative", "Always check with a test value"],
  },

  // Geometry & Solid Figures
  "Angles": {
    tip: "Acute < 90°, Right = 90°, Obtuse > 90°, Straight = 180°.",
    points: ["Complementary angles sum to 90°", "Supplementary angles sum to 180°"],
  },
  "Pythagorean Relationship": {
    tip: "a² + b² = c² (c is the hypotenuse — longest side).",
    points: ["Only works for RIGHT triangles", "Common triples: 3-4-5, 5-12-13, 8-15-17"],
  },
  "Triangles": {
    tip: "Angles in a triangle always sum to 180°.",
    points: ["Area = ½ × base × height", "Types: equilateral, isosceles, scalene"],
  },
  "Polygons": {
    tip: "Sum of interior angles = (n − 2) × 180° where n = number of sides.",
    points: ["Regular polygon: all sides and angles equal", "Pentagon = 5, Hexagon = 6, Octagon = 8"],
  },
  "Trapezoids": {
    tip: "Area = ½ × (base₁ + base₂) × height.",
    points: ["Has exactly one pair of parallel sides", "Height is perpendicular to the bases"],
  },
  "Circles": {
    tip: "C = πd or 2πr. A = πr².",
    points: ["π ≈ 3.14", "Diameter = 2 × radius"],
  },
  "Cubes": {
    tip: "V = s³ and SA = 6s².",
    points: ["All faces are squares", "A cube has 6 faces, 12 edges, 8 vertices"],
  },
  "Rectangular Prism": {
    tip: "V = l × w × h. SA = 2(lw + lh + wh).",
    points: ["A box shape — 6 rectangular faces", "Opposite faces are congruent"],
  },
  "Cylinder": {
    tip: "V = πr²h. SA = 2πr² + 2πrh.",
    points: ["Two circular bases + one curved surface", "Think of it like stacking circles"],
  },

  // Statistics & Probability
  "Mean and Median": {
    tip: "Mean = sum ÷ count. Median = middle value when sorted.",
    points: ["For even count, median = average of two middle values", "Mean is affected by outliers, median is not"],
  },
  "Mode and Range": {
    tip: "Mode = most frequent value. Range = max − min.",
    points: ["A data set can have no mode, one mode, or multiple modes", "Range shows spread of data"],
  },
  "Time Series": {
    tip: "Shows data points over time — look for trends, patterns, and seasonality.",
    points: ["X-axis = time, Y-axis = measured value", "Identify if the trend is increasing, decreasing, or stable"],
  },
  "Stem-and-Leaf Plot": {
    tip: "Stem = tens digit, Leaf = ones digit. Arrange leaves in order.",
    points: ["Every data point is shown (unlike histograms)", "Include a key: 3|5 = 35"],
  },
  "Quartile of a Data Set": {
    tip: "Q1 = median of lower half, Q2 = median, Q3 = median of upper half.",
    points: ["IQR = Q3 − Q1 (interquartile range)", "Quartiles split data into 4 equal parts"],
  },
  "Box and Whisker Plots": {
    tip: "Shows min, Q1, median, Q3, and max — the 5-number summary.",
    points: ["The box shows the middle 50% of data", "Whiskers extend to min and max"],
  },
  "Pie Graph": {
    tip: "Each slice represents a part of the whole — total = 100% or 360°.",
    points: ["Percentage × 360° = degrees for that slice", "Good for showing proportions"],
  },
  "Probability Problems": {
    tip: "P(event) = favorable outcomes ÷ total outcomes.",
    points: ["Probability ranges from 0 (impossible) to 1 (certain)", "P(not A) = 1 − P(A)"],
  },
};
