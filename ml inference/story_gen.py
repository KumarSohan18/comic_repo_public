# story_gen.py
from vllm import SamplingParams
from load_model import load_story

import logging
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_story(data_point: dict, llm=None, sampling_params=None) -> list:
    """
    Generate a story using the provided LLM model and parameters.
    
    Args:
        data_point (dict): Input parameters for story generation
        llm: Pre-loaded LLM model
        sampling_params: Pre-configured sampling parameters
    
    Returns:
        list: Generated story segments
    
    Raises:
        ValueError: If required parameters are missing
        Exception: For any generation errors
    """
    try:
        if llm is None:
            logger.info("No model provided, loading new instance...")
            llm = load_story()

        if sampling_params is None:
            sampling_params = SamplingParams(
                temperature=0.2,  # Lower temperature for more structured output
                top_p=0.95,  # Keep diversity while ensuring structure
                max_tokens=750,
                frequency_penalty = 0.1,
                presence_penalty = 0.1,
                  # Increased to ensure full output
               # frequency_penalty=0.1,
               # presence_penalty=0.1,

            )

        prompt = f"""
You are an advanced text generator. Write a **10-scene JSON story** in **{data_point['Style']}** about {data_point['User']} in {data_point['Genre']} style.  
Avoid elements like {data_point['DontWantToInclude']}.

The story should be educational,  {data_point['User']} through an engaging narrative.
Include character dialogue in EVERY scene - this is very important!

### **Rules & Format**:  
- Each scene must be a **dictionary** with four keys: `"scene"`, `"narration"`, `"image_prompt"`, and `"dialogue"`.
- The `"scene"` key should contain the scene number (1-10)
- The `"narration"` key should contain descriptive text about what's happening
- The `"image_prompt"` should be **a detailed visual description** for illustration
- The `"dialogue"` key MUST include **character dialogue **
- **Output must be in a valid JSON array** with no extra text before or after
- Make the story both entertaining AND educational, explaining {data_point['User']} in technical terms mixing with entertaiment kids can understand

Every scene in your JSON array must have this EXACT structure:
{{
  "scene": (number),
  "narration": "(descriptive text about what's happening)",
  "image_prompt": "(detailed visual description for illustration)",
  "dialogue": "(character dialogue with speaker name, like 'Mito: \"Hello!\"')"
}}
DONT PRINT RESPONSE
BEGIN JSON ARRAY:
"""

        logger.info("Generating story...")
        outputs = llm.generate([prompt], sampling_params)
        raw_text = outputs[0].outputs[0].text.strip()
        logger.info(f"Raw response length: {len(raw_text)}")
        logger.info("Raw response: " + raw_text[:500] + "...") # First 500 chars

        # Try to parse as JSON
        try:
            # Look for the start of the JSON array
            if "[" in raw_text:
                json_start = raw_text.find("[")
                json_text = raw_text[json_start:]
                parsed_response = json.loads(json_text)
                logger.info(f"Successfully parsed JSON with {len(parsed_response)} scenes")
                return parsed_response
            else:
                logger.warning("No JSON array found in response")
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON: {e}")
        
        # Fallback to your original method if JSON parsing fails
        response = raw_text.split("\n\n")
        logger.warning(f"Falling back to newline splitting, got {len(response)} segments")
        print("printing the response")
        print(response)
        return response

    except Exception as e:
        logger.error(f"Error generating story: {str(e)}")
        raise Exception(f"Failed to load LLM model: {e}")