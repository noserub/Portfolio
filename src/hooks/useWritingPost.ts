import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getPortfolioOwnerUserId } from '../lib/portfolioOwner';
import { mapWritingPostRow, type WritingPost } from '../lib/writingPosts';
import { normalizeWritingSlug } from '../lib/writingSlug';
import { getPostgrestErrorMessage } from '../lib/supabaseClient';

export function useWritingPost(slug: string | null, options?: { includeDrafts?: boolean }) {
  const [post, setPost] = useState<WritingPost | null>(null);
  const [loading, setLoading] = useState(Boolean(slug));
  const [error, setError] = useState<string | null>(null);
  const includeDrafts = options?.includeDrafts ?? false;

  const fetchPost = useCallback(async () => {
    if (!slug) {
      setPost(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const normalized = normalizeWritingSlug(slug);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const ownerId = getPortfolioOwnerUserId(authData.user?.id);

      if (includeDrafts && authData.user) {
        const { data, error: qError } = await supabase
          .from('writing_posts')
          .select('*')
          .eq('user_id', ownerId)
          .eq('slug', normalized)
          .maybeSingle();
        if (qError) throw qError;
        setPost(data ? mapWritingPostRow(data as Record<string, unknown>) : null);
        return;
      }

      const { data, error: rpcError } = await supabase.rpc('get_writing_post_by_slug_public', {
        p_slug: normalized,
        p_owner_id: ownerId,
      });
      if (rpcError) throw rpcError;
      const row = Array.isArray(data) ? data[0] : data;
      setPost(row ? mapWritingPostRow(row as Record<string, unknown>) : null);
    } catch (err) {
      console.error('Failed to load writing post:', err);
      setError(getPostgrestErrorMessage(err));
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, [slug, includeDrafts]);

  useEffect(() => {
    void fetchPost();
  }, [fetchPost]);

  return { post, loading, error, refetch: fetchPost, setPost };
}
