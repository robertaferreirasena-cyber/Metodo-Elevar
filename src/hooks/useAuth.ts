import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { setCurrentUserId } from '@/lib/userScopedKey';
import { clearUserScopedCaches } from '@/lib/clearUserScopedCaches';
import { queryClient } from '@/lib/queryClient';

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

interface Subscription {
  id: string;
  plan: 'free' | 'pro';
  status: 'active' | 'canceled' | 'expired';
  started_at: string;
  expires_at: string | null;
}

const LAST_USER_KEY = 'last_user_id';

/** Detects user switch (or fresh boot with a different user) and wipes caches. */
function handleUserTransition(newId: string | null, lastId: string | null) {
  if (newId !== lastId) {
    // Any change of identity (login, logout, switch) → nuke everything.
    clearUserScopedCaches({ allUsers: true });
    try {
      if (newId) localStorage.setItem(LAST_USER_KEY, newId);
      else localStorage.removeItem(LAST_USER_KEY);
    } catch { /* ignore */ }
  }
  setCurrentUserId(newId);
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        try {
          if (!isMounted) return;

          const newId = session?.user?.id ?? null;
          const oldId = lastUserIdRef.current;
          lastUserIdRef.current = newId;
          handleUserTransition(newId, oldId);

          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            setTimeout(() => {
              if (isMounted) fetchUserData(session.user.id);
            }, 0);
          } else {
            setProfile(null);
            setSubscription(null);
          }
        } catch (error) {
          console.error("Error in auth state change:", error);
          if (isMounted) setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!isMounted) return;

        const bootedId = session?.user?.id ?? null;
        let lastSeen: string | null = null;
        try { lastSeen = localStorage.getItem(LAST_USER_KEY); } catch { /* ignore */ }
        lastUserIdRef.current = bootedId;
        handleUserTransition(bootedId, lastSeen);

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          fetchUserData(session.user.id);
        } else {
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("Error getting session:", error);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      authSubscription.unsubscribe();
    };
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (profileData) setProfile(profileData as Profile);

      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (subscriptionData) setSubscription(subscriptionData as Subscription);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl, data: { full_name: fullName || '' } },
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    // Defensive: clear any stale caches BEFORE attempting login.
    clearUserScopedCaches({ allUsers: true });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      // After successful login, ensure no React Query state from anonymous/previous user remains.
      try { queryClient.clear(); } catch { /* ignore */ }
    }
    return { data, error };
  };

  const signOut = async () => {
    // Wipe BEFORE Supabase signOut so token still exists for any in-flight cancel.
    clearUserScopedCaches({ allUsers: true });
    setCurrentUserId(null);
    lastUserIdRef.current = null;
    try { localStorage.removeItem(LAST_USER_KEY); } catch { /* ignore */ }

    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
      setProfile(null);
      setSubscription(null);
      // Final sweep — ensures nothing reidratates.
      clearUserScopedCaches({ allUsers: true });
    }
    return { error };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/reset-password`;
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl });
    return { data, error };
  };

  const updatePassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    return { data, error };
  };

  const isPro = subscription?.plan === 'pro' && subscription?.status === 'active';

  return {
    user,
    session,
    profile,
    subscription,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    isPro,
  };
}
