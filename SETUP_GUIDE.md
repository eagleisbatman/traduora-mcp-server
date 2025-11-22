# Traduora Setup Guide - After Docker Deployment

This guide helps you configure Traduora and connect it to your backend after deploying on Railway.

## Step 1: Access Your Traduora Instance

1. Go to your Railway project
2. Click on your Traduora service
3. Go to **"Settings"** → **"Domains"**
4. Copy your Traduora URL (e.g., `traduora-production.up.railway.app`)

## Step 2: Create Admin Account

1. Visit your Traduora URL in a browser
2. You should see the Traduora login/signup page
3. Create your admin account (first user becomes admin)

## Step 3: Create a Project

1. Log in to Traduora
2. Click **"+ New Project"** or **"Create Project"**
3. Fill in:
   - **Name**: `Nông Trí Mobile App`
   - **Description**: `Mobile app translations for Nông Trí`
4. Click **"Create"**
5. **Important**: Note the Project ID from the URL or project settings
   - URL format: `https://your-traduora.com/projects/{PROJECT_ID}`
   - Or check Project Settings → Project ID

## Step 4: Add Languages

1. Go to your project → **"Languages"** tab
2. Click **"+ Add Language"**
3. Add languages:
   - **English** (`en`) - Set as default/source language
   - **Vietnamese** (`vi`)
4. Save both languages

## Step 5: Generate API Token

1. In Traduora, go to **"Settings"** (top right) → **"API Tokens"**
2. Click **"+ Create Token"** or **"New Token"**
3. Fill in:
   - **Name**: `Backend API Token`
   - **Permissions**: Select **"Read"** and **"Write"** (or **"Full Access"**)
4. Click **"Create"**
5. **Copy the token immediately** (you won't see it again!)
   - Token format: Usually starts with `tr_` or similar

## Step 6: Configure Backend Environment Variables

In your Railway backend service:

1. Go to your **backend** service in Railway
2. Click **"Variables"** tab
3. Add these variables:

```bash
TRADUORA_API_URL=https://your-traduora-domain.up.railway.app
TRADUORA_API_TOKEN=tr_your_token_here
TRADUORA_PROJECT_ID=your-project-id-from-step-3
TRADUORA_WEBHOOK_SECRET=<optional-random-secret>
```

**To generate TRADUORA_WEBHOOK_SECRET:**
```bash
openssl rand -hex 16
```

4. Railway will automatically redeploy your backend

## Step 7: Migrate Translations from Weblate

Run the migration script to upload your existing translations:

```bash
cd mcp-servers/traduora-mcp-server
npm install

# Set environment variables
export TRADUORA_API_URL="https://your-traduora-domain.up.railway.app"
export TRADUORA_API_TOKEN="tr_your_token_here"

# Run migration
node migrate-from-weblate.js nong-tri-mobile ../../weblate-translations/en.json ../../weblate-translations/vi.json
```

**Note**: Replace `nong-tri-mobile` with your actual Traduora project ID if different.

## Step 8: Verify Setup

### Test Backend API

```bash
# Test English translations
curl https://your-backend.up.railway.app/api/translations/en

# Test Vietnamese translations
curl https://your-backend.up.railway.app/api/translations/vi
```

You should see JSON responses with translations.

### Test Cache Stats

```bash
curl https://your-backend.up.railway.app/api/translations/cache/stats
```

### Check Backend Logs

In Railway backend service → **"Deployments"** → **"View Logs"**, you should see:
```
✅ Fetched 188 translations for en
✅ Fetched 188 translations for vi
```

## Step 9: (Optional) Configure Webhook

If you want real-time translation updates:

1. In Traduora, go to your project → **"Settings"** → **"Webhooks"**
2. Click **"+ Add Webhook"**
3. Configure:
   - **URL**: `https://your-backend.up.railway.app/api/translations/webhook`
   - **Secret**: Same value as `TRADUORA_WEBHOOK_SECRET` from Step 6
   - **Events**: Select **"Translation Updated"** and **"Translation Created"**
4. Save webhook

## Troubleshooting

### Backend shows "TRADUORA_API_TOKEN not set"

- Verify environment variables are set in Railway backend service
- Check variable names are exactly: `TRADUORA_API_URL`, `TRADUORA_API_TOKEN`, `TRADUORA_PROJECT_ID`
- Redeploy backend after adding variables

### API returns 401 Unauthorized

- Verify API token is correct (copy from Traduora Settings → API Tokens)
- Check token hasn't expired
- Ensure token has read permissions

### API returns 404 Not Found

- Verify `TRADUORA_PROJECT_ID` matches your project ID
- Check project exists in Traduora
- Verify language codes (`en`, `vi`) exist in project

### Migration script fails

- Verify `TRADUORA_API_URL` includes protocol (`https://`)
- Check API token has write permissions
- Ensure languages (`en`, `vi`) are created in Traduora first
- Check Traduora API is accessible (not blocked by firewall)

### Translations not showing in backend API

- Check backend logs for errors
- Verify Traduora API URL is correct
- Test Traduora API directly:
  ```bash
  curl -H "Authorization: Bearer YOUR_TOKEN" \
    https://your-traduora.com/api/v1/projects/PROJECT_ID/translations/en
  ```

## Next Steps

✅ Traduora deployed  
✅ Project created  
✅ Languages added  
✅ API token generated  
✅ Backend configured  
✅ Translations migrated  
✅ API tested  

Now you can:
- Manage translations through Traduora web UI
- Use MCP server tools to manage translations programmatically
- Translations will be served to mobile app via backend API

