---
name: feature-video
description: Record a video walkthrough of a feature and add it to the PR description
---

## Goal
Record a feature walkthrough, render both MP4 and preview GIF assets, upload them, and prepare the PR demo section.

## Use this skill when
- A finished feature needs a shareable demo in the PR description.
- Browser-recorded screenshots can show the user flow clearly.
- A cloud-uploaded MP4 plus clickable preview GIF is required.

## Do not use this skill when
- The feature is not ready to demonstrate.
- `agent-browser` or `ffmpeg` cannot be used.
- The workflow does not need PR-facing demo media.

## Non-negotiable rules
- Use the `agent-browser` CLI for capture.
- Verify prerequisites: local server, `agent-browser`, and `ffmpeg`. Use `rclone` for upload when available.
- Create both an MP4 and a preview GIF.
- Ask the user to confirm or adjust the planned shot list before recording.
- Upload the media assets and produce clickable demo markdown for the PR description.
- Keep the final video artifacts; optional cleanup only removes temporary screenshots.

## Procedure
Execute the full source-of-truth workflow below. Preserve every conditional branch, phase, checklist, and validation step from the original instructions. When the workflow says to ask, wait, route, or run in parallel, do that exactly.

#### Arguments
[PR number or 'current'] [optional: base URL, default localhost:3000]

### Feature Video Walkthrough

Record a video walkthrough demonstrating a feature, upload it, and add it to the PR description.

#### Introduction

Developer Relations Engineer creating feature demo videos

This command creates professional video walkthroughs of features for PR documentation:
- Records browser interactions using agent-browser CLI
- Demonstrates the complete user flow
- Uploads the video for easy sharing
- Updates the PR description with an embedded video

#### Prerequisites

- Local development server running (Docker containers for Laravel, `npm run dev` for frontend)
- agent-browser CLI installed
- Git repository with a PR to document
- `ffmpeg` installed (for video conversion)
- `rclone` configured (optional, for cloud upload - see rclone skill)

#### Setup

**Check installation:**
```bash
command -v agent-browser >/dev/null 2>&1 && echo "Installed" || echo "NOT INSTALLED"
```

**Install if needed:**
```bash
npm install -g agent-browser && agent-browser install
```

See the `agent-browser` skill for detailed usage.

#### Main Tasks

##### 1. Parse Arguments


**Arguments:** $ARGUMENTS

Parse the input:
- First argument: PR number or "current" (defaults to current branch's PR)
- Second argument: Base URL (defaults to `http://localhost-3000`)

```bash
# Get current branch name
git branch --show-current
```


##### 2. Gather Feature Context


**Get branch context:**
```bash
git log --oneline main..HEAD
```

**Get changed files:**
```bash
git diff --name-only main...HEAD
```

**Map files to testable routes** (same as playwright-test):

| File Pattern | Route(s) |
|-------------|----------|
| `app/Http/Controllers/*Controller.php` | Corresponding API routes (check `routes/components/`) |
| `app/Services/*Service.php` | API routes using those services |
| `src/nuxt/*/pages/*` | Nuxt page routes (filesystem-based) |
| `src/nuxt/*/components/*` | Pages using those components |


##### 3. Plan the Video Flow


Before recording, create a shot list:

1. **Opening shot**: Homepage or starting point (2-3 seconds)
2. **Navigation**: How user gets to the feature
3. **Feature demonstration**: Core functionality (main focus)
4. **Edge cases**: Error states, validation, etc. (if applicable)
5. **Success state**: Completed action/result

Ask user to confirm or adjust the flow:

```markdown
**Proposed Video Flow**

Based on PR #[number]: [title]

1. Start at: /[starting-route]
2. Navigate to: /[feature-route]
3. Demonstrate:
   - [Action 1]
   - [Action 2]
   - [Action 3]
4. Show result: [success state]

Estimated duration: ~[X] seconds

Does this look right?
1. Yes, start recording
2. Modify the flow (describe changes)
3. Add specific interactions to demonstrate
```


##### 4. Setup Video Recording


**Create videos directory:**
```bash
mkdir -p tmp/videos
```

**Recording approach: Use browser screenshots as frames**

agent-browser captures screenshots at key moments, then combine into video using ffmpeg:

```bash
ffmpeg -framerate 2 -pattern_type glob -i 'tmp/screenshots/*.png' -vf "scale=1280:-1" tmp/videos/feature-demo.gif
```


##### 5. Record the Walkthrough


Execute the planned flow, capturing each step:

**Step 1: Navigate to starting point**
```bash
agent-browser open "[base-url]/[start-route]"
agent-browser wait 2000
agent-browser screenshot tmp/screenshots/01-start.png
```

**Step 2: Perform navigation/interactions**
```bash
agent-browser snapshot -i  # Get refs
agent-browser click @e1    # Click navigation element
agent-browser wait 1000
agent-browser screenshot tmp/screenshots/02-navigate.png
```

**Step 3: Demonstrate feature**
```bash
agent-browser snapshot -i  # Get refs for feature elements
agent-browser click @e2    # Click feature element
agent-browser wait 1000
agent-browser screenshot tmp/screenshots/03-feature.png
```

**Step 4: Capture result**
```bash
agent-browser wait 2000
agent-browser screenshot tmp/screenshots/04-result.png
```

**Create video/GIF from screenshots:**

```bash
# Create directories
mkdir -p tmp/videos tmp/screenshots

# Create MP4 video (RECOMMENDED - better quality, smaller size)
# -framerate 0.5 = 2 seconds per frame (slower playback)
# -framerate 1 = 1 second per frame
ffmpeg -y -framerate 0.5 -pattern_type glob -i 'tmp/screenshots/*.png' \
  -c:v libx264 -pix_fmt yuv420p -vf "scale=1280:-2" \
  tmp/videos/feature-demo.mp4

# Create low-quality GIF for preview (small file, for GitHub embed)
ffmpeg -y -framerate 0.5 -pattern_type glob -i 'tmp/screenshots/*.png' \
  -vf "scale=640:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse" \
  -loop 0 tmp/videos/feature-demo-preview.gif
```

**Note:**
- The `-2` in MP4 scale ensures height is divisible by 2 (required for H.264)
- Preview GIF uses 640px width and 128 colors to keep file size small (~100-200KB)


##### 6. Upload the Video


**Upload with rclone:**

```bash
# Check rclone is configured
rclone listremotes

# Upload video, preview GIF, and screenshots to cloud storage
rclone copy tmp/videos/ your-remote:pr-videos/pr-[number]/ --progress
rclone copy tmp/screenshots/ your-remote:pr-videos/pr-[number]/screenshots/ --progress

# List uploaded files
rclone ls your-remote:pr-videos/pr-[number]/
```

Public URLs (configure your own cloud storage):
```
Video: https://your-storage-url/pr-videos/pr-[number]/feature-demo.mp4
Preview: https://your-storage-url/pr-videos/pr-[number]/feature-demo-preview.gif
```


##### 7. Share the Video


**Prepare the demo section for the MR description:**

Use a clickable GIF that links to the video:

```markdown
## Demo

[![Feature Demo]([preview-gif-url])]([video-mp4-url])

*Click to view full video*
```

**Save for the user to add to their MR:**
```bash
cat > /tmp/mr-demo-section.md <<'DEMO'
## Demo

[![Feature Demo]([preview-gif-url])]([video-mp4-url])

*Click to view full video*
DEMO
echo "Demo section saved to /tmp/mr-demo-section.md -- paste into your MR description"
```


##### 8. Cleanup


```bash
# Optional: Clean up screenshots
rm -rf tmp/screenshots

# Keep videos for reference
echo "Video retained at: tmp/videos/feature-demo.gif"
```


##### 9. Summary


Present completion summary:

```markdown
## Feature Video Complete

**PR:** #[number] - [title]
**Video:** [url or local path]
**Duration:** ~[X] seconds
**Format:** [GIF/MP4]

### Shots Captured
1. [Starting point] - [description]
2. [Navigation] - [description]
3. [Feature demo] - [description]
4. [Result] - [description]

### PR Updated
- [x] Video section added to PR description
- [ ] Ready for review

**Next steps:**
- Review the video to ensure it accurately demonstrates the feature
- Share with reviewers for context
```


#### Quick Usage Examples

```bash
# Record video for current branch's PR
/feature-video

# Record video for specific PR
/feature-video 847

# Record with custom base URL
/feature-video 847 http://localhost-5000

# Record for staging environment
/feature-video current https://staging.example.com
```

#### Tips

- **Keep it short**: 10-30 seconds is ideal for PR demos
- **Focus on the change**: Don't include unrelated UI
- **Show before/after**: If fixing a bug, show the broken state first (if possible)
- **Annotate if needed**: Add text overlays for complex features

## Required output
Return:
- PR number or branch context.
- Video URL.
- Preview GIF URL.
- Upload destination.
- Demo markdown ready for the PR description.
- A short summary of the recorded flow.
