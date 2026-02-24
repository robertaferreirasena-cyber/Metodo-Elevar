import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        try {
          if (!isMounted) return;
          
          setSession(session);
          setUser(session?.user ?? null);
          
          // Defer profile/subscription fetch with setTimeout
          if (session?.user) {
            setTimeout(() => {
              if (isMounted) {
                fetchUserData(session.user.id);
              }
            }, 0);
          } else {
            setProfile(null);
            setSubscription(null);
          }
        } catch (error) {
          console.error("Error in auth state change:", error);
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!isMounted) return;
        
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
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      authSubscription.unsubscribe();
    };
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as Profile);
      }

      // Fetch subscription
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (subscriptionData) {
        setSubscription(subscriptionData as Subscription);
      }
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
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName || '',
        },
      },
    });

    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
      setProfile(null);
      setSubscription(null);
    }
    return { error };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/reset-password`;
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    return { data, error };
  };

  const updatePassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

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
