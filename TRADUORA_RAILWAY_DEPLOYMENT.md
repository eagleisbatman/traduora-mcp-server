# Deploying Traduora on Railway

This guide walks you through deploying Traduora (translation management system) on Railway.

## Prerequisites

- Railway account (https://railway.app)
- GitHub account (for deploying from repository)

## Option 1: Deploy from Official Traduora Repository (Recommended)

### Step 1: Fork or Use Official Repository

Traduora's official repository: `https://github.com/ever-co/ever-traduora`

You can either:
- Fork the repository to your GitHub account
- Deploy directly from the official repository (if Railway allows)

### Step 2: Create New Railway Project

1. Log in to Railway: https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Search for and select the Traduora repository

### Step 3: Add MySQL Database Service

Traduora requires MySQL 5.7 or higher:

1. In your Railway project, click **"+ New"** → **"Database"** → **"MySQL"**
2. Railway will automatically provision a MySQL database
3. Note the connection details from the MySQL service's **"Connect"** tab

### Step 4: Configure Environment Variables

Go to your Traduora service → **"Variables"** tab and add:

#### Database Configuration
```bash
TR_DB_TYPE=mysql
TR_DB_HOST=${{MySQL.RAILWAY_PRIVATE_DOMAIN}}
TR_DB_PORT=${{MySQL.PORT}}
TR_DB_DATABASE=${{MySQL.MYSQLDATABASE}}
TR_DB_USER=${{MySQL.MYSQLUSER}}
TR_DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
```

#### Application Configuration
```bash
TR_SECRET=<generate-random-string-32-chars>
TR_VIRTUAL_HOST=traduora.up.railway.app
NODE_ENV=production
PORT=3000
```

**Generate TR_SECRET:**
```bash
openssl rand -hex 16
# Or use: node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### Step 5: Configure Build Settings

Railway should auto-detect the Dockerfile. If not:

1. Go to **"Settings"** → **"Build"**
2. Set **Builder** to **"Dockerfile"**
3. Ensure Dockerfile exists in repository root

### Step 6: Generate Public Domain

1. Go to **"Settings"** → **"Domains"**
2. Click **"Generate Domain"**
3. Copy the generated URL (e.g., `traduora-production.up.railway.app`)

### Step 7: Access Traduora

1. Visit your Traduora URL
2. Create your admin account
3. Set up your first project

---

## Option 2: Deploy Using Docker Image Directly

If you prefer to deploy from Docker Hub:

### Step 1: Create New Service

1. Railway → **"New Project"** → **"Empty Project"**
2. Click **"+ New"** → **"GitHub Repo"** → **"Deploy from Dockerfile"**

### Step 2: Use Official Docker Image

Create a `Dockerfile`:
```dockerfile
FROM everco/ever-traduora:latest

# Traduora runs on port 3000 by default
EXPOSE 3000

CMD ["npm", "start"]
```

Or use Railway's **"Deploy from Docker Hub"** option with image: `everco/ever-traduora:latest`

### Step 3: Add MySQL Database

Same as Option 1, Step 3

### Step 4: Configure Environment Variables

Same as Option 1, Step 4

---

## Post-Deployment Setup

### 1. Get API Token

1. Log in to Traduora web interface
2. Go to **Settings** → **API Tokens**
3. Create a new token with appropriate permissions
4. Copy the token (starts with `tr_`)

### 2. Create Project in Traduora

1. Click **"+ New Project"**
2. Name: `Nông Trí Mobile App`
3. Note the Project ID (you'll need this for backend config)

### 3. Add Languages

1. Go to your project → **Languages**
2. Add languages:
   - English (`en`) - Set as default/source language
   - Vietnamese (`vi`)

### 4. Configure Backend Environment Variables

In your Railway backend service, add:

```bash
TRADUORA_API_URL=https://your-traduora-domain.up.railway.app
TRADUORA_API_TOKEN=tr_your_api_token_here
TRADUORA_PROJECT_ID=your-project-id
TRADUORA_WEBHOOK_SECRET=<optional-random-secret>
```

### 5. Migrate Translations

Run the migration script to upload existing translations:

```bash
cd mcp-servers/traduora-mcp-server
npm install

export TRADUORA_API_URL="https://your-traduora-domain.up.railway.app"
export TRADUORA_API_TOKEN="tr_your_token"
node migrate-from-weblate.js nong-tri-mobile ../../weblate-translations/en.json ../../weblate-translations/vi.json
```

---

## Troubleshooting

### Database Connection Issues

- Verify MySQL service is running
- Check environment variables use Railway's private domain references
- Ensure `TR_DB_TYPE=mysql` is set

### Build Failures

- Check Railway build logs for errors
- Ensure Dockerfile exists and is valid
- Verify Node.js version compatibility

### API Authentication Errors

- Verify API token is correct
- Check token hasn't expired
- Ensure token has required permissions

### Translation Import Issues

- Verify project ID is correct
- Check API token has write permissions
- Ensure languages are created in Traduora first

---

## Railway Service Structure

Your Railway project should have:

```
Railway Project: "Nông Trí Translations"
├── Traduora Service (main app)
│   ├── Environment: Production
│   ├── Domain: traduora-production.up.railway.app
│   └── Variables: TR_DB_*, TR_SECRET, etc.
└── MySQL Service (database)
    ├── Environment: Production
    └── Variables: Auto-generated by Railway
```

---

## Cost Estimation

- **Traduora Service**: Railway's usage-based pricing (~$5-10/month for small usage)
- **MySQL Database**: Included in Railway's database pricing (~$5/month for starter)
- **Total**: ~$10-15/month for basic setup

---

## Next Steps

1. ✅ Deploy Traduora on Railway
2. ✅ Create project and add languages
3. ✅ Generate API token
4. ✅ Migrate translations from Weblate
5. ✅ Configure backend to use Traduora
6. ✅ Test translation API endpoints
7. ✅ Set up webhook (optional, for real-time updates)

---

## References

- Traduora GitHub: https://github.com/ever-co/ever-traduora
- Traduora Documentation: https://docs.traduora.co
- Railway Documentation: https://docs.railway.app

