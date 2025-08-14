# Supabase Storage Limits & Considerations for CoreTet

## Supabase Storage Limits (as of 2025)

### Free Tier
- **Storage**: 1GB total
- **Bandwidth**: 2GB per month
- **File size limit**: 50MB per file
- **API requests**: Limited

### Pro Tier ($25/month)
- **Storage**: 100GB included (+$0.021/GB after)
- **Bandwidth**: 200GB per month (+$0.09/GB after)
- **File size limit**: 5GB per file
- **API requests**: Unlimited

### Team/Enterprise
- Custom limits
- Volume discounts

## Music App Specific Calculations

### Typical Audio File Sizes
- **MP3 (128kbps)**: ~1MB per minute
- **MP3 (320kbps)**: ~2.5MB per minute
- **M4A/AAC**: ~1.5MB per minute
- **Lossless (FLAC)**: ~5-10MB per minute

### Example Scenarios

#### Small Personal Library (Free Tier)
- 1GB storage = ~200-300 MP3 songs (320kbps, 3-4 min each)
- 2GB bandwidth = ~400-600 plays per month

#### Medium Library (Pro Tier) 
- 100GB = 20,000-30,000 MP3 songs
- 200GB bandwidth = 40,000-60,000 plays per month

#### Cost Analysis at Scale
If you exceed Pro tier:
- Extra storage: $0.021/GB/month
- Extra bandwidth: $0.09/GB
- 1TB storage + 1TB bandwidth ≈ $110/month

## Comparison with AWS S3

### S3 Pricing
- **Storage**: $0.023/GB/month
- **Bandwidth**: $0.09/GB (similar)
- **Requests**: $0.0004 per 1,000 requests
- **No storage limits**

### Break-even Analysis
- Under 100GB: Supabase is simpler and cost-effective
- Over 500GB: S3 becomes more economical
- Over 1TB: S3 is significantly cheaper

## Other Supabase Limitations

### 1. **Concurrent Connections**
- Free: 50 concurrent connections
- Pro: 500 concurrent connections
- Can affect simultaneous users

### 2. **Database Size**
- Free: 500MB
- Pro: 8GB
- Tracks metadata adds up

### 3. **Edge Function Executions**
- Free: 500K invocations/month
- Pro: 2M invocations/month

### 4. **Bandwidth Considerations**
- Every play streams the entire file
- No built-in CDN (unlike S3 + CloudFront)
- Higher latency for global users

## Recommendations Based on Use Case

### Stay with Supabase Storage if:
- ✅ Personal/small team use (<50 users)
- ✅ Under 100GB total storage
- ✅ Mainly local/regional users
- ✅ Want simplicity over cost optimization
- ✅ Budget for Pro tier ($25/month)

### Consider S3 Migration if:
- ❌ Public app with many users
- ❌ Over 500GB of audio files
- ❌ Global user base (need CDN)
- ❌ Cost-sensitive at scale
- ❌ Need advanced features (transcoding, etc.)

## Optimization Strategies for Supabase

### 1. **Compress Audio**
```javascript
// Use lower bitrates for previews
const uploadOptions = {
  quality: userTier === 'free' ? 128 : 320
};
```

### 2. **Implement Caching**
```javascript
// Cache signed URLs (1 hour expiry)
const urlCache = new Map();
```

### 3. **Lazy Loading**
- Don't generate URLs until play
- Paginate track lists

### 4. **Monitor Usage**
```sql
-- Check your storage usage
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  SUM((metadata->>'size')::bigint) / 1024 / 1024 / 1024 as size_gb
FROM storage.objects
GROUP BY bucket_id;
```

### 5. **User Quotas**
```sql
-- Implement per-user limits
ALTER TABLE profiles 
ADD COLUMN storage_quota_mb INTEGER DEFAULT 1024; -- 1GB default
```

## Migration Path if Needed

If you outgrow Supabase Storage:

1. **Dual Support Phase**
   - New uploads to S3
   - Existing files stay in Supabase
   - Gradually migrate

2. **Batch Migration**
   ```javascript
   // Script to migrate from Supabase to S3
   async function migrateBatch(offset, limit) {
     // Download from Supabase
     // Upload to S3
     // Update database
   }
   ```

3. **Update Storage Path**
   ```sql
   UPDATE tracks 
   SET storage_path = 's3:' || storage_path
   WHERE migrated_to_s3 = true;
   ```

## Current Status Check

Based on your setup:
- Files are in Supabase Storage ✓
- Using `audio-files` bucket ✓
- Need to fix column naming issue

## Immediate Recommendation

Since you already have files in Supabase Storage and it's working:

1. **Fix the immediate issue** (column naming)
2. **Monitor your usage** for a month
3. **Decide on S3** only if you hit limits

The column fix is more urgent than the storage choice!