import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface LearningModule {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  category: string | null;
  position: number;
  is_active: boolean | null;
  total_lessons: number;
  created_at: string | null;
}

interface LearningLesson {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  position: number;
  duration_minutes: number;
  is_active: boolean | null;
  created_at: string | null;
}

interface UserProgress {
  lesson_id: string;
  completed: boolean;
}

export function useLearning() {
  const { user } = useAuth();
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [lessons, setLessons] = useState<LearningLesson[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [modulesRes, lessonsRes, progressRes] = await Promise.all([
        supabase.from('learning_modules').select('*').eq('is_active', true).order('position'),
        supabase.from('learning_lessons').select('*').eq('is_active', true).order('position'),
        supabase.from('user_module_progress').select('lesson_id, completed').eq('user_id', user!.id),
      ]);

      if (modulesRes.data) setModules(modulesRes.data);
      if (lessonsRes.data) setLessons(lessonsRes.data);
      if (progressRes.data) setProgress(progressRes.data);

      if (modulesRes.data?.length && !selectedModuleId) {
        setSelectedModuleId(modulesRes.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching learning data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLessonComplete = async (lessonId: string) => {
    if (!user) return;
    const existing = progress.find(p => p.lesson_id === lessonId);

    if (existing) {
      await supabase
        .from('user_module_progress')
        .update({ completed: !existing.completed, completed_at: !existing.completed ? new Date().toISOString() : null })
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId);

      setProgress(prev => prev.map(p => p.lesson_id === lessonId ? { ...p, completed: !p.completed } : p));
    } else {
      await supabase
        .from('user_module_progress')
        .insert({ user_id: user.id, lesson_id: lessonId, completed: true, completed_at: new Date().toISOString() });

      setProgress(prev => [...prev, { lesson_id: lessonId, completed: true }]);
    }
  };

  const getModuleLessons = (moduleId: string) => lessons.filter(l => l.module_id === moduleId);

  const getModuleProgress = (moduleId: string) => {
    const moduleLessons = getModuleLessons(moduleId);
    if (!moduleLessons.length) return 0;
    const completed = moduleLessons.filter(l => progress.find(p => p.lesson_id === l.id && p.completed)).length;
    return Math.round((completed / moduleLessons.length) * 100);
  };

  const totalProgress = (() => {
    if (!lessons.length) return 0;
    const completed = lessons.filter(l => progress.find(p => p.lesson_id === l.id && p.completed)).length;
    return Math.round((completed / lessons.length) * 100);
  })();

  return {
    modules,
    lessons,
    progress,
    loading,
    selectedModuleId,
    setSelectedModuleId,
    toggleLessonComplete,
    getModuleLessons,
    getModuleProgress,
    totalProgress,
  };
}
