-- DEBUG EMAIL CASE SENSITIVITY
-- Check if email case is causing issues

-- 1. Your auth email (exactly as stored)
SELECT 
    'Your Auth Email' as info,
    auth.email() as auth_email,
    LOWER(auth.email()) as auth_email_lower,
    auth.uid() as user_id;

-- 2. Check shares with different email cases
SELECT 
    'Shares by Email Variations' as section,
    shared_with_email,
    share_status,
    created_at,
    CASE 
        WHEN LOWER(shared_with_email) = LOWER(auth.email()) THEN '✓ Matches (case-insensitive)'
        ELSE '✗ No match'
    END as matches_your_email
FROM playlist_shares
WHERE 
    LOWER(shared_with_email) = LOWER(auth.email()) OR
    shared_with_email = auth.email() OR
    shared_with_email ILIKE '%' || SPLIT_PART(auth.email(), '@', 1) || '%'
ORDER BY created_at DESC;

-- 3. Search for any shares that might be yours
SELECT 
    'Potential Shares for You' as section,
    id,
    shared_with_email,
    share_status,
    created_at,
    '↑ Check if this email matches yours' as note
FROM playlist_shares
WHERE shared_with_email ILIKE '%eric%'
   OR shared_with_email ILIKE '%exley%'
ORDER BY created_at DESC;

-- 4. All unique shared_with_email values
SELECT 
    'All Share Recipients' as section,
    DISTINCT shared_with_email,
    COUNT(*) as share_count
FROM playlist_shares
GROUP BY shared_with_email
ORDER BY shared_with_email;

-- 5. Fix: Standardize email case in shares
-- This will update any shares to match your current auth email case
/*
UPDATE playlist_shares
SET shared_with_email = auth.email()
WHERE LOWER(shared_with_email) = LOWER(auth.email())
  AND shared_with_email != auth.email();
*/