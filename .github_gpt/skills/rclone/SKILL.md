---
name: rclone
description: >-
  Upload, sync, and manage files across cloud storage providers using rclone. Use when uploading files (images, videos,
  documents) to S3, Cloudflare R2, Backblaze B2, Google Drive, Dropbox, or any S3-compatible storage. Triggers on
  "upload to S3", "sync to cloud", "rclone", "backup files", "upload video/image to bucket", or requests to transfer
  files to remote storage.
---

## Goal
Upload, sync, and verify files across supported cloud storage providers with `rclone`.

## Use this skill when
- Uploading files or folders to S3, Cloudflare R2, Backblaze B2, DigitalOcean Spaces, Google Drive, Dropbox, or another supported remote.
- Syncing or backing up local content to cloud storage.
- Verifying remote uploads and troubleshooting transfer issues.

## Do not use this skill when
- `rclone` is not installed and cannot be installed.
- No compatible provider or remote can be configured.
- You are about to run a destructive sync without understanding the effect.

## Operating rules
- Always run the setup check first.
- If `rclone` is missing, guide installation before continuing.
- If no remotes are configured, run `rclone config` or `rclone config create ...`.
- Use `--dry-run` before risky or large transfers.
- Use `--progress` for real transfers unless silence is required.
- Verify important uploads with `rclone check` or `rclone lsl`.

## Procedure / Reference
### Setup check
```bash
command -v rclone >/dev/null 2>&1 && echo "rclone installed: $(rclone version | head -1)" || echo "NOT INSTALLED"
rclone listremotes 2>/dev/null || echo "NO REMOTES CONFIGURED"
```

### Install if needed
```bash
brew install rclone
curl https://rclone.org/install.sh | sudo bash
sudo apt install rclone
sudo dnf install rclone
```

### Configure a remote interactively
```bash
rclone config
```

### Provider quick reference
| Provider | Type | Key Settings |
|----------|------|--------------|
| AWS S3 | `s3` | access_key_id, secret_access_key, region |
| Cloudflare R2 | `s3` | access_key_id, secret_access_key, endpoint (account_id.r2.cloudflarestorage.com) |
| Backblaze B2 | `b2` | account (keyID), key (applicationKey) |
| DigitalOcean Spaces | `s3` | access_key_id, secret_access_key, endpoint (region.digitaloceanspaces.com) |
| Google Drive | `drive` | OAuth flow |
| Dropbox | `dropbox` | OAuth flow |

### Configure Cloudflare R2
```bash
rclone config create r2 s3           provider=Cloudflare           access_key_id=YOUR_ACCESS_KEY           secret_access_key=YOUR_SECRET_KEY           endpoint=ACCOUNT_ID.r2.cloudflarestorage.com           acl=private
```

### Configure AWS S3
```bash
rclone config create aws s3           provider=AWS           access_key_id=YOUR_ACCESS_KEY           secret_access_key=YOUR_SECRET_KEY           region=us-east-1
```

### Common operations
```bash
rclone copy /path/to/file.mp4 remote:bucket/path/ --progress
rclone copy /path/to/folder remote:bucket/folder/ --progress
rclone sync /local/path remote:bucket/path/ --progress
rclone ls remote:bucket/
rclone lsd remote:bucket/
rclone copy /path remote:bucket/ --dry-run
```

### Useful flags
| Flag | Purpose |
|------|---------|
| `--progress` | Show transfer progress |
| `--dry-run` | Preview without transferring |
| `-v` | Verbose output |
| `--transfers=N` | Parallel transfers |
| `--bwlimit=RATE` | Bandwidth limit, for example `10M` |
| `--checksum` | Compare by checksum |
| `--exclude="*.tmp"` | Exclude patterns |
| `--include="*.mp4"` | Include only matching files |
| `--min-size=SIZE` | Skip smaller files |
| `--max-size=SIZE` | Skip larger files |

### Large file uploads
```bash
rclone copy large_video.mp4 remote:bucket/ --s3-chunk-size=64M --progress
rclone copy /path remote:bucket/ --progress --retries=5
```

### Verification
```bash
rclone check /local/file remote:bucket/file
rclone lsl remote:bucket/path/to/file
```

### Troubleshooting
```bash
rclone lsd remote:
rclone lsd remote: -vv
rclone config show remote
```
