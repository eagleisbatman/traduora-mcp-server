/**
 * Migration script to upload translations from Weblate JSON files to Traduora
 * 
 * Usage:
 *   node migrate-from-weblate.js <project-id> <en.json> <vi.json>
 * 
 * Example:
 *   node migrate-from-weblate.js nong-tri-mobile ../weblate-translations/en.json ../weblate-translations/vi.json
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration from environment variables
const TRADUORA_API_URL = process.env.TRADUORA_API_URL || '';
const TRADUORA_API_TOKEN = process.env.TRADUORA_API_TOKEN || '';

if (!TRADUORA_API_URL || !TRADUORA_API_TOKEN) {
  console.error('❌ Error: TRADUORA_API_URL and TRADUORA_API_TOKEN must be set');
  process.exit(1);
}

const traduoraClient = axios.create({
  baseURL: TRADUORA_API_URL,
  headers: {
    'Authorization': `Bearer ${TRADUORA_API_TOKEN}`,
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

/**
 * Load JSON translations from file
 */
function loadTranslations(filePath) {
  try {
    const fullPath = path.resolve(__dirname, filePath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error loading ${filePath}:`, error.message);
    throw error;
  }
}

/**
 * Create a translation key in Traduora
 */
async function createKey(projectId, key, description = '') {
  try {
    await traduoraClient.post(`/api/v1/projects/${projectId}/keys`, {
      key,
      description
    });
    return true;
  } catch (error) {
    if (error.response?.status === 409) {
      // Key already exists, that's okay
      return true;
    }
    throw error;
  }
}

/**
 * Update a translation value
 */
async function updateTranslation(projectId, key, languageCode, value) {
  try {
    await traduoraClient.put(
      `/api/v1/projects/${projectId}/translations/${languageCode}/${key}`,
      { value }
    );
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      // Key doesn't exist, create it first
      await createKey(projectId, key);
      await traduoraClient.put(
        `/api/v1/projects/${projectId}/translations/${languageCode}/${key}`,
        { value }
      );
      return true;
    }
    throw error;
  }
}

/**
 * Migrate translations for a language
 */
async function migrateLanguage(projectId, languageCode, translations) {
  console.log(`\n🌍 Migrating ${languageCode} translations...`);
  
  const keys = Object.keys(translations);
  console.log(`   Found ${keys.length} translation keys`);
  
  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const [key, value] of Object.entries(translations)) {
    try {
      // Ensure key exists
      await createKey(projectId, key);
      
      // Update translation
      await updateTranslation(projectId, key, languageCode, value);
      
      if (created === 0 && updated === 0) {
        created++;
      } else {
        updated++;
      }
      
      if ((created + updated) % 50 === 0) {
        console.log(`   Progress: ${created + updated}/${keys.length}...`);
      }
    } catch (error) {
      errors++;
      console.error(`   ❌ Error with key "${key}":`, error.response?.data || error.message);
    }
  }

  console.log(`   ✅ Completed: ${created + updated} translations migrated, ${errors} errors`);
  return { created: created + updated, errors };
}

/**
 * Main migration function
 */
async function migrate(projectId, enFile, viFile) {
  console.log('🚀 Starting migration from Weblate to Traduora...');
  console.log(`   Project ID: ${projectId}`);
  console.log(`   English file: ${enFile}`);
  console.log(`   Vietnamese file: ${viFile}`);

  // Load translations
  const enTranslations = loadTranslations(enFile);
  const viTranslations = loadTranslations(viFile);

  console.log(`\n📊 Translation files loaded:`);
  console.log(`   English: ${Object.keys(enTranslations).length} keys`);
  console.log(`   Vietnamese: ${Object.keys(viTranslations).length} keys`);

  // Verify all keys exist in both languages
  const allKeys = new Set([...Object.keys(enTranslations), ...Object.keys(viTranslations)]);
  console.log(`\n🔍 Total unique keys: ${allKeys.size}`);

  // Migrate English (source language)
  const enResult = await migrateLanguage(projectId, 'en', enTranslations);

  // Migrate Vietnamese
  const viResult = await migrateLanguage(projectId, 'vi', viTranslations);

  // Summary
  console.log('\n📈 Migration Summary:');
  console.log(`   English: ${enResult.created} translations, ${enResult.errors} errors`);
  console.log(`   Vietnamese: ${viResult.created} translations, ${viResult.errors} errors`);
  console.log(`   Total: ${enResult.created + viResult.created} translations migrated`);

  if (enResult.errors === 0 && viResult.errors === 0) {
    console.log('\n✅ Migration completed successfully!');
  } else {
    console.log(`\n⚠️  Migration completed with ${enResult.errors + viResult.errors} errors`);
  }
}

// Run migration
const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('Usage: node migrate-from-weblate.js <project-id> <en.json> <vi.json>');
  console.error('Example: node migrate-from-weblate.js nong-tri-mobile ../weblate-translations/en.json ../weblate-translations/vi.json');
  process.exit(1);
}

const [projectId, enFile, viFile] = args;

migrate(projectId, enFile, viFile)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error.message);
    if (error.response) {
      console.error('   API Response:', error.response.data);
    }
    process.exit(1);
  });

