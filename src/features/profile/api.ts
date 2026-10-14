import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@/api/contracts/auth'
import type {
  ChangePasswordRequest,
  Profile,
  UpdateAvatarRequest,
  UpdateProfileRequest,
} from '@/api/contracts/profile'
import { httpClient } from '@/api/http-client'
import { privateQueryKey, SESSION_QUERY_KEY } from '@/features/auth/session-query'

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

export const profileApi = {
  update: async (body: UpdateProfileRequest) => (await httpClient.patch<Profile>('/me/profile', body)).data,
  uploadAvatar: async (body: UpdateAvatarRequest) => (await httpClient.put<Profile>('/me/avatar', body)).data,
  removeAvatar: async () => (await httpClient.delete<Profile>('/me/avatar')).data,
  changePassword: async (body: ChangePasswordRequest) => {
    await httpClient.post('/me/password', body)
  },
}

/**
 * Grava a resposta da API no cache do perfil e no usuário da sessão, para o
 * header (nome, e-mail, avatar) refletir a mudança sem nova requisição.
 */
function useApplyProfile(userId: string) {
  const queryClient = useQueryClient()
  return (profile: Profile) => {
    queryClient.setQueryData(profileQueryOptions(userId).queryKey, profile)
    queryClient.setQueryData<Session | null>(SESSION_QUERY_KEY, (session) =>
      session && session.user.id === profile.id
        ? {
            ...session,
            user: {
              ...session.user,
              displayName: profile.displayName,
              email: profile.email,
              avatarUrl: profile.avatarUrl,
            },
          }
        : session,
    )
  }
}

export function useUpdateProfile(userId: string) {
  const apply = useApplyProfile(userId)
  return useMutation({ mutationFn: profileApi.update, onSuccess: apply })
}

export function useUploadAvatar(userId: string) {
  const apply = useApplyProfile(userId)
  return useMutation({ mutationFn: profileApi.uploadAvatar, onSuccess: apply })
}

export function useRemoveAvatar(userId: string) {
  const apply = useApplyProfile(userId)
  return useMutation({ mutationFn: profileApi.removeAvatar, onSuccess: apply })
}

export function useChangePassword() {
  return useMutation({ mutationFn: profileApi.changePassword })
}
