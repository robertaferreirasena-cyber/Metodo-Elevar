import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAdmin } from './useAdmin';
import { toast } from 'sonner';

export interface CommunityMessage {
  id: string;
  user_id: string;
  content: string;
  message_type: string;
  attachment_url: string | null;
  is_pinned: boolean;
  reply_to_id: string | null;
  created_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
  isAdmin?: boolean;
  reactions?: { emoji: string; count: number; hasReacted: boolean }[];
  poll?: {
    id: string;
    question: string;
    options: { text: string; votes: number }[];
    userVote: number | null;
    totalVotes: number;
    endsAt?: string;
  };
  replyTo?: {
    id: string;
    content: string;
    authorName: string;
  };
}

export interface CommunityMaterial {
  id: string;
  uploaded_by: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string | null;
  downloads: number;
  created_at: string;
}

export function useCommunity() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [materials, setMaterials] = useState<CommunityMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!user) return;
    
    try {
      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('community_messages')
        .select(`
          *,
          profile:profiles!community_messages_user_id_fkey (
            full_name,
            email,
            avatar_url
          )
        `)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Fetch all reactions
      const { data: reactionsData } = await supabase
        .from('community_reactions')
        .select('*');

      // Fetch all polls
      const { data: pollsData } = await supabase
        .from('community_polls')
        .select('*');

      // Fetch all poll votes
      const { data: votesData } = await supabase
        .from('community_poll_votes')
        .select('*');

      // Fetch admin user IDs in one query
      const uniqueUserIds = [...new Set((messagesData || []).map(m => m.user_id))];
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')
        .in('user_id', uniqueUserIds);
      const adminUserIds = new Set((adminRoles || []).map(r => r.user_id));

      // Process messages with reactions, polls, and replies
      const messagesWithExtras = await Promise.all(
        (messagesData || []).map(async (msg) => {
          // Check if admin
          const adminCheck = adminUserIds.has(msg.user_id);

          // Process reactions
          const msgReactions = (reactionsData || []).filter(r => r.message_id === msg.id);
          const reactionMap = new Map<string, { count: number; hasReacted: boolean }>();
          msgReactions.forEach(r => {
            const existing = reactionMap.get(r.emoji) || { count: 0, hasReacted: false };
            reactionMap.set(r.emoji, {
              count: existing.count + 1,
              hasReacted: existing.hasReacted || r.user_id === user.id
            });
          });
          const reactions = Array.from(reactionMap.entries()).map(([emoji, data]) => ({
            emoji,
            ...data
          }));

          // Process poll if exists
          const poll = (pollsData || []).find(p => p.message_id === msg.id);
          let pollData = undefined;
          if (poll) {
            const pollVotes = (votesData || []).filter(v => v.poll_id === poll.id);
            const userVote = pollVotes.find(v => v.user_id === user.id);
            const options = (poll.options as string[]).map((text, index) => ({
              text,
              votes: pollVotes.filter(v => v.option_index === index).length
            }));
            pollData = {
              id: poll.id,
              question: poll.question,
              options,
              userVote: userVote ? userVote.option_index : null,
              totalVotes: pollVotes.length,
              endsAt: poll.ends_at
            };
          }

          // Get reply-to message
          let replyTo = undefined;
          if (msg.reply_to_id) {
            const replyMsg = messagesData?.find(m => m.id === msg.reply_to_id);
            if (replyMsg) {
              replyTo = {
                id: replyMsg.id,
                content: replyMsg.content.substring(0, 100),
                authorName: replyMsg.profile?.full_name || replyMsg.profile?.email?.split('@')[0] || 'Usuário'
              };
            }
          }

          return {
            ...msg,
            isAdmin: adminCheck === true,
            reactions,
            poll: pollData,
            replyTo
          };
        })
      );

      setMessages(messagesWithExtras);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, [user]);

  const fetchMaterials = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('community_materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (err) {
      console.error('Error fetching materials:', err);
    }
  }, []);

  const sendMessage = async (content: string, messageType: string = 'text', replyToId?: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('community_messages')
        .insert({
          user_id: user.id,
          content,
          message_type: messageType,
          reply_to_id: replyToId || null
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, messageId: data.id };
    } catch (err) {
      console.error('Error sending message:', err);
      return { error: err };
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('community_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      await fetchMessages();
      return { success: true };
    } catch (err) {
      console.error('Error deleting message:', err);
      return { error: err };
    }
  };

  const togglePinMessage = async (messageId: string, isPinned: boolean) => {
    if (!isAdmin) return { error: 'Not authorized' };

    try {
      const { error } = await supabase
        .from('community_messages')
        .update({ is_pinned: !isPinned })
        .eq('id', messageId);

      if (error) throw error;
      await fetchMessages();
      toast.success(isPinned ? 'Mensagem desafixada' : 'Mensagem fixada');
      return { success: true };
    } catch (err) {
      console.error('Error toggling pin:', err);
      return { error: err };
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('community_reactions')
        .insert({
          message_id: messageId,
          user_id: user.id,
          emoji
        });

      if (error) throw error;
      await fetchMessages();
      return { success: true };
    } catch (err) {
      console.error('Error adding reaction:', err);
      return { error: err };
    }
  };

  const removeReaction = async (messageId: string, emoji: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('community_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji);

      if (error) throw error;
      await fetchMessages();
      return { success: true };
    } catch (err) {
      console.error('Error removing reaction:', err);
      return { error: err };
    }
  };

  const createPoll = async (question: string, options: string[]) => {
    if (!isAdmin || !user) return { error: 'Not authorized' };

    try {
      // First create the message
      const { data: msgData, error: msgError } = await supabase
        .from('community_messages')
        .insert({
          user_id: user.id,
          content: `📊 Enquete: ${question}`,
          message_type: 'poll'
        })
        .select()
        .single();

      if (msgError) throw msgError;

      // Then create the poll
      const { error: pollError } = await supabase
        .from('community_polls')
        .insert({
          message_id: msgData.id,
          question,
          options
        });

      if (pollError) throw pollError;
      
      await fetchMessages();
      toast.success('Enquete criada!');
      return { success: true };
    } catch (err) {
      console.error('Error creating poll:', err);
      return { error: err };
    }
  };

  const votePoll = async (pollId: string, optionIndex: number) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('community_poll_votes')
        .select()
        .eq('poll_id', pollId)
        .eq('user_id', user.id)
        .single();

      if (existingVote) {
        // Update vote
        const { error } = await supabase
          .from('community_poll_votes')
          .update({ option_index: optionIndex })
          .eq('id', existingVote.id);
        if (error) throw error;
      } else {
        // Insert vote
        const { error } = await supabase
          .from('community_poll_votes')
          .insert({
            poll_id: pollId,
            user_id: user.id,
            option_index: optionIndex
          });
        if (error) throw error;
      }

      await fetchMessages();
      return { success: true };
    } catch (err) {
      console.error('Error voting poll:', err);
      return { error: err };
    }
  };

  const uploadMaterial = async (title: string, description: string, fileUrl: string, fileType: string) => {
    if (!isAdmin || !user) return { error: 'Not authorized' };

    try {
      const { error } = await supabase
        .from('community_materials')
        .insert({
          uploaded_by: user.id,
          title,
          description,
          file_url: fileUrl,
          file_type: fileType
        });

      if (error) throw error;
      await fetchMaterials();
      toast.success('Material adicionado com sucesso!');
      return { success: true };
    } catch (err) {
      console.error('Error uploading material:', err);
      return { error: err };
    }
  };

  const deleteMaterial = async (materialId: string) => {
    if (!isAdmin) return { error: 'Not authorized' };

    try {
      const { error } = await supabase
        .from('community_materials')
        .delete()
        .eq('id', materialId);

      if (error) throw error;
      await fetchMaterials();
      toast.success('Material removido');
      return { success: true };
    } catch (err) {
      console.error('Error deleting material:', err);
      return { error: err };
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMessages(), fetchMaterials()]);
      setLoading(false);
    };
    loadData();
  }, [fetchMessages, fetchMaterials]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('community-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_messages' },
        () => fetchMessages()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_reactions' },
        () => fetchMessages()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_poll_votes' },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages]);

  return {
    messages,
    materials,
    loading,
    sendMessage,
    deleteMessage,
    togglePinMessage,
    addReaction,
    removeReaction,
    createPoll,
    votePoll,
    uploadMaterial,
    deleteMaterial,
    isAdmin,
    currentUserId: user?.id
  };
}
