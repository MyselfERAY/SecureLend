-- DevSuggestion: dedupKey alanı ekleniyor
-- Health Agent'in aynı hata için her koşuda yeni Suggestion yaratmasını önler.
-- Null değerler unique constraint'te birbirinden farklı sayılır (Postgres default),
-- yani dedupKey opsiyonel — sadece otomatik ajanlar doldurur, manuel girişler null kalır.

ALTER TABLE "dev_suggestions"
  ADD COLUMN "dedup_key" VARCHAR(200);

CREATE UNIQUE INDEX "dev_suggestion_dedup_key_key"
  ON "dev_suggestions" ("dedup_key");
