export interface JwtPayload {
  sub: string;
  roles: string[];
  tcknMasked: string;
  iat?: number;
  exp?: number;
}
