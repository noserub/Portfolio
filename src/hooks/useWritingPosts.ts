import { useCallback, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  getPortfolioOwnerUserId,
  getProfileWriterUserId,
} from '../lib/portfolioOwner';
import {
  defaultWritingPostInsert,
  mapWritingPostRow,
  type WritingPost,
  type WritingPostInsert,
  type WritingPostUpdate,
} from '../lib/writingPosts';
import { ensureUniqueWritingSlug, slugFromWritingTitle } from '../lib/writingSlug';
import { getPostgrestErrorMessage } from '../lib/supabaseClient';

export function useWritingPosts() {
  const [posts, setPosts] = useState<WritingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchGeneration = useRef(0);

  const fetchPosts = useCallback(async (includeDrafts = false) => {
    const generation = ++fetchGeneration.current;
    setLoading(true);
    setError(null);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const ownerId = getPortfolioOwnerUserId(authData.user?.id);

      if (includeDrafts && authData.user) {
        const { data, error: qError } = await supabase
          .from('writing_posts')
          .select('*')
          .order('sort_order', { ascending: false })
          .order('published_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false });

        if (qError) throw qError;
        if (generation !== fetchGeneration.current) return;
        setPosts((data || []).map((row) => mapWritingPostRow(row as Record<string, unknown>)));
      } else {
        const { data, error: rpcError } = await supabase.rpc('get_writing_posts_public', {
          p_owner_id: ownerId,
        });
        if (rpcError) throw rpcError;
        if (generation !== fetchGeneration.current) return;
        setPosts((data || []).map((row) => mapWritingPostRow(row as Record<string, unknown>)));
      }
    } catch (err) {
      if (generation !== fetchGeneration.current) return;
      console.error('Failed to load writing posts:', err);
      setError(getPostgrestErrorMessage(err));
      setPosts([]);
    } finally {
      if (generation === fetchGeneration.current) {
        setLoading(false);
      }
    }
  }, []);

  const refetch = useCallback(
    async (includeDrafts = false) => {
      await fetchPosts(includeDrafts);
    },
    [fetchPosts],
  );

  const createPost = useCallback(
    async (title: string): Promise<{ post: WritingPost | null; error: string | null }> => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user?.id) {
        const msg = 'Sign in to create writing posts.';
        setError(msg);
        return { post: null, error: msg };
      }
      const writerId = getProfileWriterUserId(authData.user.id);
      const { data: existing } = await supabase
        .from('writing_posts')
        .select('slug')
        .eq('user_id', writerId);
      const slugs = (existing || []).map((r) => String(r.slug));
      const slug = ensureUniqueWritingSlug(slugFromWritingTitle(title), slugs);
      const insert = defaultWritingPostInsert(writerId, title, slug);

      const { data, error: insertError } = await supabase
        .from('writing_posts')
        .insert(insert)
        .select('*')
        .single();

      if (insertError) {
        const msg = getPostgrestErrorMessage(insertError);
        setError(msg);
        return { post: null, error: msg };
      }
      const post = mapWritingPostRow(data as Record<string, unknown>);
      setPosts((prev) => [post, ...prev]);
      return { post, error: null };
    },
    [],
  );

  const updatePost = useCallback(async (id: string, patch: WritingPostUpdate): Promise<boolean> => {
    const { data, error: updateError } = await supabase
      .from('writing_posts')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      setError(getPostgrestErrorMessage(updateError));
      return false;
    }
    const updated = mapWritingPostRow(data as Record<string, unknown>);
    setPosts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return true;
  }, []);

  const deletePost = useCallback(
    async (id: string): Promise<{ ok: boolean; error: string | null }> => {
      const { data, error: deleteError } = await supabase
        .from('writing_posts')
        .delete()
        .eq('id', id)
        .select('id');

      if (deleteError) {
        const msg = getPostgrestErrorMessage(deleteError);
        setError(msg);
        return { ok: false, error: msg };
      }

      if (!data?.length) {
        const msg =
          'Could not delete this post. It may belong to another profile row (sample posts from setup).';
        setError(msg);
        return { ok: false, error: msg };
      }

      setPosts((prev) => prev.filter((p) => p.id !== id));
      return { ok: true, error: null };
    },
    [],
  );

  const publishedPosts = useMemo(() => posts.filter((p) => p.published), [posts]);

  return {
    posts,
    publishedPosts,
    loading,
    error,
    refetch,
    createPost,
    updatePost,
    deletePost,
  };
}

export type { WritingPost, WritingPostInsert, WritingPostUpdate };
