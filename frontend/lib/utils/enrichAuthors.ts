import { fetchPublicUserById } from '@/lib/api/users';
import { fetchProfileById } from '@/lib/api/profile';

export interface AuthorMaps {
  authorMap: Map<string, string>;
  avatarMap: Map<string, string | null | undefined>;
}

/**
 * Fetches usernames and avatar URLs for a list of user IDs in parallel.
 * Missing or failed lookups are silently skipped.
 */
export async function enrichAuthors(ids: string[]): Promise<AuthorMaps> {
  if (ids.length === 0) return { authorMap: new Map(), avatarMap: new Map() };

  const [userResults, profileResults] = await Promise.all([
    Promise.allSettled(ids.map(fetchPublicUserById)),
    Promise.allSettled(ids.map(fetchProfileById)),
  ]);

  const authorMap = new Map<string, string>();
  const avatarMap = new Map<string, string | null | undefined>();

  userResults.forEach((r, i) => {
    if (r.status === 'fulfilled') authorMap.set(ids[i], r.value.username);
  });
  profileResults.forEach((r, i) => {
    if (r.status === 'fulfilled') avatarMap.set(ids[i], r.value.avatar_url ?? null);
  });

  return { authorMap, avatarMap };
}
