import { queryOptions } from '@tanstack/react-query'
import type { Profile } from '@/api/contracts/profile'
import { httpClient } from '@/api/http-client'
import { privateQueryKey } from '@/features/auth/session-query'

export async function fetchProfile(signal?: AbortSignal): Promise<Profile> {
  const { data } = await httpClient.get<Profile>('/me/profile', { signal })
  return data
}

export function profileQueryOptions(userId: string) {
  return queryOptions({
    queryKey: privateQueryKey(userId, 'profile'),
    queryFn: ({ signal }) => fetchProfile(signal),
  })
}
