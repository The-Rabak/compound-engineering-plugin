# Iteration And Testing

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

## Overview
Skills improve through iteration and testing. This reference covers evaluation-driven development, the model A/B testing patterns, and XML structure validation during testing.

## Evaluation Driven Development
## Principle
Create evaluations BEFORE writing extensive documentation. This ensures your skill solves real problems rather than documenting imagined ones.

## Workflow
## Step 1
**Identify gaps**: Run the model on representative tasks without a skill. Document specific failures or missing context.

## Step 2
**Create evaluations**: Build three scenarios that test these gaps.

## Step 3
**Establish baseline**: Measure the model's performance without the skill.

## Step 4
**Write minimal instructions**: Create just enough content to address the gaps and pass evaluations.

## Step 5
**Iterate**: Execute evaluations, compare against baseline, and refine.

## Evaluation Structure
```json
{
  "skills": ["pdf-processing"],
  "query": "Extract all text from this PDF file and save it to output.txt",
  "files": ["test-files/document.pdf"],
  "expected_behavior": [
    "Successfully reads the PDF file using appropriate library",
    "Extracts text content from all pages without missing any",
    "Saves extracted text to output.txt in clear, readable format"
  ]
}
```

## Why Evaluations First
- Prevents documenting imagined problems
- Forces clarity about what success looks like
- Provides objective measurement of skill effectiveness
- Keeps skill focused on actual needs
- Enables quantitative improvement tracking

## Iterative Development With the model
## Principle
The most effective skill development uses the model itself. Work with "the model A" (expert who helps refine) to create skills used by "the model B" (agent executing tasks).

## Creating Skills
## Workflow
## Step 1
**Complete task without skill**: Work through problem with the model A, noting what context you repeatedly provide.

## Step 2
**Ask the model A to create skill**: "Create a skill that captures this pattern we just used"

## Step 3
**Review for conciseness**: Remove unnecessary explanations.

## Step 4
**Improve architecture**: Organize content with progressive disclosure.

## Step 5
**Test with the model B**: Use fresh instance to test on real tasks.

## Step 6
**Iterate based on observation**: Return to the model A with specific issues observed.

## Insight
the model models understand skill format natively. Simply ask the model to create a skill and it will generate properly structured SKILL.md content.

## Improving Skills
## Workflow
## Step 1
**Use skill in real workflows**: Give the model B actual tasks.

## Step 2
**Observe behavior**: Where does it struggle, succeed, or make unexpected choices?

## Step 3
**Return to the model A**: Share observations and current SKILL.md.

## Step 4
**Review suggestions**: the model A might suggest reorganization, stronger language, or workflow restructuring.

## Step 5
**Apply and test**: Update skill and test again.

## Step 6
**Repeat**: Continue based on real usage, not assumptions.

## What To Watch For
- **Unexpected exploration paths**: Structure might not be intuitive
- **Missed connections**: Links might need to be more explicit
- **Overreliance on sections**: Consider moving frequently-read content to main SKILL.md
- **Ignored content**: Poorly signaled or unnecessary files
- **Critical metadata**: The name and description in your skill's metadata are critical for discovery

## Model Testing
## Principle
Test with all models you plan to use. Different models have different strengths and need different levels of detail.

## Haiku Testing
**the model Haiku** (fast, economical)

Questions to ask:
- Does the skill provide enough guidance?
- Are examples clear and complete?
- Do implicit assumptions become explicit?
- Does Haiku need more structure?

Haiku benefits from:
- More explicit instructions
- Complete examples (no partial code)
- Clear success criteria
- Step-by-step workflows

## Sonnet Testing
**the model Sonnet** (balanced)

Questions to ask:
- Is the skill clear and efficient?
- Does it avoid over-explanation?
- Are workflows well-structured?
- Does progressive disclosure work?

Sonnet benefits from:
- Balanced detail level
- XML structure for clarity
- Progressive disclosure
- Concise but complete guidance

## Opus Testing
**the model Opus** (powerful reasoning)

Questions to ask:
- Does the skill avoid over-explaining?
- Can Opus infer obvious steps?
- Are constraints clear?
- Is context minimal but sufficient?

Opus benefits from:
- Concise instructions
- Principles over procedures
- High degrees of freedom
- Trust in reasoning capabilities

## Balancing Across Models
What works for Opus might need more detail for Haiku. Aim for instructions that work well across all target models. Find the balance that serves your target audience.

See [core-principles.md](core-principles.md) for model testing examples.

## Xml Structure Validation
## Principle
During testing, validate that your skill's XML structure is correct and complete.

## Validation Checklist
After updating a skill, verify:

## Required Tags Present
- ✅ `<objective>` tag exists and defines what skill does
- ✅ `<quick_start>` tag exists with immediate guidance
- ✅ `<success_criteria>` or `<when_successful>` tag exists

## No Markdown Headings
- ✅ No `#`, `##`, or `###` headings in skill body
- ✅ All sections use XML tags instead
- ✅ Markdown formatting within tags is preserved (bold, italic, lists, code blocks)

## Proper Xml Nesting
- ✅ All XML tags properly closed
- ✅ Nested tags have correct hierarchy
- ✅ No unclosed tags

## Conditional Tags Appropriate
- ✅ Conditional tags match skill complexity
- ✅ Simple skills use required tags only
- ✅ Complex skills add appropriate conditional tags
- ✅ No over-engineering or under-specifying

## Reference Files Check
- ✅ Reference files also use pure XML structure
- ✅ Links to reference files are correct
- ✅ References are one level deep from SKILL.md

## Testing Xml During Iteration
When iterating on a skill:

1. Make changes to XML structure
2. **Validate XML structure** (check tags, nesting, completeness)
3. Test with the model on representative tasks
4. Observe if XML structure aids or hinders the model's understanding
5. Iterate structure based on actual performance

## Observation Based Iteration
## Principle
Iterate based on what you observe, not what you assume. Real usage reveals issues assumptions miss.

## Observation Categories
## What the model Reads
Which sections does the model actually read? Which are ignored? This reveals:
- Relevance of content
- Effectiveness of progressive disclosure
- Whether section names are clear

## Where the model Struggles
Which tasks cause confusion or errors? This reveals:
- Missing context
- Unclear instructions
- Insufficient examples
- Ambiguous requirements

## Where the model Succeeds
Which tasks go smoothly? This reveals:
- Effective patterns
- Good examples
- Clear instructions
- Appropriate detail level

## Unexpected Behaviors
What does the model do that surprises you? This reveals:
- Unstated assumptions
- Ambiguous phrasing
- Missing constraints
- Alternative interpretations

## Iteration Pattern
1. **Observe**: Run the model on real tasks with current skill
2. **Document**: Note specific issues, not general feelings
3. **Hypothesize**: Why did this issue occur?
4. **Fix**: Make targeted changes to address specific issues
5. **Test**: Verify fix works on same scenario
6. **Validate**: Ensure fix doesn't break other scenarios
7. **Repeat**: Continue with next observed issue

## Progressive Refinement
## Principle
Skills don't need to be perfect initially. Start minimal, observe usage, add what's missing.

## Initial Version
Start with:
- Valid YAML frontmatter
- Required XML tags: objective, quick_start, success_criteria
- Minimal working example
- Basic success criteria

Skip initially:
- Extensive examples
- Edge case documentation
- Advanced features
- Detailed reference files

## Iteration Additions
Add through iteration:
- Examples when patterns aren't clear from description
- Edge cases when observed in real usage
- Advanced features when users need them
- Reference files when SKILL.md approaches 500 lines
- Validation scripts when errors are common

## Benefits
- Faster to initial working version
- Additions solve real needs, not imagined ones
- Keeps skills focused and concise
- Progressive disclosure emerges naturally
- Documentation stays aligned with actual usage

## Testing Discovery
## Principle
Test that the model can discover and use your skill when appropriate.

## Discovery Testing
## Test Description
Test if the model loads your skill when it should:

1. Start fresh conversation (the model B)
2. Ask question that should trigger skill
3. Check if skill was loaded
4. Verify skill was used appropriately

## Description Quality
If skill isn't discovered:
- Check description includes trigger keywords
- Verify description is specific, not vague
- Ensure description explains when to use skill
- Test with different phrasings of the same request

The description is the model's primary discovery mechanism.

## Common Iteration Patterns
<pattern name="too_verbose">
**Observation**: Skill works but uses lots of tokens

**Fix**:
- Remove obvious explanations
- Assume the model knows common concepts
- Use examples instead of lengthy descriptions
- Move advanced content to reference files

<pattern name="too_minimal">
**Observation**: the model makes incorrect assumptions or misses steps

**Fix**:
- Add explicit instructions where assumptions fail
- Provide complete working examples
- Define edge cases
- Add validation steps

<pattern name="poor_discovery">
**Observation**: Skill exists but the model doesn't load it when needed

**Fix**:
- Improve description with specific triggers
- Add relevant keywords
- Test description against actual user queries
- Make description more specific about use cases

<pattern name="unclear_structure">
**Observation**: the model reads wrong sections or misses relevant content

**Fix**:
- Use clearer XML tag names
- Reorganize content hierarchy
- Move frequently-needed content earlier
- Add explicit links to relevant sections

<pattern name="incomplete_examples">
**Observation**: the model produces outputs that don't match expected pattern

**Fix**:
- Add more examples showing pattern
- Make examples more complete
- Show edge cases in examples
- Add anti-pattern examples (what not to do)

## Iteration Velocity
## Principle
Small, frequent iterations beat large, infrequent rewrites.

## Fast Iteration
**Good approach**:
1. Make one targeted change
2. Test on specific scenario
3. Verify improvement
4. Commit change
5. Move to next issue

Total time: Minutes per iteration
Iterations per day: 10-20
Learning rate: High

## Slow Iteration
**Problematic approach**:
1. Accumulate many issues
2. Make large refactor
3. Test everything at once
4. Debug multiple issues simultaneously
5. Hard to know what fixed what

Total time: Hours per iteration
Iterations per day: 1-2
Learning rate: Low

## Benefits Of Fast Iteration
- Isolate cause and effect
- Build pattern recognition faster
- Less wasted work from wrong directions
- Easier to revert if needed
- Maintains momentum

## Success Metrics
## Principle
Define how you'll measure if the skill is working. Quantify success.

## Objective Metrics
- **Success rate**: Percentage of tasks completed correctly
- **Token usage**: Average tokens consumed per task
- **Iteration count**: How many tries to get correct output
- **Error rate**: Percentage of tasks with errors
- **Discovery rate**: How often skill loads when it should

## Subjective Metrics
- **Output quality**: Does output meet requirements?
- **Appropriate detail**: Too verbose or too minimal?
- **the model confidence**: Does the model seem uncertain?
- **User satisfaction**: Does skill solve the actual problem?

## Tracking Improvement
Compare metrics before and after changes:
- Baseline: Measure without skill
- Initial: Measure with first version
- Iteration N: Measure after each change

Track which changes improve which metrics. Double down on effective patterns.
