import { supabase } from "@/integrations/supabase/client";

export interface Question {
  q: string;
  choices: string[];
  answer: number;
  exp: string;
  type: 1 | 2 | 3;
}

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
}

export interface GenerateResult {
  questions: Question[];
  token_usage: TokenUsage;
}

export async function generateQuestions(topic: string, domain: string): Promise<GenerateResult> {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-questions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ topic, domain }),
    }
  );

  if (response.status === 429) {
    throw new Error("Too many requests. Please wait a moment and try again.");
  }
  if (response.status === 402) {
    throw new Error("AI credits exhausted. Please add credits in your workspace settings.");
  }
  if (response.status === 403) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Your account has reached the usage limit. Please contact rj.yogeshwari@gmail.com.");
  }
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Something went wrong. Please try again in a few minutes.");
  }

  const data = await response.json();
  if (data?.error) throw new Error(data.error);
  return {
    questions: data.questions,
    token_usage: data.token_usage || { input_tokens: 0, output_tokens: 0 },
  };
}
