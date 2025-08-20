# Mobile Deployment Strategy: Path vs Subdomain

## Current Approach: coretet.app/mobile (Path-based)

### Pros ✅
- **Single deployment** - One build, one hosting service
- **Shared auth** - Same cookies/session across desktop and mobile
- **Easier local dev** - Just navigate to /mobile
- **Shared code** - Components, contexts, utilities all in one place
- **Lower cost** - Single hosting instance

### Cons ❌
- **Bundle size** - Mobile users download desktop code too
- **Routing complexity** - Need to handle redirects carefully
- **Less flexibility** - Can't use different hosting/CDN settings
- **PWA challenges** - Service worker scope issues

## Alternative: m.coretet.app (Subdomain)

### Pros ✅
- **Optimized bundles** - Mobile-only code for mobile users
- **Independent deployment** - Deploy mobile without affecting desktop
- **Better PWA support** - Clean service worker scope
- **CDN optimization** - Different caching strategies
- **A/B testing** - Easier to test mobile changes
- **Native app feel** - Cleaner URLs (m.coretet.app vs coretet.app/mobile)

### Cons ❌
- **Cross-domain auth** - Need to share auth between domains
- **Code duplication** - Might need separate repos/builds
- **Extra configuration** - DNS, SSL certs, hosting
- **Higher complexity** - Two deployments to manage

## Hybrid Approach (Recommended)

### Keep current structure but optimize:

1. **Smart code splitting**
```typescript
// Lazy load mobile components
const MobileRoute = lazy(() => import('./routes/MobileRoute'));
```

2. **Conditional imports**
```typescript
// Only load mobile-specific code when needed
if (isMobile) {
  import('./mobile-specific-features').then(...)
}
```

3. **Progressive Web App**
```json
// manifest.json
{
  "start_url": "/mobile",
  "scope": "/mobile/",
  "display": "standalone"
}
```

4. **Nginx/CDN rules** (if using subdomain later)
```nginx
# Redirect mobile users
if ($http_user_agent ~* mobile) {
  return 301 https://m.coretet.app$request_uri;
}
```

## Decision Framework

### Stay with /mobile if:
- You want simplicity ✅
- Shared auth is important ✅
- You're still iterating on mobile UX ✅
- Bundle size isn't critical yet ✅

### Move to m.coretet.app if:
- Mobile is your primary platform
- You need native app performance
- You want independent deployment cycles
- You have many mobile-specific features

## Immediate Improvements for /mobile

1. **Fix service worker scope**
```javascript
// sw.js
self.addEventListener('fetch', (event) => {
  // Handle /mobile/* requests specifically
  if (event.request.url.includes('/mobile/')) {
    // Mobile-specific caching strategy
  }
});
```

2. **Add mobile detection redirect**
```typescript
// App.tsx
useEffect(() => {
  if (isMobile && !location.pathname.startsWith('/mobile')) {
    navigate('/mobile');
  }
}, []);
```

3. **Optimize mobile bundle**
```typescript
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'mobile': ['./src/components/Mobile/*'],
          'desktop': ['./src/components/Library/*']
        }
      }
    }
  }
}
```

## Recommendation

**Stay with coretet.app/mobile for now**, but:
1. Implement code splitting
2. Fix any routing issues
3. Optimize the mobile experience
4. Consider m.coretet.app later if you need:
   - True native performance
   - Separate mobile team
   - Different tech stack for mobile