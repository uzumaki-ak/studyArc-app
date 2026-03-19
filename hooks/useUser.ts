import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useGameStore } from "@/store/gameStore";
import type { UserProfile } from "@/types";

export function useUser() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { setUser, setXP, setHearts, setStreak, setLevel } = useGameStore();

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) { setLoading(false); return; }

      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data && mounted) {
        setProfile(data);
        setUser(data.id, data.name, data.role);
        setXP(data.total_xp);
        setHearts(data.hearts);
        setStreak(data.streak_count);
        setLevel(data.level);
      }
      setLoading(false);
    }

    load();
    return () => { mounted = false; };
  }, []);

  return { profile, loading };
}
