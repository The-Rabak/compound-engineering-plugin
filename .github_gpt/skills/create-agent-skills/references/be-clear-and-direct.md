# Analysis Report: [Title]

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

## Golden Rule
Show your skill to someone with minimal context and ask them to follow the instructions. If they're confused, the model will likely be too.

## Overview
Clarity and directness are fundamental to effective skill authoring. Clear instructions reduce errors, improve execution quality, and minimize token waste.

## Guidelines
## Contextual Information
Give the model contextual information that frames the task:

- What the task results will be used for
- What audience the output is meant for
- What workflow the task is part of
- The end goal or what successful completion looks like

Context helps the model make better decisions and produce more appropriate outputs.

## Example
```xml
<context>
This analysis will be presented to investors who value transparency and actionable insights. Focus on financial metrics and clear recommendations.
</context>
```

## Specificity
Be specific about what you want the model to do. If you want code only and nothing else, say so.

**Vague**: "Help with the report"
**Specific**: "Generate a markdown report with three sections: Executive Summary, Key Findings, Recommendations"

**Vague**: "Process the data"
**Specific**: "Extract customer names and email addresses from the CSV file, removing duplicates, and save to JSON format"

Specificity eliminates ambiguity and reduces iteration cycles.

## Sequential Steps
Provide instructions as sequential steps. Use numbered lists or bullet points.

```xml
<workflow>
1. Extract data from source file
2. Transform to target format
3. Validate transformation
4. Save to output file
5. Verify output correctness
</workflow>
```

Sequential steps create clear expectations and reduce the chance the model skips important operations.

## Example Comparison
## Unclear Example
```xml
<quick_start>
Please remove all personally identifiable information from these customer feedback messages: {{FEEDBACK_DATA}}
</quick_start>
```

**Problems**:
- What counts as PII?
- What should replace PII?
- What format should the output be?
- What if no PII is found?
- Should product names be redacted?

## Clear Example
```xml
<objective>
Anonymize customer feedback for quarterly review presentation.
</objective>

<quick_start>
<instructions>
1. Replace all customer names with "CUSTOMER_[ID]" (e.g., "Jane Doe" → "CUSTOMER_001")
2. Replace email addresses with "EMAIL_[ID]@example.com"
3. Redact phone numbers as "PHONE_[ID]"
4. If a message mentions a specific product (e.g., "AcmeCloud"), leave it intact
5. If no PII is found, copy the message verbatim
6. Output only the processed messages, separated by "---"
</instructions>

Data to process: {{FEEDBACK_DATA}}
</quick_start>

<success_criteria>
- All customer names replaced with IDs
- All emails and phones redacted
- Product names preserved
- Output format matches specification
</success_criteria>
```

**Why this is better**:
- States the purpose (quarterly review)
- Provides explicit step-by-step rules
- Defines output format clearly
- Specifies edge cases (product names, no PII found)
- Defines success criteria

## Key Differences
The clear version:
- States the purpose (quarterly review)
- Provides explicit step-by-step rules
- Defines output format
- Specifies edge cases (product names, no PII found)
- Includes success criteria

The unclear version leaves all these decisions to the model, increasing the chance of misalignment with expectations.

## Show Dont Just Tell
## Principle
When format matters, show an example rather than just describing it.

## Telling Example
```xml
<commit_messages>
Generate commit messages in conventional format with type, scope, and description.
</commit_messages>
```

## Showing Example
```xml
<commit_message_format>
Generate commit messages following these examples:

<example number="1">
<input>Added user authentication with JWT tokens</input>
<output>
```
feat(auth): implement JWT-based authentication

Add login endpoint and token validation middleware
```
</output>
</example>

<example number="2">
<input>Fixed bug where dates displayed incorrectly in reports</input>
<output>
```
fix(reports): correct date formatting in timezone conversion

Use UTC timestamps consistently across report generation
```
</output>
</example>

Follow this style: type(scope): brief description, then detailed explanation.
</commit_message_format>
```

## Why Showing Works
Examples communicate nuances that text descriptions can't:
- Exact formatting (spacing, capitalization, punctuation)
- Tone and style
- Level of detail
- Pattern across multiple cases

the model learns patterns from examples more reliably than from descriptions.

## Avoid Ambiguity
## Principle
Eliminate words and phrases that create ambiguity or leave decisions open.

## Ambiguous Phrases
❌ **"Try to..."** - Implies optional
✅ **"Always..."** or **"Never..."** - Clear requirement

❌ **"Should probably..."** - Unclear obligation
✅ **"Must..."** or **"May optionally..."** - Clear obligation level

❌ **"Generally..."** - When are exceptions allowed?
✅ **"Always... except when..."** - Clear rule with explicit exceptions

❌ **"Consider..."** - Should the model always do this or only sometimes?
✅ **"If X, then Y"** or **"Always..."** - Clear conditions

## Example
❌ **Ambiguous**:
```xml
<validation>
You should probably validate the output and try to fix any errors.
</validation>
```

✅ **Clear**:
```xml
<validation>
Always validate output before proceeding:

```bash
python scripts/validate.py output_dir/
```

If validation fails, fix errors and re-validate. Only proceed when validation passes with zero errors.
</validation>
```

## Define Edge Cases
## Principle
Anticipate edge cases and define how to handle them. Don't leave the model guessing.

## Without Edge Cases
```xml
<quick_start>
Extract email addresses from the text file and save to a JSON array.
</quick_start>
```

**Questions left unanswered**:
- What if no emails are found?
- What if the same email appears multiple times?
- What if emails are malformed?
- What JSON format exactly?

## With Edge Cases
```xml
<quick_start>
Extract email addresses from the text file and save to a JSON array.

<edge_cases>
- **No emails found**: Save empty array `[]`
- **Duplicate emails**: Keep only unique emails
- **Malformed emails**: Skip invalid formats, log to stderr
- **Output format**: Array of strings, one email per element
</edge_cases>

<example_output>
```json
[
  "user1@example.com",
  "user2@example.com"
]
```
</example_output>
</quick_start>
```

## Output Format Specification
## Principle
When output format matters, specify it precisely. Show examples.

## Vague Format
```xml
<output>
Generate a report with the analysis results.
</output>
```

## Specific Format
```xml
<output_format>
Generate a markdown report with this exact structure:

```markdown
# Analysis Report: [Title]

## Executive Summary
[1-2 paragraphs summarizing key findings]

## Key Findings
- Finding 1 with supporting data
- Finding 2 with supporting data
- Finding 3 with supporting data

## Recommendations
1. Specific actionable recommendation
2. Specific actionable recommendation

## Appendix
[Raw data and detailed calculations]
```

**Requirements**:
- Use exactly these section headings
- Executive summary must be 1-2 paragraphs
- List 3-5 key findings
- Provide 2-4 recommendations
- Include appendix with source data
</output_format>
```

## Decision Criteria
## Principle
When the model must make decisions, provide clear criteria.

## No Criteria
```xml
<workflow>
Analyze the data and decide which visualization to use.
</workflow>
```

**Problem**: What factors should guide this decision?

## With Criteria
```xml
<workflow>
Analyze the data and select appropriate visualization:

<decision_criteria>
**Use bar chart when**:
- Comparing quantities across categories
- Fewer than 10 categories
- Exact values matter

**Use line chart when**:
- Showing trends over time
- Continuous data
- Pattern recognition matters more than exact values

**Use scatter plot when**:
- Showing relationship between two variables
- Looking for correlations
- Individual data points matter
</decision_criteria>
</workflow>
```

**Benefits**: the model has objective criteria for making the decision rather than guessing.

## Constraints And Requirements
## Principle
Clearly separate "must do" from "nice to have" from "must not do".

## Unclear Requirements
```xml
<requirements>
The report should include financial data, customer metrics, and market analysis. It would be good to have visualizations. Don't make it too long.
</requirements>
```

**Problems**:
- Are all three content types required?
- Are visualizations optional or required?
- How long is "too long"?

## Clear Requirements
```xml
<requirements>
<must_have>
- Financial data (revenue, costs, profit margins)
- Customer metrics (acquisition, retention, lifetime value)
- Market analysis (competition, trends, opportunities)
- Maximum 5 pages
</must_have>

<nice_to_have>
- Charts and visualizations
- Industry benchmarks
- Future projections
</nice_to_have>

<must_not>
- Include confidential customer names
- Exceed 5 pages
- Use technical jargon without definitions
</must_not>
</requirements>
```

**Benefits**: Clear priorities and constraints prevent misalignment.

## Success Criteria
## Principle
Define what success looks like. How will the model know it succeeded?

## Without Success Criteria
```xml
<objective>
Process the CSV file and generate a report.
</objective>
```

**Problem**: When is this task complete? What defines success?

## With Success Criteria
```xml
<objective>
Process the CSV file and generate a summary report.
</objective>

<success_criteria>
- All rows in CSV successfully parsed
- No data validation errors
- Report generated with all required sections
- Report saved to output/report.md
- Output file is valid markdown
- Process completes without errors
</success_criteria>
```

**Benefits**: Clear completion criteria eliminate ambiguity about when the task is done.

## Testing Clarity
## Principle
Test your instructions by asking: "Could I hand these instructions to a junior developer and expect correct results?"

## Testing Process
1. Read your skill instructions
2. Remove context only you have (project knowledge, unstated assumptions)
3. Identify ambiguous terms or vague requirements
4. Add specificity where needed
5. Test with someone who doesn't have your context
6. Iterate based on their questions and confusion

If a human with minimal context struggles, the model will too.

## Practical Examples
<example domain="data_processing">
❌ **Unclear**:
```xml
<quick_start>
Clean the data and remove bad entries.
</quick_start>
```

✅ **Clear**:
```xml
<quick_start>
<data_cleaning>
1. Remove rows where required fields (name, email, date) are empty
2. Standardize date format to YYYY-MM-DD
3. Remove duplicate entries based on email address
4. Validate email format (must contain @ and domain)
5. Save cleaned data to output/cleaned_data.csv
</data_cleaning>

<success_criteria>
- No empty required fields
- All dates in YYYY-MM-DD format
- No duplicate emails
- All emails valid format
- Output file created successfully
</success_criteria>
</quick_start>
```

<example domain="code_generation">
❌ **Unclear**:
```xml
<quick_start>
Write a function to process user input.
</quick_start>
```

✅ **Clear**:
```xml
<quick_start>
<function_specification>
Write a Python function with this signature:

```python
def process_user_input(raw_input: str) -> dict:
    """
    Validate and parse user input.

    Args:
        raw_input: Raw string from user (format: "name:email:age")

    Returns:
        dict with keys: name (str), email (str), age (int)

    Raises:
        ValueError: If input format is invalid
    """
```

**Requirements**:
- Split input on colon delimiter
- Validate email contains @ and domain
- Convert age to integer, raise ValueError if not numeric
- Return dictionary with specified keys
- Include docstring and type hints
</function_specification>

<success_criteria>
- Function signature matches specification
- All validation checks implemented
- Proper error handling for invalid input
- Type hints included
- Docstring included
</success_criteria>
</quick_start>
```
