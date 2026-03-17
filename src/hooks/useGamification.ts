import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Achievement {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  category: string;
  xp_reward: number;
  condition_type: string;
  condition_value: number;
  is_active: boolean;
}

interface UserAchievement {
  id: string;
  achievement_id: string;
  unlocked_at: string;
}

interface UserXP {
  total_xp: number;
  level: number;
  streak_days: number;
  last_activity_at: string;
}

export function useGamification() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [userXP, setUserXP] = useState<UserXP | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [achRes, uaRes, xpRes] = await Promise.all([
        supabase.from('achievements').select('*').eq('is_active', true).order('category'),
        supabase.from('user_achievements').select('*').eq('user_id', user.id),
        supabase.from('user_xp').select('*').eq('user_id', user.id).maybeSingle(),
      ]);

      if (achRes.data) setAchievements(achRes.data as Achievement[]);
      if (uaRes.data) setUserAchievements(uaRes.data as UserAchievement[]);
      if (xpRes.data) {
        setUserXP(xpRes.data as UserXP);
      } else {
        // Create XP record if doesn't exist
        const { data } = await supabase
          .from('user_xp')
          .insert({ user_id: user.id })
          .select()
          .single();
        if (data) setUserXP(data as UserXP);
      }
    } catch (err) {
      console.error('Error fetching gamification data:', err);
    } finally {
      setLoading(false);
    }
  };

  const isUnlocked = (achievementId: string) =>
    userAchievements.some((ua) => ua.achievement_id === achievementId);

  const unlockedCount = userAchievements.length;
  const totalCount = achievements.length;
  const progressPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  const xpForNextLevel = userXP ? userXP.level * 100 : 100;
  const xpProgress = userXP ? (userXP.total_xp % 100) : 0;

  const categories = [...new Set(achievements.map((a) => a.category))];

  return {
    achievements,
    userAchievements,
    userXP,
    loading,
    isUnlocked,
    unlockedCount,
    totalCount,
    progressPercent,
    xpForNextLevel,
    xpProgress,
    categories,
    refetch: fetchAll,
  };
}
