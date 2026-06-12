export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  /** Refresh token ömrü (ms) — cookie maxAge bununla hizalanır */
  refreshExpiresInMs: number;
}
