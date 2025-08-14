# Verify coretet.app Domain with Resend

## Step 1: Add Domain to Resend
1. Log in to your [Resend Dashboard](https://resend.com/domains)
2. Click "Add Domain"
3. Enter: `coretet.app`
4. Click "Add"

## Step 2: Add DNS Records
Resend will show you DNS records to add. You'll need to add these to your domain's DNS settings.

### Where to Add DNS Records:
- If you bought the domain through **Netlify Domains**: Go to Netlify > Domains > coretet.app > DNS settings
- If you bought it elsewhere (GoDaddy, Namecheap, etc.): Log in to your domain registrar

### DNS Records to Add:
Resend will give you 3 records that look something like this:

1. **SPF Record** (TXT)
   - Name/Host: `@` or leave blank
   - Type: `TXT`
   - Value: `v=spf1 include:amazonses.com ~all`

2. **DKIM Record 1** (CNAME)
   - Name/Host: `resend._domainkey`
   - Type: `CNAME`
   - Value: Something like `resend._domainkey.coretet.app.fwr1.email-dns.resend.com`

3. **DKIM Record 2** (CNAME)
   - Name/Host: `resend2._domainkey`
   - Type: `CNAME`
   - Value: Something like `resend2._domainkey.coretet.app.fwr2.email-dns.resend.com`

## Step 3: Add DNS Records in Netlify (if using Netlify Domains)
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click on your site
3. Go to "Domain settings"
4. Click "Go to DNS panel" for coretet.app
5. Add each record:
   - Click "Add new record"
   - Choose the record type (TXT or CNAME)
   - Enter the values from Resend
   - Click "Save"

## Step 4: Wait for Verification
- DNS propagation can take 5-48 hours (usually much faster)
- Resend will automatically check every few minutes
- You'll see the status change from "Pending" to "Verified" in Resend

## Step 5: Update Your Edge Function
Once verified, update the "from" email address:

1. Edit `/supabase/functions/send-feedback/index.ts`
2. Change line 77 to use your domain:
   ```typescript
   from: 'CoreTet <feedback@coretet.app>',
   // or
   from: 'CoreTet <noreply@coretet.app>',
   ```

3. Redeploy the function:
   ```bash
   supabase functions deploy send-feedback
   ```

## Alternative: Use Subdomain
If you want to keep your main domain DNS simple, you can verify a subdomain instead:
- Add domain: `mail.coretet.app` or `feedback.coretet.app`
- Then send from: `noreply@mail.coretet.app`

## Quick Check
To see if your domain is verified:
1. Go to [Resend Domains](https://resend.com/domains)
2. Look for the green "Verified" badge next to coretet.app

## Notes:
- You can send from ANY email address @coretet.app once verified (feedback@, noreply@, hello@, etc.)
- The SPF record helps prevent your emails from going to spam
- DKIM records provide authentication for your emails
- If you're already using the domain for other email services, the SPF record might need to be combined