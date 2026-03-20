---
name: report-bug
description: Report a bug in the compound-engineering plugin
---

## Goal
Collect a structured bug report for the compound-engineering plugin, enrich it with environment details, and save it for filing.

## Use this skill when
- The user hit a bug in an agent, command, skill, MCP server, installation flow, or related plugin behavior.
- The maintainer needs a reproducible, structured report.

## Do not use this skill when
- The issue is not about the compound-engineering plugin.
- The user wants debugging or reproduction work instead of report preparation.
- The report would require collecting secrets or private data.

## Non-negotiable rules
- Ask the six bug-report questions in order.
- Preserve the bug-report template structure.
- Auto-collect environment information after the interview.
- Save the report to `/tmp/bug-report.md`.
- Do not collect personal information, credentials, API keys, private code, or unnecessary file paths.
- If required information is missing, re-prompt only for the missing field.

## Procedure
Execute the full source-of-truth workflow below. Preserve every conditional branch, phase, checklist, and validation step from the original instructions. When the workflow says to ask, wait, route, or run in parallel, do that exactly.

#### Arguments
[optional: brief description of the bug]

### Report a Compounding Engineering Plugin Bug

Report bugs encountered while using the compound-engineering plugin. This command gathers structured information and prepares a bug report for the maintainer.

#### Step 1: Gather Bug Information

Use the AskUserQuestion tool to collect the following information:

**Question 1: Bug Category**
- What type of issue are you experiencing?
- Options: Agent not working, Command not working, Skill not working, MCP server issue, Installation problem, Other

**Question 2: Specific Component**
- Which specific component is affected?
- Ask for the name of the agent, command, skill, or MCP server

**Question 3: What Happened (Actual Behavior)**
- Ask: "What happened when you used this component?"
- Get a clear description of the actual behavior

**Question 4: What Should Have Happened (Expected Behavior)**
- Ask: "What did you expect to happen instead?"
- Get a clear description of expected behavior

**Question 5: Steps to Reproduce**
- Ask: "What steps did you take before the bug occurred?"
- Get reproduction steps

**Question 6: Error Messages**
- Ask: "Did you see any error messages? If so, please share them."
- Capture any error output

#### Step 2: Collect Environment Information

Automatically gather:
```bash
# Get plugin version
cat ~/.copilot/plugins/installed_plugins.json 2>/dev/null | grep -A5 "compound-engineering" | head -10 || echo "Plugin info not found"

# Get the host CLI version
claude --version 2>/dev/null || echo "the model CLI version unknown"

# Get OS info
uname -a
```

#### Step 3: Format the Bug Report

Create a well-structured bug report with:

```markdown
## Bug Description

**Component:** [Type] - [Name]
**Summary:** [Brief description from argument or collected info]

## Environment

- **Plugin Version:** [from installed_plugins.json]
- **the host CLI Version:** [from claude --version]
- **OS:** [from uname]

## What Happened

[Actual behavior description]

## Expected Behavior

[Expected behavior description]

## Steps to Reproduce

1. [Step 1]
2. [Step 2]
3. [Step 3]

## Error Messages

```
[Any error output]
```

## Additional Context

[Any other relevant information]

---
*Reported via `/report-bug` command*
```

#### Step 4: Save Bug Report

Save the formatted bug report so the user can file it:

```bash
cat > /tmp/bug-report.md <<'BUGREPORT'
[Formatted bug report from Step 3]
BUGREPORT
echo "Bug report saved to /tmp/bug-report.md"
```

Inform the user:
- "Bug report saved to `/tmp/bug-report.md`"
- "Please file this as an issue in the plugin repository or share it with the maintainer (The Rabak)"

#### Output Format

```
Bug report prepared!

Saved to: /tmp/bug-report.md
Title: [compound-engineering] Bug: [description]

Please file this in the plugin repository or share with the maintainer.
Thank you for helping improve the compound-engineering plugin!
```
- If issue creation fails: Display the formatted report so user can manually create the issue
- If required information is missing: Re-prompt for that specific field

#### Privacy Notice

This command does NOT collect:
- Personal information
- API keys or credentials
- Private code from your projects
- File paths beyond basic OS info

Only technical information about the bug is included in the report.

## Required output
Return:
- `Bug report prepared!`
- The saved file path `/tmp/bug-report.md`.
- The suggested issue title in the form `[compound-engineering] Bug: ...`.
- A short reminder to file or share the report.
