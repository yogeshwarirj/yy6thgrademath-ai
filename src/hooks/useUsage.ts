import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UsageStats {
  questions_generated: number;
  quizzes_taken: number;
  pdfs_downloaded: number;
  input_tokens: number;
  output_tokens: number;
}

export function useUsage() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    if (!user) { setUsage(null); setLoading(false); return; }
    const { data, error } = await supabase
      .from("user_usage")
      .select("questions_generated, quizzes_taken, pdfs_downloaded, input_tokens, output_tokens")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!data && !error) {
      // Row doesn't exist yet (user signed up before trigger), create it
      await supabase.from("user_usage").insert({ user_id: user.id });
      setUsage({ questions_generated: 0, quizzes_taken: 0, pdfs_downloaded: 0, input_tokens: 0, output_tokens: 0 });
    } else if (data) {
      setUsage(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchUsage(); }, [fetchUsage]);

  const increment = useCallback(async (field: keyof UsageStats, amount = 1) => {
    if (!user) return;
    // Optimistic update
    setUsage((prev) => prev ? { ...prev, [field]: prev[field] + amount } : prev);

    const { data: current } = await supabase
      .from("user_usage")
      .select(field)
      .eq("user_id", user.id)
      .single();

    if (current) {
      await supabase
        .from("user_usage")
        .update({ [field]: (current as any)[field] + amount, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
    }
  }, [user]);

  return { usage, loading, increment, refetch: fetchUsage };
}
