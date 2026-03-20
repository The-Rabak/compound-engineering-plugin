---
name: agent-browser
description: >-
  Browser automation using Vercel's agent-browser CLI. Use when you need to interact with web pages, fill forms, take
  screenshots, or scrape data. Alternative to Playwright MCP - uses Bash commands with ref-based element selection.
  Triggers on "browse website", "fill form", "click button", "take screenshot", "scrape page", "web automation".
---

## Goal
Automate a browser through Vercel's `agent-browser` CLI using ref-based accessibility snapshots. Prefer the snapshot -> interact -> resnapshot loop.

## Use this skill when
- Interacting with web pages from Bash.
- Filling forms, clicking buttons, scraping content, or taking screenshots.
- Running quick browser automation without Playwright MCP.

## Do not use this skill when
- You need Playwright MCP tool calls instead of CLI commands.
- You are about to use Playwright ref syntax like `e1`; `agent-browser` uses `@e1`.
- You have not refreshed the snapshot after navigation or a DOM change.

## Operating rules
- Run the setup check first.
- Install `agent-browser` and Chromium if needed.
- Use `agent-browser snapshot -i` before interacting. Add `--json` when structured parsing helps.
- After every navigation, modal change, or DOM update, take a fresh snapshot before the next action.
- Use `--session` for parallel browsers.
- Use `--headed` when visual debugging is necessary.
- Prefer semantic locators when refs are unstable or awkward.

## Procedure / Reference
### Setup check
```bash
command -v agent-browser >/dev/null 2>&1 && echo "Installed" || echo "NOT INSTALLED - run: npm install -g agent-browser && agent-browser install"
```

### Install if needed
```bash
npm install -g agent-browser
agent-browser install
```

### Core workflow
```bash
agent-browser open https://example.com
agent-browser snapshot -i --json
agent-browser click @e1
agent-browser fill @e2 "search query"
agent-browser snapshot -i
```

### Navigation
```bash
agent-browser open <url>
agent-browser back
agent-browser forward
agent-browser reload
agent-browser close
```

### Snapshots
```bash
agent-browser snapshot
agent-browser snapshot -i
agent-browser snapshot -i --json
agent-browser snapshot -c
agent-browser snapshot -d 3
```

### Interactions
```bash
agent-browser click @e1
agent-browser dblclick @e1
agent-browser fill @e1 "text"
agent-browser type @e1 "text"
agent-browser press Enter
agent-browser hover @e1
agent-browser check @e1
agent-browser uncheck @e1
agent-browser select @e1 "option"
agent-browser scroll down 500
agent-browser scrollintoview @e1
```

### Read page state
```bash
agent-browser get text @e1
agent-browser get html @e1
agent-browser get value @e1
agent-browser get attr href @e1
agent-browser get title
agent-browser get url
agent-browser get count "button"
```

### Screenshots, PDFs, and waits
```bash
agent-browser screenshot
agent-browser screenshot --full
agent-browser screenshot output.png
agent-browser screenshot --full output.png
agent-browser pdf output.pdf
agent-browser wait @e1
agent-browser wait 2000
agent-browser wait "text"
```

### Semantic locators
```bash
agent-browser find role button click --name "Submit"
agent-browser find text "Sign up" click
agent-browser find label "Email" fill "user@example.com"
agent-browser find placeholder "Search..." fill "query"
```

### Sessions and headed mode
```bash
agent-browser --session browser1 open https://site1.com
agent-browser --session browser2 open https://site2.com
agent-browser session list
agent-browser --headed open https://example.com
agent-browser --headed snapshot -i
agent-browser --headed click @e1
```

### Example login flow
```bash
agent-browser open https://app.example.com/login
agent-browser snapshot -i
agent-browser fill @e1 "user@example.com"
agent-browser fill @e2 "password123"
agent-browser click @e3
agent-browser wait 2000
agent-browser snapshot -i
```

### JSON output shape
```bash
agent-browser snapshot -i --json
```

```json
{
  "success": true,
  "data": {
    "refs": {
      "e1": {"name": "Submit", "role": "button"},
      "e2": {"name": "Email", "role": "textbox"}
    },
    "snapshot": "- button "Submit" [ref=e1]\n- textbox "Email" [ref=e2]"
  }
}
```
