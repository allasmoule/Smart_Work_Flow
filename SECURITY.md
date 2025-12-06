# Security & Production Notes

## Environment Variables

Required environment variables (see `.env.local.example`):

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Strong random string (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL`: Your app URL (e.g., `https://yourdomain.com`)
- AWS S3 credentials for file uploads
- Pusher credentials for realtime
- Optional: SendGrid for emails, Redis for BullMQ

## File Upload Security

1. **Validation**: Server validates file type, size (max 10MB default)
2. **Presigned URLs**: Expire after 1 hour
3. **Scanning**: Recommended to scan uploads with ClamAV or VirusTotal API
4. **CORS**: Configure S3 bucket CORS for your domain only

## Rate Limiting

Add rate limiting to API routes:

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});
```

## RBAC Enforcement

- Always use `requireRole()` or `requireAuth()` in API routes
- Check permissions in middleware for pages
- Never trust client-side role checks

## Secrets Management

- Use Vercel/Railway secrets manager in production
- Rotate keys regularly
- Never commit `.env.local`
- Use different secrets for dev/staging/prod

## Database Security

- Enable SSL for database connections
- Use connection pooling
- Implement RLS policies if using Supabase
- Regular backups

## Authentication

- Use strong `NEXTAUTH_SECRET`
- Enable HTTPS only
- Consider 2FA for admin accounts
- Session timeout: configure in NextAuth options

## Production Checklist

- [ ] All env vars set
- [ ] Database migrations run
- [ ] S3 bucket configured with CORS
- [ ] Rate limiting enabled
- [ ] Monitoring set up (Sentry, etc.)
- [ ] Error logging configured
- [ ] Backup strategy in place
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] File scanning enabled

