import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, domain } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Check user's cost limit before generating
    const authHeader = req.headers.get("Authorization");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (authHeader && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      // Get the user's JWT token
      const token = authHeader.replace("Bearer ", "");
      
      // Decode JWT to get user ID (verify with Supabase)
      const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_SERVICE_ROLE_KEY },
      });
      
      if (userRes.ok) {
        const userData = await userRes.json();
        const userId = userData.id;
        
        // Fetch user's token usage
        const usageRes = await fetch(
          `${SUPABASE_URL}/rest/v1/user_usage?user_id=eq.${userId}&select=input_tokens,output_tokens`,
          {
            headers: {
              apikey: SUPABASE_SERVICE_ROLE_KEY,
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
          }
        );
        
        if (usageRes.ok) {
          const usageData = await usageRes.json();
          if (usageData.length > 0) {
            const { input_tokens, output_tokens } = usageData[0];
            const estimatedCost = (input_tokens * 0.15 / 1_000_000) + (output_tokens * 0.60 / 1_000_000);
            
            if (estimatedCost >= 10) {
              return new Response(
                JSON.stringify({ error: "Your account has reached the $10 usage limit. Please contact rj.yogeshwari@gmail.com for assistance." }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
          }
        }
      }
    }

    const systemPrompt = `You are an expert item writer for the New Jersey Student Learning Assessment (NJSLA) Grade 6 Mathematics test. You create questions that precisely match the rigor, complexity, and format of actual NJSLA released test items and Lumos Learning NJSLA practice questions.

You MUST follow these 2023 NJSLS-Mathematics Grade 6 standards exactly:

DOMAIN STANDARDS:
- 6.RP (Ratios & Proportional Relationships): Understand ratio concepts (6.RP.A.1), unit rates (6.RP.A.2), use ratio reasoning with tables/tape diagrams/double number lines/equations (6.RP.A.3), convert measurement units (6.RP.A.3.D)
- 6.NS (The Number System): Divide fractions by fractions (6.NS.A.1), multi-digit division (6.NS.B.2), multi-digit decimal operations (6.NS.B.3), GCF/LCM (6.NS.B.4), positive/negative numbers (6.NS.C.5), rational numbers on number line (6.NS.C.6), ordering/absolute value (6.NS.C.7), coordinate plane (6.NS.C.8)
- 6.EE (Expressions & Equations): Whole-number exponents (6.EE.A.1), write/read/evaluate expressions (6.EE.A.2), equivalent expressions via properties (6.EE.A.3-4), solve equations x+p=q and px=q (6.EE.B.7), write inequalities (6.EE.B.8), dependent/independent variables (6.EE.C.9)
- 6.G (Geometry): Area of triangles/quadrilaterals/polygons (6.G.A.1), volume of rectangular prisms with fractional edges (6.G.A.2), polygons on coordinate plane (6.G.A.3), nets and surface area (6.G.A.4)
- 6.SP (Statistics & Probability): Statistical questions (6.SP.A.1), distribution center/spread/shape (6.SP.A.2-3), dot plots/histograms/box plots (6.SP.B.4), measures of center and variability (6.SP.B.5)

You MUST return ONLY a valid JSON array with no other text, no markdown, no code fences.`;

    const userPrompt = `Generate exactly 20 multiple-choice questions for the topic: "${topic}" (domain: ${domain}).

CRITICAL REQUIREMENTS — Follow these NJSLA released-item characteristics exactly:

1. QUESTION COMPLEXITY (match actual NJSLA rigor):
    - DOK 1 (4-5 questions): Direct recall/computation. Example: "What is the value of 3⁴?" or "What is the GCF of 24 and 36?"
   - DOK 2 (10-12 questions): Application requiring 2+ steps or conceptual understanding. Example: "A store sells 3 bags of apples for $7.50. At this rate, how much would 5 bags cost?" or "Which expression is equivalent to 4(3x + 2) − 5x?"
   - DOK 3 (4-5 questions): Strategic reasoning requiring analysis, justification, or interpretation. Example: "Marcus says that −8 is greater than −3 because 8 > 3. Which statement best explains why Marcus is incorrect?" or "The table shows the relationship between x and y. Which equation represents this relationship? Justify your answer."

2. AUTHENTIC NJSLA QUESTION PATTERNS (from released items & Lumos Learning):
   - "Which expression is equivalent to ___?"
   - "What is the value of the expression ___?"
   - "Which statement about ___ is true?"
   - "The table below shows ___. Based on the table, which ___ ?"
   - "A student claims that ___. Is the student correct? Which explanation supports your answer?"
   - "Which number line correctly represents ___?"
   - "Part A: [question]. Part B: Which evidence supports your answer in Part A?" (combine both parts into one question with the Part B reasoning embedded in choices)
   - "Select ALL the statements that are true about ___" (adapt to 4 choices with one correct)
   - Multi-step word problems with realistic contexts (shopping, cooking, distance, sports, construction, recipes, temperatures)

3. DISTRACTOR DESIGN (critical for NJSLA authenticity):
   - Each wrong answer MUST represent a specific common Grade 6 misconception:
     * Sign errors with negatives (e.g., −3 − 5 = −2 instead of −8)
     * Order of operations mistakes (e.g., evaluating left-to-right ignoring precedence)
     * Fraction/decimal conversion errors (e.g., 3/8 = 0.38)
     * Ratio setup errors (e.g., swapping part-to-part with part-to-whole)
     * Confusing GCF with LCM
     * Forgetting to distribute negative signs
     * Area vs perimeter confusion
     * Absolute value misunderstanding (thinking |−5| = −5)
   - Distractors should be numerically close to the correct answer, not obviously wrong

4. FORMAT RULES:
   - Question stem: 15-60 words, clear and precise
   - Use precise NJSLA vocabulary: "evaluate", "equivalent", "determine", "represent", "simplify", "justify", "interpret", "analyze"
   - Include specific numbers, not vague scenarios
   - Choices: concise (1-15 words each), exactly 4 options
   - Explanation: 1-3 sentences showing the solution method AND explaining why common wrong answers are incorrect

5. SAMPLE REFERENCE QUESTIONS (model your output after these):

   Example 1 (6.RP - DOK 2): "A recipe calls for 2 cups of flour for every 3 cups of sugar. If Maria uses 9 cups of sugar, how many cups of flour does she need?"
   Choices: ["4 cups", "6 cups", "12 cups", "13.5 cups"]
   Answer: 1 (6 cups)
   Explanation: "Set up the proportion 2/3 = x/9. Cross multiply: 3x = 18, so x = 6. The distractor 4 comes from subtracting instead of using ratios. 13.5 reverses the ratio."

   Example 2 (6.EE - DOK 3): "A student claims that the expressions 3(x + 4) and 3x + 4 are equivalent. Which statement best explains whether the student is correct?"
   Choices: ["The student is correct because both expressions contain 3x and 4.", "The student is correct because multiplication distributes over addition.", "The student is incorrect because 3(x + 4) = 3x + 12, not 3x + 4.", "The student is incorrect because 3(x + 4) = 3x + 7, not 3x + 4."]
   Answer: 2
   Explanation: "Using the distributive property, 3(x + 4) = 3x + 12. The student only multiplied x by 3 but did not distribute to the 4."

   Example 3 (6.NS - DOK 2): "Which list shows the integers in order from least to greatest? −7, 3, −2, 0, 5"
   Choices: ["−7, −2, 0, 3, 5", "−2, −7, 0, 3, 5", "0, −2, −7, 3, 5", "5, 3, 0, −2, −7"]
   Answer: 0
   Explanation: "On a number line, −7 is farthest left, then −2, then 0, 3, 5. The distractor −2, −7 reverses negative order, a common mistake of comparing absolute values."

6. ITEM TYPE CLASSIFICATION (NJSLA uses three item types):
   - Type I (DOK 1): Recall & basic computation — tag as "type": 1
   - Type II (DOK 2): Application & multi-step reasoning — tag as "type": 2
   - Type III (DOK 3): Strategic thinking & justification — tag as "type": 3
   Each question MUST include a "type" field (1, 2, or 3) matching its DOK level.

ANSWER ACCURACY — THIS IS THE MOST CRITICAL REQUIREMENT:
- You MUST solve each problem yourself step-by-step BEFORE writing the choices.
- Double-check every calculation. Verify the correct answer is mathematically accurate.
- The "answer" field MUST point to the genuinely correct choice. Verify by substituting back.
- Common AI mistakes to avoid: copying the wrong index, swapping correct/incorrect choices, arithmetic errors in multi-step problems, sign errors with negatives.
- If a question involves computation, show your work internally and confirm the numerical answer before assigning the index.

MANDATORY VERIFICATION PASS:
After generating ALL 20 questions, you MUST perform a complete verification pass before outputting:
1. Re-solve every single question from scratch using only the question stem and choices.
2. Confirm that your re-solved answer matches the "answer" index you assigned.
3. If ANY mismatch is found, fix the "answer" index to match the genuinely correct choice.
4. Verify that every explanation correctly describes the solution method and matches the correct choice.
5. Check that no two questions are duplicates or near-duplicates.
Only after this full verification pass should you output the final JSON.

Return ONLY a valid JSON array:
[{ "q": "...", "choices": ["A","B","C","D"], "answer": 0, "exp": "...", "type": 1 }]
"answer" is the 0-based index of the correct choice. "type" is the NJSLA item type (1, 2, or 3).`;

    const MAX_ATTEMPTS = 3;
    let lastError = "";

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 3000));
      }

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-2.5-flash-preview-04-17",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 16000,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          if (attempt < MAX_ATTEMPTS - 1) {
            console.log(`Rate limited on attempt ${attempt + 1}, retrying...`);
            await new Promise((r) => setTimeout(r, 5000));
            continue;
          }
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in your workspace settings." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const text = await response.text();
        console.error("AI gateway error:", response.status, text);
        lastError = "Failed to generate questions";
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        lastError = "No content in AI response";
        continue;
      }

      // Parse the JSON from the response, stripping any markdown fences
      let cleaned = content.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }

      try {
        const questions = JSON.parse(cleaned);
        
        // Validate we got an array of 30 questions with proper structure
        if (!Array.isArray(questions)) {
          lastError = "Response is not an array";
          continue;
        }
        
        // Filter to only valid questions
        const validQuestions = questions.filter((q: any) => 
          q && typeof q.q === "string" && 
          Array.isArray(q.choices) && q.choices.length === 4 &&
          typeof q.answer === "number" && q.answer >= 0 && q.answer <= 3 &&
          typeof q.exp === "string"
        ).map((q: any) => ({
          ...q,
          type: [1, 2, 3].includes(q.type) ? q.type : 2, // default to Type II if missing
        }));

        if (validQuestions.length < 12) {
          lastError = `Only ${validQuestions.length} valid questions generated, need at least 12`;
          continue;
        }

        // Return exactly 20 or however many valid ones we got (up to 20)
        const finalQuestions = validQuestions.slice(0, 20);
        
        const usage = data.usage;
        return new Response(JSON.stringify({ 
          questions: finalQuestions,
          token_usage: {
            input_tokens: usage?.prompt_tokens || 0,
            output_tokens: usage?.completion_tokens || 0,
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (parseErr) {
        console.error(`JSON parse failed (attempt ${attempt + 1}):`, parseErr);
        lastError = "Failed to parse AI response, retrying...";
        continue;
      }
    }

    return new Response(JSON.stringify({ error: lastError || "Failed to generate questions after retries" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-questions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
