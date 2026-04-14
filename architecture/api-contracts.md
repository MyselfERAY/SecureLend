# SecureLend — API Endpoint Şemaları

> Tüm endpoint'lerin özeti. Detaylı bilgi için `modules/<modül>.md` dosyasına bakın.

## Base URL
- Production: `https://securelend-production.up.railway.app`
- Custom Domain: `https://api.kiraguvence.com`
- Development: `http://localhost:4000`
- API Prefix: `/api/v1/`

## Authentication
- Bearer JWT token (Authorization header)
- Refresh token: httpOnly cookie (`__rt`)
- Service API Key: `x-api-key` header (agent'lar için)

---

## Health
| Method | Endpoint | Auth | Throttle |
|--------|----------|------|----------|
| GET | `/health` | Public | Yok |

## Auth
| Method | Endpoint | Auth | Throttle |
|--------|----------|------|----------|
| POST | `/api/v1/auth/register` | Public | 1/5sec |
| POST | `/api/v1/auth/login` | Public | 1/5sec |
| POST | `/api/v1/auth/verify-otp` | Public | 3/60sec |
| POST | `/api/v1/auth/refresh` | Public | 3/10sec |
| POST | `/api/v1/auth/logout` | JWT | — |

## User
| Method | Endpoint | Auth | Throttle |
|--------|----------|------|----------|
| GET | `/api/v1/users/dashboard` | JWT | — |
| GET | `/api/v1/users/search?phone=` | LANDLORD/ADMIN | 2/30sec |
| GET | `/api/v1/users/me` | JWT | — |
| PATCH | `/api/v1/users/me` | JWT | 2/5sec |
| POST | `/api/v1/users/me/roles` | JWT | 1/10sec |
| POST | `/api/v1/users/me/onboarding-complete` | JWT | 2/5sec |
| POST | `/api/v1/users/me/kyc` | JWT | 1/30sec |
| POST | `/api/v1/users/push-token` | JWT | — |

## Property
| Method | Endpoint | Auth | Throttle |
|--------|----------|------|----------|
| POST | `/api/v1/properties` | JWT | 2/10sec |
| GET | `/api/v1/properties/my` | JWT | — |
| GET | `/api/v1/properties/search?city=&district=&minRent=&maxRent=` | JWT | — |
| GET | `/api/v1/properties/:id` | JWT | — |
| PATCH | `/api/v1/properties/:id` | JWT | 2/10sec |
| DELETE | `/api/v1/properties/:id` | JWT | 1/10sec |

## Contract
| Method | Endpoint | Auth | Throttle |
|--------|----------|------|----------|
| POST | `/api/v1/contracts` | LANDLORD | 1/10sec |
| GET | `/api/v1/contracts` | JWT | — |
| GET | `/api/v1/contracts/:id` | JWT | — |
| GET | `/api/v1/contracts/:id/pdf` | JWT | — |
| POST | `/api/v1/contracts/:id/sign` | JWT | 1/30sec |
| POST | `/api/v1/contracts/:id/upload-document` | JWT | — |
| POST | `/api/v1/contracts/:id/activate` | JWT | — |
| POST | `/api/v1/contracts/:id/terminate` | JWT | — |

## Payment
| Method | Endpoint | Auth | Throttle |
|--------|----------|------|----------|
| GET | `/api/v1/contracts/:contractId/payments` | JWT | — |
| GET | `/api/v1/payments/summary/:contractId` | JWT | — |
| GET | `/api/v1/payments/my` | JWT | — |
| POST | `/api/v1/payments/:id/process` | JWT | 1/30sec |

## Bank (KMH)
| Method | Endpoint | Auth | Throttle |
|--------|----------|------|----------|
| POST | `/api/v1/bank/kmh/apply` | JWT | 2/10sec |
| POST | `/api/v1/bank/kmh/:id/accept-offer` | JWT | — |
| POST | `/api/v1/bank/kmh/:id/complete-onboarding` | JWT | — |
| POST | `/api/v1/bank/kmh/:id/cancel` | JWT | — |
| GET | `/api/v1/bank/kmh/my-applications` | JWT | — |
| GET | `/api/v1/bank/kmh/:id` | JWT | — |
| POST | `/api/v1/bank/kmh/:id/kyc/start` | JWT | — |
| POST | `/api/v1/bank/kmh/:id/kyc/verify-id` | JWT | — |
| POST | `/api/v1/bank/kmh/:id/kyc/verify-selfie` | JWT | — |
| POST | `/api/v1/bank/kmh/:id/kyc/complete-video` | JWT | — |
| POST | `/api/v1/bank/kmh/:id/kyc/sign-agreements` | JWT | — |
| GET | `/api/v1/bank/kmh/:id/kyc/status` | JWT | — |
| GET | `/api/v1/bank/accounts` | JWT | — |
| GET | `/api/v1/bank/accounts/:id/balance` | JWT | — |
| GET | `/api/v1/bank/accounts/:id/transactions` | JWT | — |

## Chat
| Method | Endpoint | Auth | Throttle |
|--------|----------|------|----------|
| GET | `/api/v1/chat/rooms` | JWT | — |
| POST | `/api/v1/chat/rooms/contract/:contractId` | JWT | 5/10sec |
| POST | `/api/v1/chat/rooms/support` | JWT | 3/10sec |
| GET | `/api/v1/chat/admin/support-rooms` | ADMIN | — |
| GET | `/api/v1/chat/rooms/:roomId/messages` | JWT | — |
| POST | `/api/v1/chat/rooms/:roomId/messages` | JWT | 10/10sec |
| POST | `/api/v1/chat/rooms/:roomId/read` | JWT | — |
| GET | `/api/v1/chat/unread-count` | JWT | — |

## Notification
| Method | Endpoint | Auth | Throttle |
|--------|----------|------|----------|
| GET | `/api/v1/notifications` | JWT | — |
| GET | `/api/v1/notifications/unread-count` | JWT | — |
| PATCH | `/api/v1/notifications/:id/read` | JWT | — |
| PATCH | `/api/v1/notifications/read-all` | JWT | — |

## Consent
| Method | Endpoint | Auth | Throttle |
|--------|----------|------|----------|
| GET | `/api/v1/consents/my` | JWT | — |
| GET | `/api/v1/consents/check/:type` | JWT | — |
| POST | `/api/v1/consents` | JWT | — |

## Application
| Method | Endpoint | Auth | Throttle |
|--------|----------|------|----------|
| POST | `/api/v1/applications` | Public | 1/2sec |
| GET | `/api/v1/applications/:id` | JWT | — |

## Tenant Score
| Method | Endpoint | Auth | Throttle |
|--------|----------|------|----------|
| GET | `/api/v1/tenant-score/me` | JWT | — |
| GET | `/api/v1/tenant-score/:tenantId` | LANDLORD | — |

## Article
| Method | Endpoint | Auth | Throttle |
|--------|----------|------|----------|
| GET | `/api/v1/articles` | Public | — |
| GET | `/api/v1/articles/latest` | Public | — |
| GET | `/api/v1/articles/:slug` | Public | — |
| GET | `/api/v1/articles/admin/drafts` | ADMIN | — |
| GET | `/api/v1/articles/admin/all` | ADMIN | — |
| POST | `/api/v1/articles` | ADMIN/SERVICE | — |
| PATCH | `/api/v1/articles/:id/publish` | ADMIN | — |
| PATCH | `/api/v1/articles/:id/unpublish` | ADMIN | — |
| DELETE | `/api/v1/articles/:id` | ADMIN | — |

## Promo
| Method | Endpoint | Auth | Throttle |
|--------|----------|------|----------|
| GET | `/api/v1/promos/active` | Public | — |
| GET | `/api/v1/promos/my` | JWT | — |
| GET | `/api/v1/promos/templates` | ADMIN | — |
| POST | `/api/v1/promos/templates` | ADMIN | 2/10sec |
| PATCH | `/api/v1/promos/templates/:id` | ADMIN | 3/10sec |
| POST | `/api/v1/promos/templates/:id/toggle` | ADMIN | 3/10sec |
| POST | `/api/v1/promos/assign` | ADMIN | 2/10sec |
| GET | `/api/v1/promos/referral` | JWT | — |
| GET | `/api/v1/promos/stats` | ADMIN | — |

## Newsletter
| Method | Endpoint | Auth | Throttle |
|--------|----------|------|----------|
| POST | `/api/v1/newsletter/subscribe` | Public | 3/60sec |
| POST | `/api/v1/newsletter/unsubscribe` | Public | 3/60sec |
| GET | `/api/v1/newsletter/subscribers` | ADMIN | — |
| GET | `/api/v1/newsletter/stats` | ADMIN | — |

## Analytics
| Method | Endpoint | Auth | Throttle |
|--------|----------|------|----------|
| POST | `/api/v1/analytics/track` | Public | 30/10sec |
| POST | `/api/v1/analytics/track/batch` | Public | 10/10sec |
| GET | `/api/v1/analytics/dashboard` | ADMIN | — |
| GET | `/api/v1/analytics/api-dashboard` | ADMIN | — |
| GET | `/api/v1/analytics/extended` | ADMIN | — |

## Admin
| Method | Endpoint | Auth | Throttle |
|--------|----------|------|----------|
| GET | `/api/v1/admin/overview` | ADMIN | — |
| GET | `/api/v1/admin/users` | ADMIN | — |
| GET | `/api/v1/admin/contracts` | ADMIN | — |
| GET | `/api/v1/admin/payments` | ADMIN | — |
| GET | `/api/v1/admin/activation-funnel` | ADMIN | — |
| GET | `/api/v1/admin/commissions` | ADMIN | — |
| GET | `/api/v1/admin/commissions/export` | ADMIN | — |

## Agent System
| Method | Endpoint | Auth | Throttle |
|--------|----------|------|----------|
| POST | `/api/v1/agent-runs` | ADMIN/SERVICE | — |
| PATCH | `/api/v1/agent-runs/:id` | ADMIN/SERVICE | — |
| GET | `/api/v1/agent-runs` | ADMIN/SERVICE | — |
| GET | `/api/v1/agent-runs/stats` | ADMIN/SERVICE | — |
| GET | `/api/v1/suggestions` | ADMIN/SERVICE | — |
| POST | `/api/v1/suggestions` | ADMIN/SERVICE | — |
| PATCH | `/api/v1/suggestions/:id` | ADMIN/SERVICE | — |
| DELETE | `/api/v1/suggestions/:id` | ADMIN/SERVICE | — |
| POST | `/api/v1/po/reports` | ADMIN/SERVICE | — |
| GET | `/api/v1/po/reports` | ADMIN/SERVICE | — |
| GET | `/api/v1/po/reports/latest` | ADMIN/SERVICE | — |
| GET | `/api/v1/po/agent-context` | ADMIN/SERVICE | — |
| POST | `/api/v1/marketing/reports` | ADMIN/SERVICE | — |
| GET | `/api/v1/marketing/reports` | ADMIN/SERVICE | — |
| GET | `/api/v1/marketing/agent-context` | ADMIN/SERVICE | — |
