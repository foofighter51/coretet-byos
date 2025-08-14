# Invite Code Validation Guide

## Quick Steps to Check Your Invite Codes

### 1. Check All Existing Codes
Run the first query in `CHECK_EXISTING_INVITES.sql` to see all your invite codes and their status:
- **ACTIVE** - Can be used for signup
- **EXPIRED** - Past expiration date, needs extension
- **USED** - Already claimed by a user

### 2. Common Issues and Fixes

#### Issue: "Invalid or expired invite code"
**Possible causes:**
1. Code has expired
2. Code was already used
3. Code was typed incorrectly (must be UPPERCASE)
4. Code doesn't exist

**Fix for expired codes:**
```sql
-- Extend all expired unused codes by 30 days
UPDATE invites
SET expires_at = NOW() + INTERVAL '30 days'
WHERE used_by IS NULL 
  AND expires_at < NOW();
```

#### Issue: User still can't sign up with valid code
**Check these things:**
1. Make sure email confirmations are still disabled in Supabase Dashboard
2. Verify the code format is correct (8 uppercase alphanumeric characters)
3. Check if there are any database triggers failing

### 3. Test a Specific Code
Replace 'YOURCODE' with the actual invite code:
```sql
SELECT 
  code,
  CASE 
    WHEN used_by IS NOT NULL THEN '❌ Already used'
    WHEN expires_at < NOW() THEN '❌ Expired on ' || expires_at::DATE
    ELSE '✅ Valid until ' || expires_at::DATE
  END as status
FROM invites
WHERE code = 'YOURCODE';
```

### 4. Create Fresh Invite Codes
If you need new codes:
```sql
-- Create 5 new invite codes valid for 30 days
INSERT INTO invites (code, created_by, expires_at)
SELECT 
  UPPER(substr(md5(random()::text || clock_timestamp()::text), 1, 8)),
  (SELECT id FROM profiles WHERE email = 'ericexley@gmail.com' LIMIT 1),
  NOW() + INTERVAL '30 days'
FROM generate_series(1, 5)
RETURNING code;
```

### 5. Share Invite Links
When sharing invite codes, users can use them in two ways:
1. Direct link: `https://coretet.app?invite=THECODE`
2. Manual entry during signup

## Troubleshooting Checklist

- [ ] Run `CHECK_EXISTING_INVITES.sql` section 1 to see all codes
- [ ] Check if the problem codes are ACTIVE, EXPIRED, or USED
- [ ] If EXPIRED, run the UPDATE query to extend them
- [ ] Verify in Supabase Dashboard that email confirmations are OFF
- [ ] Test signup with a fresh code to ensure the system works
- [ ] Check browser console for detailed error messages during signup

## Current System Status
- ✅ Auth triggers have been fixed
- ✅ Profile creation happens automatically
- ✅ Email confirmations are disabled
- ✅ Invite validation happens before user creation