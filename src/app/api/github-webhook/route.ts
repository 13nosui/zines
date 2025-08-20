import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * GitHub Webhook Receiver Endpoint for Vercel
 * 
 * This endpoint receives webhook events from GitHub Apps.
 * Deploy URL: https://your-app.vercel.app/api/github-webhook
 * 
 * Setup Instructions:
 * 1. Deploy this to Vercel
 * 2. Set the GITHUB_WEBHOOK_SECRET environment variable in Vercel
 * 3. Register the webhook URL in your GitHub App settings:
 *    - Go to your GitHub App settings
 *    - Set Webhook URL to: https://your-app.vercel.app/api/github-webhook
 *    - Set the Webhook secret (same as GITHUB_WEBHOOK_SECRET)
 *    - Select the events you want to receive
 */

/**
 * Verify GitHub webhook signature
 * 
 * GitHub signs the webhook payload with HMAC-SHA256 using your webhook secret.
 * This function verifies that the signature matches.
 * 
 * @param payload - The raw request body
 * @param signature - The X-Hub-Signature-256 header value
 * @param secret - Your webhook secret
 * @returns boolean indicating if the signature is valid
 */
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  
  // Use timingSafeEqual to prevent timing attacks
  if (signature.length !== digest.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

export async function POST(request: NextRequest) {
  try {
    // Get the raw body as text for signature verification
    const rawBody = await request.text();
    
    // Get headers
    const signature = request.headers.get('x-hub-signature-256');
    const githubEvent = request.headers.get('x-github-event');
    const githubDelivery = request.headers.get('x-github-delivery');
    
    console.log('📨 Received GitHub webhook');
    console.log('Event Type:', githubEvent);
    console.log('Delivery ID:', githubDelivery);
    
    // Parse the JSON payload
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      console.error('❌ Failed to parse webhook payload:', error);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }
    
    // OPTIONAL: Verify webhook signature (uncomment to enable)
    // Requires GITHUB_WEBHOOK_SECRET environment variable to be set
    /*
    if (signature && process.env.GITHUB_WEBHOOK_SECRET) {
      const isValid = verifySignature(
        rawBody,
        signature,
        process.env.GITHUB_WEBHOOK_SECRET
      );
      
      if (!isValid) {
        console.error('❌ Invalid webhook signature');
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      console.log('✅ Webhook signature verified');
    } else if (process.env.NODE_ENV === 'production') {
      // In production, you should always verify signatures
      console.warn('⚠️  Webhook signature verification is disabled');
    }
    */
    
    // Log the webhook payload
    console.log('📦 Webhook Payload:', JSON.stringify(payload, null, 2));
    
    // Handle different event types
    switch (githubEvent) {
      case 'ping':
        console.log('🏓 Received ping event');
        break;
        
      case 'push':
        console.log('🚀 Push event received');
        console.log('Repository:', payload.repository?.full_name);
        console.log('Pusher:', payload.pusher?.name);
        console.log('Commits:', payload.commits?.length);
        break;
        
      case 'pull_request':
        console.log('🔄 Pull request event received');
        console.log('Action:', payload.action);
        console.log('PR Number:', payload.pull_request?.number);
        console.log('PR Title:', payload.pull_request?.title);
        break;
        
      case 'issues':
        console.log('📋 Issues event received');
        console.log('Action:', payload.action);
        console.log('Issue Number:', payload.issue?.number);
        console.log('Issue Title:', payload.issue?.title);
        break;
        
      case 'installation':
        console.log('⚙️  Installation event received');
        console.log('Action:', payload.action);
        console.log('Installation ID:', payload.installation?.id);
        break;
        
      default:
        console.log(`📌 Received ${githubEvent} event`);
    }
    
    // Return success response
    return NextResponse.json(
      { 
        message: 'Webhook received successfully',
        event: githubEvent,
        delivery: githubDelivery
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { 
      message: 'GitHub Webhook Endpoint',
      method: 'POST',
      path: '/api/github-webhook',
      status: 'ready'
    },
    { status: 200 }
  );
}