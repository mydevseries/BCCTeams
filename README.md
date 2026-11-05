# BCC Teams

BCC Teams is BCC's internal collaboration platform: unified chat, teams, channels, meetings, calls, files, activity feed, and app integrations.

## Services Architecture

- **PostgreSQL**: Cloud-hosted Supabase PostgreSQL instance for persistent metadata and RLS policies.
- **SeaweedFS (S3-Compatible Object Storage)**: High-performance distributed file and object storage (Apache-2.0 license).
- **Redis 7**: Pub/sub, real-time presence heartbeats, and caching.
- **LiveKit Server**: WebRTC SFU for video and audio meetings.

---

## Running SeaweedFS Storage Locally

SeaweedFS provides S3-compatible object storage on port `8333` for file attachments, uploads, and media previews.

To start SeaweedFS using Docker Compose:
```bash
docker-compose up -d seaweedfs
```

To stop SeaweedFS:
```bash
docker-compose stop seaweedfs
```

### Storage Configuration (.env)
```env
S3_ENDPOINT=http://localhost:8333
S3_REGION=us-east-1
S3_ACCESS_KEY=any
S3_SECRET_KEY=any
S3_BUCKET=bccteams
```

*Note: In development environments where Docker or SeaweedFS is not running, the storage service automatically falls back to local disk storage in `apps/api/uploads/storage/`.*
