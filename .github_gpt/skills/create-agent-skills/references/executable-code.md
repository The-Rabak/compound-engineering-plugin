# Returns: "OK" or lists conflicts

## Goal
Use this reference to support `create-agent-skills` with direct, decision-oriented guidance.

## Use this reference when
- You need background knowledge, constraints, or patterns while executing the parent skill.
- A workflow tells you to read or consult this file before acting.

## Operating rules
- Treat this file as reference material, not a standalone workflow.
- Pull concrete rules, examples, and constraints from the sections below.
- Prefer direct application over paraphrasing.

## Reference content

## When To Use Scripts
Even if the model could write a script, pre-made scripts offer advantages:
- More reliable than generated code
- Save tokens (no need to include code in context)
- Save time (no code generation required)
- Ensure consistency across uses

## Execution Vs Reference
Make clear whether the model should:
- **Execute the script** (most common): "Run `analyze_form.py` to extract fields"
- **Read it as reference** (for complex logic): "See `analyze_form.py` for the extraction algorithm"

For most utility scripts, execution is preferred.

## How Scripts Work
When the model executes a script via bash:
1. Script code never enters context window
2. Only script output consumes tokens
3. Far more efficient than having the model generate equivalent code

## File Organization
## Scripts Directory
**Best practice**: Place all executable scripts in a `scripts/` subdirectory within the skill folder.

```
skill-name/
├── SKILL.md
├── scripts/
│   ├── main_utility.py
│   ├── helper_script.py
│   └── validator.py
└── references/
    └── api-docs.md
```

**Benefits**:
- Keeps skill root clean and organized
- Clear separation between documentation and executable code
- Consistent pattern across all skills
- Easy to reference: `python scripts/script_name.py`

**Reference pattern**: In SKILL.md, reference scripts using the `scripts/` path:

```bash
python ~/.github_gpt/skills/skill-name/scripts/analyze.py input.har
```

## Utility Scripts Pattern
## Example
## Utility scripts

**analyze_form.py**: Extract all form fields from PDF

```bash
python scripts/analyze_form.py input.pdf > fields.json
```

Output format:
```json
{
  "field_name": { "type": "text", "x": 100, "y": 200 },
  "signature": { "type": "sig", "x": 150, "y": 500 }
}
```

**validate_boxes.py**: Check for overlapping bounding boxes

```bash
python scripts/validate_boxes.py fields.json
# Returns: "OK" or lists conflicts
```

**fill_form.py**: Apply field values to PDF

```bash
python scripts/fill_form.py input.pdf fields.json output.pdf
```

## Solve Dont Punt
Handle error conditions rather than punting to the model.

<example type="good">
```python
def process_file(path):
    """Process a file, creating it if it doesn't exist."""
    try:
        with open(path) as f:
            return f.read()
    except FileNotFoundError:
        print(f"File {path} not found, creating default")
        with open(path, 'w') as f:
            f.write('')
        return ''
    except PermissionError:
        print(f"Cannot access {path}, using default")
        return ''
```

<example type="bad">
```python
def process_file(path):
    # Just fail and let the model figure it out
    return open(path).read()
```

## Configuration Values
Document configuration parameters to avoid "voodoo constants":

<example type="good">
```python
# HTTP requests typically complete within 30 seconds
REQUEST_TIMEOUT = 30

# Three retries balances reliability vs speed
MAX_RETRIES = 3
```

<example type="bad">
```python
TIMEOUT = 47  # Why 47?
RETRIES = 5   # Why 5?
```

## Package Dependencies
## Runtime Constraints
Skills run in code execution environment with platform-specific limitations:
- **claude.ai**: Can install packages from npm and PyPI
- **Anthropic API**: No network access and no runtime package installation

## Guidance
List required packages in your SKILL.md and verify they're available.

<example type="good">
Install required package: `pip install pypdf`

Then use it:

```python
from pypdf import PdfReader
reader = PdfReader("file.pdf")
```

<example type="bad">
"Use the pdf library to process the file."

## Mcp Tool References
If your Skill uses MCP (Model Context Protocol) tools, always use fully qualified tool names.

<format>ServerName:tool_name</format>

## Examples
- Use the BigQuery:bigquery_schema tool to retrieve table schemas.
- Use the GitHub:create_issue tool to create issues.

Without the server prefix, the model may fail to locate the tool, especially when multiple MCP servers are available.
