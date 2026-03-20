---
name: gemini-imagegen
description: >-
  This skill should be used when generating and editing images using the Gemini API (Nano Banana Pro). It applies when
  creating images from text prompts, editing existing images, applying style transfers, generating logos with text,
  creating stickers, product mockups, or any image generation/manipulation task. Supports text-to-image, image editing,
  multi-turn refinement, and composition from multiple reference images.
---

## Goal
Generate and edit images with the Gemini API using the correct model, settings, and file handling.

## Use this skill when
- Generating images from text prompts.
- Editing or refining existing images.
- Applying style transfer, creating logos with text, building stickers, or producing product mockups.
- Running multi-turn image refinement or combining reference images.

## Do not use this skill when
- You are about to use a model other than `gemini-3-pro-image-preview` without an explicit request.
- You are about to save Gemini's default JPEG output with a `.png` extension.
- `GEMINI_API_KEY` is not available.

## Operating rules
- Require `GEMINI_API_KEY` in the environment.
- Default to `gemini-3-pro-image-preview`.
- Default to 1K resolution and `1:1` aspect ratio unless the task needs something else.
- Save default Gemini output as `.jpg`.
- Use conversational refinement for iterative edits.
- Use multiple reference images when composition requires them.

## Procedure / Reference
### Defaults
- Model: `gemini-3-pro-image-preview`
- Resolution: `1K` by default; available values are `1K`, `2K`, `4K`
- Aspect ratio: `1:1` by default
- Supported aspect ratios: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`

### Basic generation
```python
import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

response = client.models.generate_content(
    model="gemini-3-pro-image-preview",
    contents=["Your prompt here"],
    config=types.GenerateContentConfig(
        response_modalities=['TEXT', 'IMAGE'],
    ),
)
```

### Custom resolution and aspect ratio
```python
config=types.GenerateContentConfig(
    response_modalities=['TEXT', 'IMAGE'],
    image_config=types.ImageConfig(
        aspect_ratio="16:9",
        image_size="2K"
    ),
)
```

### Editing an existing image
```python
from PIL import Image

img = Image.open("input.png")
response = client.models.generate_content(
    model="gemini-3-pro-image-preview",
    contents=["Add a sunset to this scene", img],
)
```

### Multi-turn refinement
```python
chat = client.chats.create(
    model="gemini-3-pro-image-preview",
    config=types.GenerateContentConfig(response_modalities=['TEXT', 'IMAGE'])
)

response = chat.send_message("Create a logo for 'Acme Corp'")
response = chat.send_message("Make the text bolder and add a blue gradient")
```

### Save the result correctly
```python
image.save("output.jpg")
```

Do not do this unless you explicitly convert formats:
```python
image.save("output.png")
```

### Convert to PNG if required
```python
from PIL import Image

for part in response.parts:
    if part.inline_data:
        img = part.as_image()
        img.save("output.png", format="PNG")
```

### Verify the real file format
```bash
file image.png
```

If `file` reports `JPEG image data`, rename it to `.jpg` or resave it properly.

### Prompting guidance
- Photorealistic scenes: include lens, lighting, angle, and mood.
- Stylized art: name the visual style explicitly.
- Text in images: specify font style and placement.
- Product mockups: describe the lighting setup and surface.

### Advanced features
Google Search grounding:
```python
response = client.models.generate_content(
    model="gemini-3-pro-image-preview",
    contents=["Visualize today's weather in Tokyo as an infographic"],
    config=types.GenerateContentConfig(
        response_modalities=['TEXT', 'IMAGE'],
        tools=[{"google_search": {}}]
    )
)
```

Multiple reference images, up to 14:
```python
response = client.models.generate_content(
    model="gemini-3-pro-image-preview",
    contents=[
        "Create a group photo of these people in an office",
        Image.open("person1.png"),
        Image.open("person2.png"),
        Image.open("person3.png"),
    ],
    config=types.GenerateContentConfig(
        response_modalities=['TEXT', 'IMAGE'],
    ),
)
```
