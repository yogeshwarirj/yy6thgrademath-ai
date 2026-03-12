import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  deactivated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  deactivated: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [deactivated, setDeactivated] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check cost limit and sign out if exceeded
  useEffect(() => {
    if (!session?.user) return;
    const checkCost = async () => {
      const { data } = await supabase
        .from("user_usage")
        .select("input_tokens, output_tokens")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (data) {
        const cost = (data.input_tokens * 0.15 / 1_000_000) + (data.output_tokens * 0.60 / 1_000_000);
        if (cost >= 10) {
          setDeactivated(true);
          toast.error("Your account has been deactivated due to reaching the $10 usage limit. Contact rj.yogeshwari@gmail.com for assistance.");
          await supabase.auth.signOut();
        }
      }
    };
    checkCost();
  }, [session?.user]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut, deactivated }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
