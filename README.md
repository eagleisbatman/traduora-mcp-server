# Traduora MCP Server

MCP server for managing translations via Traduora API.

## Features

- Get translations for projects and languages
- Create and update translation keys
- Manage projects and languages
- Export/import translations
- Batch operations

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set environment variables:
```bash
TRADUORA_API_URL=https://your-traduora-instance.com
TRADUORA_API_TOKEN=your-api-token
```

3. Run in development:
```bash
npm run dev
```

4. Build:
```bash
npm run build
npm start
```

## Railway Deployment

The server is configured for Railway deployment. Set the environment variables in Railway dashboard.

## MCP Tools

- `get_translations` - Get translations for a project and language
- `create_translation_key` - Create a new translation key
- `update_translation` - Update a translation value
- `list_projects` - List all projects
- `list_languages` - List languages for a project
- `export_translations` - Export translations as JSON
- `import_translations` - Import translations from JSON

