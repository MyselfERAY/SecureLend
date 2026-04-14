#!/usr/bin/env node

/**
 * SecureLend Architect Agent — Node.js Script
 *
 * Anthropic SDK ile Claude API çağrısı yapar.
 * Shell'de JSON parse problemi yok — native JSON object döner.
 *
 * Kullanım:
 *   node scripts/architect-agent.js --mode review --diff-file /tmp/diff.txt
 *   node scripts/architect-agent.js --mode update_only --diff-file /tmp/diff.txt
 *   node scripts/architect-agent.js --mode full_scan
 *
 * Environment:
 *   ANTHROPIC_API_KEY — zorunlu
 */

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────
const ARCH_DIR = path.resolve(__dirname, '..', 'architecture');
const MODULES_DIR = path.join(ARCH_DIR, 'modules');
const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 16384;

// ─── CLI Args ────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = { mode: 'review', diffFile: null, diffContent: null };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--mode' && args[i + 1]) {
      parsed.mode = args[++i];
    } else if (args[i] === '--diff-file' && args[i + 1]) {
      parsed.diffFile = args[++i];
    } else if (args[i] === '--diff-content' && args[i + 1]) {
      parsed.diffContent = args[++i];
    }
  }

  return parsed;
}

// ─── File Helpers ────────────────────────────────────────────
function readFileOrEmpty(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function readArchitecture() {
  const arch = {};

  // Ana dosyalar
  const mainFiles = [
    'modules.md', 'conventions.md', 'impact-map.md',
    'db-schema.md', 'api-contracts.md', 'changelog.md',
  ];

  for (const file of mainFiles) {
    const key = file.replace('.md', '');
    arch[key] = readFileOrEmpty(path.join(ARCH_DIR, file));
  }

  // Modül dosyaları
  arch.moduleFiles = {};
  if (fs.existsSync(MODULES_DIR)) {
    const files = fs.readdirSync(MODULES_DIR).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const key = file.replace('.md', '');
      arch.moduleFiles[key] = readFileOrEmpty(path.join(MODULES_DIR, file));
    }
  }

  return arch;
}

function readRepoContext() {
  const repoRoot = path.resolve(__dirname, '..');
  const context = {};

  // Prisma schema
  const schemaPath = path.join(repoRoot, 'apps', 'api', 'prisma', 'schema.prisma');
  context.prismaSchema = readFileOrEmpty(schemaPath);

  // Package.json'lar
  context.apiDeps = readFileOrEmpty(path.join(repoRoot, 'apps', 'api', 'package.json'));
  context.webDeps = readFileOrEmpty(path.join(repoRoot, 'apps', 'web', 'package.json'));
  context.sharedDeps = readFileOrEmpty(path.join(repoRoot, 'packages', 'shared', 'package.json'));

  return context;
}

// ─── Prompt Builders ─────────────────────────────────────────

function buildReviewPrompt(diff, arch) {
  return `Sen SecureLend'in Architect Agent'ısın. Turkish fintech kira ödeme platformu (kiraguvence.com).
NestJS backend + Next.js 15 frontend + Prisma + PostgreSQL.

== GÖREV ==
Bu kod değişikliğini review et ve architecture haritasını güncelle.

== MEVCUT MİMARİ HARİTA ==
=== modules.md ===
${arch.modules}

=== conventions.md ===
${arch.conventions}

=== impact-map.md ===
${arch['impact-map']}

=== db-schema.md ===
${arch['db-schema']}

== DEĞİŞİKLİK (DIFF) ==
${diff}

== GÖREV 1: REVIEW ==
Bu değişikliği şu açılardan değerlendir:
1. Convention uyumu (DTO pattern, response format, dosya isimlendirme)
2. Bağımlılık etkisi (değişen modülün bağlı olduğu diğer modüller etkilenmiş mi?)
3. Runtime risk (kırılgan pattern'lar: shell JSON parse, hardcoded değerler, eksik error handling)
4. Type tutarlılığı (shared type değişmişse tüm kullanım noktaları güncel mi?)
5. Build sırası (shared→api→web zinciri kırılır mı?)

== GÖREV 2: HARİTA GÜNCELLEME ==
Değişiklik APPROVE ise:
- Etkilenen modüllerin summary'sini güncelle
- Yeni endpoint/model/sayfa varsa ekle, silinen varsa kaldır
- changelog entry ekle

Eğer değişiklik haritayı etkilemiyorsa, updates alanlarını null bırak.

== ÇIKTI FORMATI ==
SADECE geçerli JSON döndür, başka hiçbir şey yazma:
{
  "review": "APPROVE" veya "BLOCK: sebep açıklaması",
  "updates": {
    "modules.md": "güncellenmiş tam içerik veya null",
    "db-schema.md": "güncellenmiş tam içerik veya null",
    "api-contracts.md": "güncellenmiş tam içerik veya null",
    "impact-map.md": "güncellenmiş tam içerik veya null",
    "conventions.md": null,
    "affectedModuleFiles": {
      "module-name.md": "güncellenmiş tam içerik veya null"
    },
    "changelog": {
      "tarih": "ISO 8601",
      "durum": "COMPLETED",
      "tetikleyen": "değişikliğin kısa açıklaması",
      "guncellenen": ["dosya1.md", "dosya2.md"]
    }
  }
}`;
}

function buildUpdateOnlyPrompt(diff, arch) {
  return `Sen SecureLend'in Architect Agent'ısın. Turkish fintech kira ödeme platformu (kiraguvence.com).

== GÖREV ==
Aşağıdaki kod değişikliğine göre architecture haritasını güncelle. Review yapma, sadece güncelle.

== MEVCUT MİMARİ HARİTA ==
=== modules.md ===
${arch.modules}

=== db-schema.md ===
${arch['db-schema']}

=== impact-map.md ===
${arch['impact-map']}

== DEĞİŞİKLİK (DIFF) ==
${diff}

== ÇIKTI FORMATI ==
SADECE geçerli JSON döndür:
{
  "updates": {
    "modules.md": "güncellenmiş tam içerik veya null",
    "db-schema.md": "güncellenmiş tam içerik veya null",
    "api-contracts.md": "güncellenmiş tam içerik veya null",
    "impact-map.md": "güncellenmiş tam içerik veya null",
    "conventions.md": null,
    "affectedModuleFiles": {
      "module-name.md": "güncellenmiş tam içerik veya null"
    },
    "changelog": {
      "tarih": "ISO 8601",
      "durum": "COMPLETED",
      "tetikleyen": "değişikliğin kısa açıklaması",
      "guncellenen": ["dosya1.md"]
    }
  }
}

Eğer değişiklik haritayı hiç etkilemiyorsa, tüm update'leri null bırak ama changelog'a "incelendi, güncelleme gerekmedi" yaz.`;
}

function buildFullScanPrompt(repoContext, arch) {
  return `Sen SecureLend'in Architect Agent'ısın. Turkish fintech kira ödeme platformu (kiraguvence.com).
NestJS backend + Next.js 15 frontend + Prisma + PostgreSQL. Monorepo (Turborepo + pnpm).

== GÖREV ==
Tüm repo'yu analiz et ve architecture haritasını sıfırdan oluştur.

== PRISMA SCHEMA ==
${repoContext.prismaSchema}

== API PACKAGE.JSON ==
${repoContext.apiDeps}

== WEB PACKAGE.JSON ==
${repoContext.webDeps}

== SHARED PACKAGE.JSON ==
${repoContext.sharedDeps}

== MEVCUT HARİTA (varsa) ==
${arch.modules || '(henüz yok)'}

== ÇIKTI FORMATI ==
SADECE geçerli JSON döndür:
{
  "updates": {
    "modules.md": "tüm modüllerin router/özet haritası",
    "db-schema.md": "tüm Prisma model ve enum özeti",
    "api-contracts.md": "tüm API endpoint şemaları",
    "impact-map.md": "modüller arası bağımlılık ve etki haritası",
    "conventions.md": "kodlama kuralları, pattern'lar, protected dosyalar",
    "moduleFiles": {
      "auth.md": "auth modülü detayı",
      "user.md": "user modülü detayı",
      "contract.md": "contract modülü detayı",
      "payment.md": "payment modülü detayı",
      "bank.md": "bank modülü detayı",
      "property.md": "property modülü detayı",
      "admin.md": "admin modülü detayı",
      "chat.md": "chat modülü detayı",
      "notification.md": "notification + in-app-notification + push detayı",
      "article.md": "article modülü detayı",
      "analytics.md": "analytics modülü detayı",
      "agent-system.md": "agent-run + suggestion + po-agent + marketing-agent detayı",
      "promo.md": "promo + newsletter detayı",
      "application.md": "application + credit-scoring + identity-verification + encryption detayı",
      "consent.md": "consent + onboarding detayı",
      "web-pages.md": "tüm frontend sayfa/route haritası",
      "web-components.md": "tüm frontend component'ler"
    },
    "changelog": {
      "tarih": "ISO 8601",
      "durum": "COMPLETED",
      "tetikleyen": "İlk oluşturma (full scan)",
      "guncellenen": ["tümü"]
    }
  }
}

Her modül dosyasında şu format:
# Modül Adı

## Sorumluluk
Kısa açıklama

## Dosyalar
- service.ts — iş mantığı
- controller.ts — endpoint handler
- dto/ — request/response tipleri

## Endpoint'ler
- GET /api/v1/... — açıklama
- POST /api/v1/... — açıklama

## Bağımlılıklar
- İçeri: hangi servisleri çağırır
- Dışarı: hangi modüller tarafından kullanılır

## Kritik Kurallar
- Modüle özel dikkat edilmesi gerekenler

## Son Değişiklik
[tarih] açıklama`;
}

// ─── Main ────────────────────────────────────────────────────
async function main() {
  const args = parseArgs();
  const client = new Anthropic();
  const arch = readArchitecture();

  // Diff'i oku
  let diff = '';
  if (args.diffFile) {
    diff = readFileOrEmpty(args.diffFile);
  } else if (args.diffContent) {
    diff = args.diffContent;
  }

  // Mode'a göre prompt oluştur
  let prompt;
  switch (args.mode) {
    case 'review':
      if (!diff) {
        console.error('Error: review mode requires --diff-file or --diff-content');
        process.exit(1);
      }
      prompt = buildReviewPrompt(diff, arch);
      break;

    case 'update_only':
      if (!diff) {
        console.error('Error: update_only mode requires --diff-file or --diff-content');
        process.exit(1);
      }
      prompt = buildUpdateOnlyPrompt(diff, arch);
      break;

    case 'full_scan':
      const repoContext = readRepoContext();
      prompt = buildFullScanPrompt(repoContext, arch);
      break;

    default:
      console.error(`Error: unknown mode "${args.mode}". Use: review, update_only, full_scan`);
      process.exit(1);
  }

  // Claude API çağrısı
  console.error(`[architect] Mode: ${args.mode}`);
  console.error(`[architect] Calling Claude API (${MODEL})...`);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text;

  // JSON parse — doğrudan native object
  let result;
  try {
    // İlk deneme: doğrudan parse
    result = JSON.parse(text);
  } catch {
    // İkinci deneme: JSON bloğu çıkar (```json ... ```)
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try {
        result = JSON.parse(match[1].trim());
      } catch (e2) {
        console.error('[architect] JSON parse failed (attempt 2):', e2.message);
        console.error('[architect] Raw response:', text.substring(0, 500));
        process.exit(1);
      }
    } else {
      // Üçüncü deneme: ilk { ile son } arasını al
      const first = text.indexOf('{');
      const last = text.lastIndexOf('}');
      if (first >= 0 && last > first) {
        try {
          result = JSON.parse(text.substring(first, last + 1));
        } catch (e3) {
          console.error('[architect] JSON parse failed (attempt 3):', e3.message);
          console.error('[architect] Raw response:', text.substring(0, 500));
          process.exit(1);
        }
      } else {
        console.error('[architect] No JSON object found in response');
        console.error('[architect] Raw response:', text.substring(0, 500));
        process.exit(1);
      }
    }
  }

  // Sonuçları dosyalara yaz
  const updates = result.updates || {};

  // Ana dosyalar
  const mainFiles = ['modules.md', 'db-schema.md', 'api-contracts.md', 'impact-map.md', 'conventions.md'];
  for (const file of mainFiles) {
    const content = updates[file];
    if (content && content !== 'null') {
      const filePath = path.join(ARCH_DIR, file);
      fs.writeFileSync(filePath, content, 'utf8');
      console.error(`[architect] Updated: architecture/${file}`);
    }
  }

  // Modül dosyaları
  const moduleFiles = updates.affectedModuleFiles || updates.moduleFiles || {};
  for (const [fileName, content] of Object.entries(moduleFiles)) {
    if (content && content !== 'null') {
      const safeName = fileName.endsWith('.md') ? fileName : `${fileName}.md`;
      const filePath = path.join(MODULES_DIR, safeName);
      fs.writeFileSync(filePath, content, 'utf8');
      console.error(`[architect] Updated: architecture/modules/${safeName}`);
    }
  }

  // Changelog güncelle
  if (updates.changelog) {
    const cl = updates.changelog;
    const entry = `## Son Güncelleme
- **Tarih:** ${cl.tarih || new Date().toISOString()}
- **Durum:** ${cl.durum || 'COMPLETED'}
- **Tetikleyen:** ${cl.tetikleyen || 'bilinmiyor'}
- **Güncellenen dosyalar:** ${Array.isArray(cl.guncellenen) ? cl.guncellenen.join(', ') : cl.guncellenen || 'yok'}
`;
    const existingChangelog = readFileOrEmpty(path.join(ARCH_DIR, 'changelog.md'));
    const previousSection = existingChangelog.replace(/^## Son Güncelleme[\s\S]*?(?=## Önceki|$)/, '');
    const newChangelog = entry + '\n## Önceki\n' + (previousSection.replace(/^## Önceki\n?/, '') || existingChangelog);
    fs.writeFileSync(path.join(ARCH_DIR, 'changelog.md'), newChangelog, 'utf8');
    console.error('[architect] Updated: architecture/changelog.md');
  }

  // Review sonucu
  if (result.review) {
    console.error(`[architect] Review: ${result.review}`);
  }

  // stdout'a JSON yaz (workflow tarafından okunur)
  console.log(JSON.stringify(result, null, 2));

  // Exit code
  if (result.review && result.review.startsWith('BLOCK')) {
    process.exit(2); // BLOCK — non-zero ama hata değil
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('[architect] Fatal error:', err.message);
  process.exit(1);
});
