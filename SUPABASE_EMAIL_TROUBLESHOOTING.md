# Supabase Email Authentication Troubleshooting Guide

## Common Issue: Not Receiving Verification Emails

If you're not receiving authentication emails after signing up, here are the most common causes and solutions:

### 1. Free Tier Email Limit (Most Common)
- **Issue**: Supabase free tier is limited to **3 emails per hour**
- **Solution**: Wait for an hour and try again, or upgrade to a paid plan

### 2. Check Your Spam/Junk Folder
- **Issue**: Emails from Supabase often end up in spam
- **Email Sender**: `noreply@mail.app.supabase.io`
- **Solution**: Check spam folder and mark as "Not Spam"

### 3. Email Templates Not Enabled
- **Location**: Supabase Dashboard → Authentication → Email Templates
- **Solution**: Ensure "Enable email confirmations" is turned ON

### 4. No SMTP Configuration
- **Issue**: Default Supabase SMTP has strict limits
- **Solution**: Configure custom SMTP provider (see below)

## How to Check Email Configuration

1. **Visit the email status endpoint**: 
   ```
   https://zines-theta.vercel.app/api/test-email-status
   ```

2. **Check Supabase Dashboard**:
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Select your project
   - Navigate to Authentication → Configuration → Email Auth
   - Verify settings are correct

## Setting Up Custom SMTP (Recommended for Production)

### Option 1: Resend (Recommended)
```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=your-resend-api-key
SMTP_FROM=noreply@yourdomain.com
```

### Option 2: SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
```

### Option 3: Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
SMTP_FROM=noreply@yourdomain.com
```

## How to Configure SMTP in Supabase

1. Go to your Supabase Dashboard
2. Navigate to Project Settings → Authentication
3. Scroll to SMTP Settings
4. Toggle "Enable Custom SMTP"
5. Enter your SMTP credentials
6. Save changes

## Resend Verification Email

If you didn't receive the initial verification email:

1. Visit: https://zines-theta.vercel.app/en/auth/resend-verification
2. Enter your email address
3. Click "Resend Verification Email"
4. Check your inbox (and spam folder)

## Testing Email Delivery

### Quick Test
```bash
# Check if emails are being sent
curl https://zines-theta.vercel.app/api/test-email-status
```

### Manual Test in Supabase Dashboard
1. Go to Authentication → Users
2. Find your user
3. Click "Send email verification"

## Debugging Checklist

- [ ] Checked spam/junk folder
- [ ] Waited 1 hour (if hit rate limit)
- [ ] Verified email templates are enabled
- [ ] Checked correct email address was used
- [ ] Tried resending verification email
- [ ] Checked Supabase Dashboard logs
- [ ] Verified SMTP settings (if custom)

## Alternative Solutions

### 1. Disable Email Confirmation (Development Only)
```sql
-- Run in Supabase SQL Editor (NOT recommended for production)
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'your-email@example.com';
```

### 2. Use Magic Links Instead
- Configure in Supabase Dashboard
- Authentication → Providers → Email → Enable Magic Link

### 3. Manual Verification (Admin Only)
- Go to Supabase Dashboard → Authentication → Users
- Find the user and manually confirm email

## Need More Help?

1. Check Supabase logs: Dashboard → Logs → Auth
2. Contact Supabase support (paid plans)
3. Check Supabase Discord community
4. Review [Supabase Auth Documentation](https://supabase.com/docs/guides/auth/auth-email)

## Important Notes

- Email delivery can take 5-10 minutes sometimes
- Corporate email addresses may have stricter filters
- Gmail and personal emails typically work better
- Always use a real email address for testing