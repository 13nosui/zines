# GitHub App Webhook Receiver for Vercel

This implementation provides a webhook receiver endpoint for GitHub Apps deployed on Vercel using Next.js API Routes.

## 📁 Files Created

1. **`/src/app/api/github-webhook/route.ts`** - The main webhook endpoint
2. **`.env.example`** - Example environment variables configuration

## 🚀 Quick Start

### 1. Copy the Webhook Endpoint

The webhook endpoint is located at:
```
/src/app/api/github-webhook/route.ts
```

This file is ready to use and includes:
- ✅ Webhook payload logging
- ✅ Event type handling
- ✅ Signature verification (commented out by default)
- ✅ Error handling
- ✅ TypeScript support

### 2. Environment Variables

Create a `.env.local` file for local development:
```bash
cp .env.example .env.local
```

Generate a secure webhook secret:
```bash
openssl rand -hex 32
```

Add to `.env.local`:
```env
GITHUB_WEBHOOK_SECRET=your-generated-secret-here
```

### 3. Enable Signature Verification

To enable webhook signature verification, uncomment the verification code block in the route handler (lines 74-90 in `route.ts`).

## 🔧 Deployment to Vercel

### 1. Deploy Your App

```bash
vercel --prod
```

Your webhook endpoint will be available at:
```
https://your-app.vercel.app/api/github-webhook
```

### 2. Add Environment Variable to Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add `GITHUB_WEBHOOK_SECRET` with your generated secret
4. Save and redeploy if necessary

### 3. Configure GitHub App

1. Go to your GitHub App settings: https://github.com/settings/apps/your-app-name
2. In the "Webhook" section:
   - **Webhook URL**: `https://your-app.vercel.app/api/github-webhook`
   - **Webhook secret**: Same value as `GITHUB_WEBHOOK_SECRET`
3. Select the events you want to receive
4. Save changes

## 📝 Testing the Webhook

### Local Testing with ngrok

For local development testing:

```bash
# Install ngrok
npm install -g ngrok

# Run your Next.js app
npm run dev

# In another terminal, expose your local server
ngrok http 3000
```

Use the ngrok URL for your GitHub webhook URL during testing.

### Verify It's Working

1. After configuring your GitHub App, you should receive a `ping` event
2. Check your Vercel function logs or local console for:
   ```
   📨 Received GitHub webhook
   Event Type: ping
   🏓 Received ping event
   ```

## 🔒 Security Best Practices

1. **Always verify signatures in production** - Uncomment the signature verification code
2. **Keep your webhook secret secure** - Never commit it to version control
3. **Use HTTPS** - Vercel provides this by default
4. **Validate payloads** - Check that the payload structure matches what you expect
5. **Implement rate limiting** - Consider adding rate limiting for production use

## 📋 Supported Events

The endpoint logs all GitHub webhook events and has special handling for:
- `ping` - Connection test
- `push` - Code pushes
- `pull_request` - PR events
- `issues` - Issue events
- `installation` - App installation events

## 🛠️ Customization

### Adding Event Handlers

Add new cases to the switch statement in `route.ts`:

```typescript
case 'release':
  console.log('🎉 Release event received');
  console.log('Release Tag:', payload.release?.tag_name);
  // Add your custom logic here
  break;
```

### Storing Webhook Data

To store webhook data, you can:
1. Save to a database (Vercel Postgres, MongoDB, etc.)
2. Send to a queue (Vercel KV, Redis, etc.)
3. Forward to another service

Example with Vercel KV:
```typescript
import { kv } from '@vercel/kv';

// Store webhook event
await kv.lpush('webhooks', {
  event: githubEvent,
  payload: payload,
  timestamp: new Date().toISOString()
});
```

## 🔍 Debugging

Check webhook deliveries in GitHub:
1. Go to your GitHub App settings
2. Click on "Advanced" tab
3. View "Recent Deliveries" to see webhook history and responses

Check Vercel logs:
1. Go to your Vercel project dashboard
2. Navigate to Functions tab
3. Click on `github-webhook` to see execution logs

## 📚 Additional Resources

- [GitHub Webhooks Documentation](https://docs.github.com/en/developers/webhooks-and-events/webhooks)
- [Vercel Functions Documentation](https://vercel.com/docs/functions)
- [Next.js API Routes Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)