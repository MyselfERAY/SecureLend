# SecureLend — Veritabanı Şema Özeti

## Modeller (32)

### Kullanıcı ve Kimlik

| Model | Amaç | Önemli Alanlar | İlişkiler |
|-------|------|----------------|-----------|
| **User** | Platform kullanıcıları | tcknHash (unique), fullName, phone, email, roles[], kycStatus, referralCode | → Application, BankAccount, Contract (landlord/tenant), ContractSignature, Notification, ChatMessage |
| **OtpCode** | Telefon doğrulama kodları | phone, code (6 hane), purpose, attempts, maxAttempts (3), expiresAt | → User |
| **RefreshToken** | JWT yenileme tokenları | tokenHash, expiresAt, revokedAt, ipAddress | → User |
| **AuditLog** | Sistem eylem takibi | action, entityType, entityId, tcknMasked, ipAddress, metadata (JSON) | Bağımsız |

### Başvuru ve Doğrulama

| Model | Amaç | Önemli Alanlar | İlişkiler |
|-------|------|----------------|-----------|
| **Application** | Kredi ön başvuru | tcknHash, status, creditLimit, interestRate, kkbScore, rejectionReason | → User, → Contract |
| **KmhApplication** | KMH banka başvurusu | employmentStatus, monthlyIncome, approvedLimit, creditScore, kycStatus, offerAccepted | → User, → BankAccount (1:1) |
| **Consent** | KVKK rıza kaydı | type (enum), version, accepted, ipAddress, userAgent | → User |

### Mülk ve Sözleşme

| Model | Amaç | Önemli Alanlar | İlişkiler |
|-------|------|----------------|-----------|
| **Property** | Kiralık mülk ilanı | title, city, district, propertyType, roomCount, areaM2, monthlyRent, depositAmount, status | → User (owner), → Contract |
| **Contract** | Kira sözleşmesi | propertyId, tenantId, landlordId, status, monthlyRent, startDate, endDate, paymentDayOfMonth, landlordIban, Faz D alanları | → Property, → User (x2), → PaymentSchedule, → ContractSignature, → Commission, → ChatRoom |
| **ContractSignature** | Dijital imza kaydı | contractId+userId (unique), role, signedAt, ipAddress | → Contract, → User |

### Ödeme ve Finans

| Model | Amaç | Önemli Alanlar | İlişkiler |
|-------|------|----------------|-----------|
| **PaymentSchedule** | Kira ödeme takvimi | contractId, dueDate, amount, periodLabel, status, paidAt, paidAmount | → Contract, → BankTransaction, → Commission |
| **BankAccount** | Banka hesapları | accountNumber (unique IBAN), accountType (KMH/STANDARD), status, balance, creditLimit | → User, → Contract, → KmhApplication (1:1), → BankTransaction (x2) |
| **BankTransaction** | Hesap transferleri | fromAccountId, toAccountId, amount, referenceNo (unique), status | → BankAccount (x2), → PaymentSchedule |
| **PaymentOrder** | Otomatik ödeme emri | contractId, fromAccountId, toIban, amount, dayOfMonth, nextExecutionDate, status | → Contract, → BankAccount |
| **Commission** | Platform komisyonu | paymentScheduleId (unique), contractId, totalAmount, commissionRate, commissionAmount, landlordAmount | → PaymentSchedule, → Contract |

### İletişim

| Model | Amaç | Önemli Alanlar | İlişkiler |
|-------|------|----------------|-----------|
| **ChatRoom** | Sohbet odası | type (CONTRACT/SUPPORT), contractId, title, isActive | → Contract, → ChatRoomParticipant, → ChatMessage |
| **ChatRoomParticipant** | Oda katılımcıları | chatRoomId+userId (unique) | → ChatRoom, → User |
| **ChatMessage** | Mesajlar | chatRoomId, senderId, content (max 2000), isRead | → ChatRoom, → User |
| **Notification** | Bildirimler | userId, type (enum), title, body, entityType, entityId, isRead | → User |

### İçerik ve Pazarlama

| Model | Amaç | Önemli Alanlar | İlişkiler |
|-------|------|----------------|-----------|
| **Article** | Blog makaleleri | title, slug (unique), summary, content, category, audience, status | Bağımsız |
| **PromoTemplate** | Promosyon şablonları | name, type (enum), discountPercent, durationMonths, isAutoApply, maxUsageCount | → UserPromo |
| **UserPromo** | Kullanıcı promosyonları | userId, templateId, contractId, status, remainingMonths, referredByUserId | → User (x2), → PromoTemplate, → Contract |
| **NewsletterSubscriber** | Bülten aboneleri | email (unique), name, source, isVerified, isActive | Bağımsız |

### Agent Sistemi

| Model | Amaç | Önemli Alanlar | İlişkiler |
|-------|------|----------------|-----------|
| **AgentRun** | Agent çalışma kaydı | agentType (enum), status, startedAt, completedAt, tokenUsage, summary | → PoReport, → MarketingReport |
| **DevSuggestion** | Geliştirme önerileri | title, description, priority (enum), status (enum), agentNotes, prLink | → PoItem |
| **PoReport** | PO raporları | reportDate (unique), summary, metricsSnapshot (JSON) | → AgentRun, → PoItem |
| **PoItem** | PO backlog itemleri | category (enum), title, priority, status, isDevTask | → PoReport, → DevSuggestion |
| **MarketingReport** | Pazarlama raporları | type (enum), title, content, reportDate | → AgentRun, → MarketingTask, → ResearchRequest |
| **MarketingTask** | Pazarlama görevleri | title, responsible, targetDate, status (enum) | → MarketingReport |
| **ResearchRequest** | Araştırma talepleri | topic, details, status (enum), resultReportId | → MarketingReport |

### Analitik

| Model | Amaç | Önemli Alanlar | İlişkiler |
|-------|------|----------------|-----------|
| **AnalyticsEvent** | Client-side tracking | sessionId, eventType, page, device, browser, errorMessage, metadata | Bağımsız |

---

## Enum'lar (28)

| Enum | Değerler |
|------|----------|
| ApplicationStatus | PENDING, APPROVED, REJECTED |
| UserRole | TENANT, LANDLORD, ADMIN, SERVICE |
| KycStatus | PENDING, IN_PROGRESS, COMPLETED, REJECTED |
| ContractStatus | DRAFT, PENDING_SIGNATURES, PENDING_ACTIVATION, ACTIVE, TERMINATED, EXPIRED |
| PaymentStatus | PENDING, PROCESSING, COMPLETED, FAILED, OVERDUE |
| PaymentOrderStatus | ACTIVE, PAUSED, CANCELLED, COMPLETED |
| BankAccountType | KMH, STANDARD |
| BankAccountStatus | PENDING_OPENING, ACTIVE, FROZEN, CLOSED |
| PropertyStatus | ACTIVE, RENTED, INACTIVE |
| EmploymentStatus | EMPLOYED, SELF_EMPLOYED, RETIRED, STUDENT, UNEMPLOYED |
| KmhApplicationStatus | PENDING, APPROVED, REJECTED |
| RentIncreaseType | TUFE, FIXED_RATE, NONE |
| ConsentType | KVKK_AYDINLATMA, KVKK_ACIK_RIZA, KVKK_ACIK_RIZA_KMH, TERMS_OF_SERVICE |
| NotificationType | KMH_APPROVED, KMH_REJECTED, KMH_ONBOARDING_COMPLETE, CONTRACT_CREATED, CONTRACT_SIGNED, CONTRACT_ACTIVATED, CONTRACT_TERMINATED, PAYMENT_DUE, PAYMENT_OVERDUE, PAYMENT_COMPLETED, CHAT_MESSAGE, SYSTEM |
| ArticleStatus | DRAFT, PUBLISHED |
| ArticleAudience | TENANT, LANDLORD, BOTH |
| SuggestionStatus | PENDING, IN_PROGRESS, DONE, REJECTED |
| SuggestionPriority | LOW, MEDIUM, HIGH, CRITICAL |
| AgentType | PO, MARKETING, DEV, HEALTH, ARTICLE |
| AgentRunStatus | RUNNING, COMPLETED, FAILED |
| PoItemCategory | UX_IMPROVEMENT, COMPETITOR_ANALYSIS, REGULATION_COMPLIANCE, FEATURE_SUGGESTION, BUG_REPORT, METRIC_SUMMARY |
| PoItemStatus | ACTIVE, MOVED_TO_DEV, DISMISSED |
| MarketingReportType | DAILY_STRATEGY, MARKET_ANALYSIS, RESEARCH, BUSINESS_DEVELOPMENT |
| MarketingTaskStatus | TODO, IN_PROGRESS, COMPLETED, CANCELLED |
| ResearchRequestStatus | PENDING, IN_PROGRESS, COMPLETED, FAILED |
| ChatRoomType | CONTRACT, SUPPORT |
| PromoType | FIRST_MONTHS_FREE, RENEWAL_DISCOUNT, REFERRAL_BONUS, LOYALTY_REWARD, CUSTOM |
| PromoStatus | ACTIVE, USED, EXPIRED, CANCELLED |

---

## Önemli Unique Constraint'ler
- User: tcknHash, referralCode
- BankAccount: accountNumber (IBAN)
- BankTransaction: referenceNo
- ContractSignature: contractId + userId (composite)
- ChatRoomParticipant: chatRoomId + userId (composite)
- Article: slug
- PoReport: reportDate
- NewsletterSubscriber: email
- Commission: paymentScheduleId
