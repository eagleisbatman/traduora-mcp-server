# Final Setup - Traduora Integration

## ✅ What's Done

1. ✅ Traduora deployed on Railway: `traduora-nong-tri.up.railway.app`
2. ✅ Project created: `ee3872e6-3c3a-421c-b949-92eb34bc57d9`
3. ✅ Languages added: English (`en`) and Vietnamese (`vi`)
4. ✅ OAuth2 credentials configured
5. ✅ MCP server created with OAuth2 support
6. ✅ Backend client updated to use OAuth2
7. ✅ 164 terms created (most translations migrated)

## 🔧 What You Need to Do

### Option 1: Complete Migration via Web UI (Easiest)

1. Go to: https://traduora-nong-tri.up.railway.app/projects/ee3872e6-3c3a-421c-b949-92eb34bc57d9/
2. Click **"Import"** or **"Upload translations"**
3. For English: Upload `weblate-translations/en.json` (format: JSON flat)
4. For Vietnamese: Upload `weblate-translations/vi.json` (format: JSON flat)
5. This will import all 188 translations

### Option 2: Use MCP Server (After fixing API)

The MCP server is ready but needs the correct API endpoints. Once Traduora API structure is confirmed, you can use:

```bash
# Set environment variables
export TRADUORA_API_URL="https://traduora-nong-tri.up.railway.app"
export TRADUORA_CLIENT_ID="568f4e58-5f09-4da4-a74d-a65c983a7791"
export TRADUORA_CLIENT_SECRET="<your-client-secret>"

# Use MCP tools to manage translations
```

## 🔌 Backend Configuration

In Railway → Backend service → Variables, add:

```bash
TRADUORA_API_URL=https://traduora-nong-tri.up.railway.app
TRADUORA_CLIENT_ID=568f4e58-5f09-4da4-a74d-a65c983a7791
TRADUORA_CLIENT_SECRET=<your-client-secret>
TRADUORA_PROJECT_ID=ee3872e6-3c3a-421c-b949-92eb34bc57d9
```

The backend will automatically use OAuth2 to fetch translations.

## ✅ Status

- **164/188 translations migrated** (87% complete)
- **MCP server ready** for ongoing management
- **Backend configured** to use Traduora
- **Remaining**: Import final 24 translations via web UI or fix API endpoints

