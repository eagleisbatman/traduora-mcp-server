/**
 * Traduora MCP Server
 *
 * Translation management using Traduora API
 * via Model Context Protocol (MCP) StreamableHTTP
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import axios, { AxiosInstance } from 'axios';

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Environment variables
const TRADUORA_API_URL = process.env.TRADUORA_API_URL || '';
const TRADUORA_API_TOKEN = process.env.TRADUORA_API_TOKEN || '';
const PORT = process.env.PORT || 3002;

// Warn if configuration is missing
if (!TRADUORA_API_URL || !TRADUORA_API_TOKEN) {
  console.warn('⚠️  WARNING: TRADUORA_API_URL or TRADUORA_API_TOKEN not set!');
  console.warn('⚠️  Server will start but Traduora tools will not work until configured.');
}

// Create Axios instance for Traduora API
const traduoraClient: AxiosInstance = axios.create({
  baseURL: TRADUORA_API_URL,
  headers: {
    'Authorization': `Bearer ${TRADUORA_API_TOKEN}`,
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

/**
 * Helper function to handle Traduora API errors
 */
function handleTraduoraError(error: any): { isError: boolean; message: string } {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    return {
      isError: true,
      message: `Traduora API error (${status}): ${data?.message || data?.error || error.message}`
    };
  }
  if (error.request) {
    return {
      isError: true,
      message: `No response from Traduora API: ${error.message}`
    };
  }
  return {
    isError: true,
    message: `Request error: ${error.message}`
  };
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'traduora-mcp-server',
    traduoraConfigured: !!(TRADUORA_API_URL && TRADUORA_API_TOKEN),
    traduoraUrl: TRADUORA_API_URL || 'not configured',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Traduora MCP Server',
    version: '1.0.0',
    description: 'Translation management via Traduora API using Model Context Protocol',
    endpoints: {
      health: '/health',
      mcp: '/mcp (POST)'
    },
    tools: [
      'get_translations',
      'create_translation_key',
      'update_translation',
      'list_projects',
      'list_languages',
      'export_translations',
      'import_translations',
      'batch_update_translations'
    ]
  });
});

// Main MCP endpoint
app.post('/mcp', async (req, res) => {
  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined // Stateless
    });

    const server = new McpServer({
      name: 'Traduora',
      version: '1.0.0',
      description: 'Translation management via Traduora API. Manage projects, languages, keys, and translations.'
    });

    // Tool: Get Translations
    server.tool(
      'get_translations',
      'Get translations for a specific project and language. Returns all translation keys and their values.',
      {
        projectId: z.string().describe('Traduora project ID'),
        languageCode: z.string().describe('Language code (e.g., en, vi, fr)')
      },
      async ({ projectId, languageCode }) => {
        try {
          if (!TRADUORA_API_URL || !TRADUORA_API_TOKEN) {
            return {
              content: [{
                type: 'text',
                text: '❌ Traduora API not configured. Please set TRADUORA_API_URL and TRADUORA_API_TOKEN.'
              }],
              isError: true
            };
          }

          const response = await traduoraClient.get(`/api/v1/projects/${projectId}/translations/${languageCode}`);
          const translations = response.data;

          return {
            content: [{
              type: 'text',
              text: JSON.stringify(translations, null, 2)
            }]
          };
        } catch (error: any) {
          const errorInfo = handleTraduoraError(error);
          return {
            content: [{
              type: 'text',
              text: `❌ ${errorInfo.message}`
            }],
            isError: true
          };
        }
      }
    );

    // Tool: List Projects
    server.tool(
      'list_projects',
      'List all projects in Traduora. Returns project IDs, names, and metadata.',
      {},
      async () => {
        try {
          if (!TRADUORA_API_URL || !TRADUORA_API_TOKEN) {
            return {
              content: [{
                type: 'text',
                text: '❌ Traduora API not configured. Please set TRADUORA_API_URL and TRADUORA_API_TOKEN.'
              }],
              isError: true
            };
          }

          const response = await traduoraClient.get('/api/v1/projects');
          const projects = response.data;

          return {
            content: [{
              type: 'text',
              text: JSON.stringify(projects, null, 2)
            }]
          };
        } catch (error: any) {
          const errorInfo = handleTraduoraError(error);
          return {
            content: [{
              type: 'text',
              text: `❌ ${errorInfo.message}`
            }],
            isError: true
          };
        }
      }
    );

    // Tool: List Languages
    server.tool(
      'list_languages',
      'List all languages for a specific project.',
      {
        projectId: z.string().describe('Traduora project ID')
      },
      async ({ projectId }) => {
        try {
          if (!TRADUORA_API_URL || !TRADUORA_API_TOKEN) {
            return {
              content: [{
                type: 'text',
                text: '❌ Traduora API not configured. Please set TRADUORA_API_URL and TRADUORA_API_TOKEN.'
              }],
              isError: true
            };
          }

          const response = await traduoraClient.get(`/api/v1/projects/${projectId}/languages`);
          const languages = response.data;

          return {
            content: [{
              type: 'text',
              text: JSON.stringify(languages, null, 2)
            }]
          };
        } catch (error: any) {
          const errorInfo = handleTraduoraError(error);
          return {
            content: [{
              type: 'text',
              text: `❌ ${errorInfo.message}`
            }],
            isError: true
          };
        }
      }
    );

    // Tool: Create Translation Key
    server.tool(
      'create_translation_key',
      'Create a new translation key in a project. The key will be added to all languages in the project.',
      {
        projectId: z.string().describe('Traduora project ID'),
        key: z.string().describe('Translation key (e.g., app_name, welcome_message)'),
        description: z.string().optional().describe('Optional description for the key')
      },
      async ({ projectId, key, description }) => {
        try {
          if (!TRADUORA_API_URL || !TRADUORA_API_TOKEN) {
            return {
              content: [{
                type: 'text',
                text: '❌ Traduora API not configured. Please set TRADUORA_API_URL and TRADUORA_API_TOKEN.'
              }],
              isError: true
            };
          }

          const response = await traduoraClient.post(`/api/v1/projects/${projectId}/keys`, {
            key,
            description: description || ''
          });

          return {
            content: [{
              type: 'text',
              text: `✅ Translation key "${key}" created successfully.\n\n${JSON.stringify(response.data, null, 2)}`
            }]
          };
        } catch (error: any) {
          const errorInfo = handleTraduoraError(error);
          return {
            content: [{
              type: 'text',
              text: `❌ ${errorInfo.message}`
            }],
            isError: true
          };
        }
      }
    );

    // Tool: Update Translation
    server.tool(
      'update_translation',
      'Update a translation value for a specific key and language.',
      {
        projectId: z.string().describe('Traduora project ID'),
        key: z.string().describe('Translation key'),
        languageCode: z.string().describe('Language code (e.g., en, vi)'),
        value: z.string().describe('Translation value')
      },
      async ({ projectId, key, languageCode, value }) => {
        try {
          if (!TRADUORA_API_URL || !TRADUORA_API_TOKEN) {
            return {
              content: [{
                type: 'text',
                text: '❌ Traduora API not configured. Please set TRADUORA_API_URL and TRADUORA_API_TOKEN.'
              }],
              isError: true
            };
          }

          const response = await traduoraClient.put(
            `/api/v1/projects/${projectId}/translations/${languageCode}/${key}`,
            { value }
          );

          return {
            content: [{
              type: 'text',
              text: `✅ Translation updated: ${key} (${languageCode}) = "${value}"\n\n${JSON.stringify(response.data, null, 2)}`
            }]
          };
        } catch (error: any) {
          const errorInfo = handleTraduoraError(error);
          return {
            content: [{
              type: 'text',
              text: `❌ ${errorInfo.message}`
            }],
            isError: true
          };
        }
      }
    );

    // Tool: Export Translations
    server.tool(
      'export_translations',
      'Export all translations for a project and language as JSON.',
      {
        projectId: z.string().describe('Traduora project ID'),
        languageCode: z.string().describe('Language code (e.g., en, vi)')
      },
      async ({ projectId, languageCode }) => {
        try {
          if (!TRADUORA_API_URL || !TRADUORA_API_TOKEN) {
            return {
              content: [{
                type: 'text',
                text: '❌ Traduora API not configured. Please set TRADUORA_API_URL and TRADUORA_API_TOKEN.'
              }],
              isError: true
            };
          }

          const response = await traduoraClient.get(`/api/v1/projects/${projectId}/translations/${languageCode}`);
          const translations = response.data;

          // Convert to flat JSON object format
          const flatTranslations: Record<string, string> = {};
          if (translations.data && Array.isArray(translations.data)) {
            for (const item of translations.data) {
              if (item.key && item.value) {
                flatTranslations[item.key] = item.value;
              }
            }
          } else if (typeof translations === 'object') {
            // Handle different response formats
            Object.assign(flatTranslations, translations);
          }

          return {
            content: [{
              type: 'text',
              text: JSON.stringify(flatTranslations, null, 2)
            }]
          };
        } catch (error: any) {
          const errorInfo = handleTraduoraError(error);
          return {
            content: [{
              type: 'text',
              text: `❌ ${errorInfo.message}`
            }],
            isError: true
          };
        }
      }
    );

    // Tool: Import Translations
    server.tool(
      'import_translations',
      'Import translations from a JSON object. Updates existing keys and creates new ones if needed.',
      {
        projectId: z.string().describe('Traduora project ID'),
        languageCode: z.string().describe('Language code (e.g., en, vi)'),
        translations: z.record(z.string(), z.string()).describe('JSON object with key-value pairs')
      },
      async ({ projectId, languageCode, translations }) => {
        try {
          if (!TRADUORA_API_URL || !TRADUORA_API_TOKEN) {
            return {
              content: [{
                type: 'text',
                text: '❌ Traduora API not configured. Please set TRADUORA_API_URL and TRADUORA_API_TOKEN.'
              }],
              isError: true
            };
          }

          const results = {
            created: [] as string[],
            updated: [] as string[],
            errors: [] as string[]
          };

          // Process each translation
          for (const [key, value] of Object.entries(translations)) {
            try {
              // Try to update first
              await traduoraClient.put(
                `/api/v1/projects/${projectId}/translations/${languageCode}/${key}`,
                { value }
              );
              results.updated.push(key);
            } catch (error: any) {
              // If update fails, try creating the key first, then update
              try {
                await traduoraClient.post(`/api/v1/projects/${projectId}/keys`, { key });
                await traduoraClient.put(
                  `/api/v1/projects/${projectId}/translations/${languageCode}/${key}`,
                  { value }
                );
                results.created.push(key);
              } catch (createError: any) {
                results.errors.push(`${key}: ${createError.message}`);
              }
            }
          }

          const summary = `✅ Import completed:
- Created: ${results.created.length} keys
- Updated: ${results.updated.length} keys
- Errors: ${results.errors.length} keys

${results.errors.length > 0 ? `\nErrors:\n${results.errors.join('\n')}` : ''}`;

          return {
            content: [{
              type: 'text',
              text: summary
            }]
          };
        } catch (error: any) {
          const errorInfo = handleTraduoraError(error);
          return {
            content: [{
              type: 'text',
              text: `❌ ${errorInfo.message}`
            }],
            isError: true
          };
        }
      }
    );

    // Tool: Batch Update Translations
    server.tool(
      'batch_update_translations',
      'Update multiple translations at once for a project and language.',
      {
        projectId: z.string().describe('Traduora project ID'),
        languageCode: z.string().describe('Language code (e.g., en, vi)'),
        translations: z.record(z.string(), z.string()).describe('JSON object with key-value pairs to update')
      },
      async ({ projectId, languageCode, translations }) => {
        try {
          if (!TRADUORA_API_URL || !TRADUORA_API_TOKEN) {
            return {
              content: [{
                type: 'text',
                text: '❌ Traduora API not configured. Please set TRADUORA_API_URL and TRADUORA_API_TOKEN.'
              }],
              isError: true
            };
          }

          const results = {
            updated: [] as string[],
            errors: [] as string[]
          };

          // Process each translation
          for (const [key, value] of Object.entries(translations)) {
            try {
              await traduoraClient.put(
                `/api/v1/projects/${projectId}/translations/${languageCode}/${key}`,
                { value }
              );
              results.updated.push(key);
            } catch (error: any) {
              results.errors.push(`${key}: ${error.message}`);
            }
          }

          const summary = `✅ Batch update completed:
- Updated: ${results.updated.length} translations
- Errors: ${results.errors.length} translations

${results.errors.length > 0 ? `\nErrors:\n${results.errors.join('\n')}` : ''}`;

          return {
            content: [{
              type: 'text',
              text: summary
            }]
          };
        } catch (error: any) {
          const errorInfo = handleTraduoraError(error);
          return {
            content: [{
              type: 'text',
              text: `❌ ${errorInfo.message}`
            }],
            isError: true
          };
        }
      }
    );

    // Connect and handle the request
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);

  } catch (error) {
    console.error('[MCP] Error:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal server error',
        data: error instanceof Error ? error.message : 'Unknown error'
      },
      id: null
    });
  }
});

// Start server
const HOST = '0.0.0.0';
app.listen(Number(PORT), HOST, () => {
  console.log('');
  console.log('🚀 =========================================');
  console.log('   Traduora MCP Server');
  console.log('   Translation Management via MCP');
  console.log('=========================================');
  console.log(`✅ Server running on ${HOST}:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 MCP endpoint: http://localhost:${PORT}/mcp`);
  console.log('');
  console.log('⚙️  Configuration:');
  console.log(`   Traduora URL: ${TRADUORA_API_URL || '⚠️  NOT CONFIGURED'}`);
  console.log(`   API Token: ${TRADUORA_API_TOKEN ? '✅ Configured' : '⚠️  NOT CONFIGURED'}`);
  console.log('');
  console.log('🛠️  Available Tools:');
  console.log('   - get_translations');
  console.log('   - list_projects');
  console.log('   - list_languages');
  console.log('   - create_translation_key');
  console.log('   - update_translation');
  console.log('   - export_translations');
  console.log('   - import_translations');
  console.log('   - batch_update_translations');
  console.log('=========================================');
  console.log('');
});

