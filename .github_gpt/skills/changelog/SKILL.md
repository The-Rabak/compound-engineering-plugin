---
name: changelog
description: Create engaging changelogs for recent merges to main branch
---

## Goal
Create a concise, engaging changelog for recent merges to main, with traceable PR context and optional Discord-ready formatting.

## Use this skill when
- You need a daily, weekly, or custom-period summary of merged PRs.
- The output should highlight user-facing work, fixes, and deployment notes.
- The result may need to fit Discord's 2000-character limit.

## Do not use this skill when
- There were no relevant merges and a quiet-day note is sufficient.
- The task is to review code rather than summarize shipped changes.
- You cannot access enough PR information and the user does not want a best-effort summary.

## Non-negotiable rules
- Determine the reporting window first and state it in the title.
- Use `gh` to inspect merged PRs, titles, descriptions, labels, contributors, and related issues when possible.
- Breaking changes must appear first.
- Include PR numbers for traceability and contributor credit.
- Include deployment notes when migrations, env changes, manual steps, or dependency updates matter.
- Keep the final message under 2000 characters when targeting Discord.
- Review the draft against `EVERY_WRITE_STYLE.md`.
- If multiple style-guide checks or review passes are independent, you must run them in parallel.
- Final output should contain only the changelog content itself.

## Procedure
Execute the full source-of-truth workflow below. Preserve every conditional branch, phase, checklist, and validation step from the original instructions. When the workflow says to ask, wait, route, or run in parallel, do that exactly.

#### Arguments
[optional: daily|weekly, or time period in days]

You are a witty and enthusiastic product marketer tasked with creating a fun, engaging change log for an internal development team. Your goal is to summarize the latest merges to the main branch, highlighting new features, bug fixes, and giving credit to the hard-working developers.

#### Time Period

- For daily changelogs: Look at PRs merged in the last 24 hours
- For weekly summaries: Look at PRs merged in the last 7 days
- Always specify the time period in the title (e.g., "Daily" vs "Weekly")
- Default: Get the latest changes from the last day from the main branch of the repository

#### PR Analysis

Analyze the provided GitHub changes and related issues. Look for:

1. New features that have been added
2. Bug fixes that have been implemented
3. Any other significant changes or improvements
4. References to specific issues and their details
5. Names of contributors who made the changes
6. Use gh cli to lookup the PRs as well and the description of the PRs
7. Check PR labels to identify feature type (feature, bug, chore, etc.)
8. Look for breaking changes and highlight them prominently
9. Include PR numbers for traceability
10. Check if PRs are linked to issues and include issue context

#### Content Priorities

1. Breaking changes (if any) - MUST be at the top
2. User-facing features
3. Critical bug fixes
4. Performance improvements
5. Developer experience improvements
6. Documentation updates

#### Formatting Guidelines

Now, create a change log summary with the following guidelines:

1. Keep it concise and to the point
2. Highlight the most important changes first
3. Group similar changes together (e.g., all new features, all bug fixes)
4. Include issue references where applicable
5. Mention the names of contributors, giving them credit for their work
6. Add a touch of humor or playfulness to make it engaging
7. Use emojis sparingly to add visual interest
8. Keep total message under 2000 characters for Discord
9. Use consistent emoji for each section
10. Format code/technical terms in backticks
11. Include PR numbers in parentheses (e.g., "Fixed login bug (#123)")

#### Deployment Notes

When relevant, include:

- Database migrations required
- Environment variable updates needed
- Manual intervention steps post-deploy
- Dependencies that need updating

Your final output should be formatted as follows:


###  [Daily/Weekly] Change Log: [Current Date]

####  Breaking Changes (if any)

[List any breaking changes that require immediate attention]

####  New Features

[List new features here with PR numbers]

####  Bug Fixes

[List bug fixes here with PR numbers]

####  Other Improvements

[List other significant changes or improvements]

####  Shoutouts

[Mention contributors and their contributions]

####  Fun Fact of the Day

[Include a brief, work-related fun fact or joke]


#### Style Guide Review

Now review the changelog using the EVERY_WRITE_STYLE.md file and go one by one to make sure you are following the style guide. Use multiple agents, run in parallel to make it faster.

Remember, your final output should only include the changelog content itself. Do not include your thought process or the original data in the output.

#### Discord Posting (Optional)

You can post changelogs to Discord by adding your own webhook URL:

```
# Set your Discord webhook URL
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN"

# Post using curl
curl -H "Content-Type: application/json" \
  -d "{\"content\": \"{{CHANGELOG}}\"}" \
  $DISCORD_WEBHOOK_URL
```

To get a webhook URL, go to your Discord server -> Server Settings -> Integrations -> Webhooks -> New Webhook.

#### Error Handling

- If no changes in the time period, post a "quiet day" message: " Quiet day! No new changes merged."
- If unable to fetch PR details, list the PR numbers for manual review
- Always validate message length before posting to Discord (max 2000 chars)

#### Schedule Recommendations

- Run daily at 6 AM NY time for previous day's changes
- Run weekly summary on Mondays for the previous week
- Special runs after major releases or deployments

#### Audience Considerations

Adjust the tone and detail level based on the channel:

- **Dev team channels**: Include technical details, performance metrics, code snippets
- **Product team channels**: Focus on user-facing changes and business impact
- **Leadership channels**: Highlight progress on key initiatives and blockers

## Required output
Return only the changelog body in this structure:
```markdown
# [Daily or Weekly] Change Log: [Current Date]
