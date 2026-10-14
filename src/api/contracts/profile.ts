/** GET /me/profile → 200 `Profile`. */
export interface Profile {
  id: string
  displayName: string
  username: string
  email: string
  bio: string
  avatarUrl: string | null
}

export type ProfileResponse = Profile

/** PATCH /me/profile → 200 `Profile` (422 VALIDATION_FAILED, 409 EMAIL_TAKEN). */
export interface UpdateProfileRequest {
  displayName?: string
  username?: string
  email?: string
  bio?: string
}

/** PUT /me/avatar → 200 `Profile`. `dataUrl` = imagem PNG/JPEG/WebP em data URL (até 300 KB). */
export interface UpdateAvatarRequest {
  dataUrl: string
}

/** POST /me/password → 204 (422 WRONG_PASSWORD / VALIDATION_FAILED). */
export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}
