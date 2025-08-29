import re
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def story_post_process(response):
    """
    Process the story response into a structured format
    
    Args:
        response (list): Raw story response from the model
        
    Returns:
        dict: Processed story with scene information
    """
    try:
        # Combine all elements of the list into a single string
        input_text = ''.join(response)
        
        # Validate input
        if not input_text.strip():
            raise ValueError("Empty response received from story generation")
        
        # Regular expression pattern for scene extraction
        scene_pattern = r'"scene": (\d+),\s*"narration": "(.*?)",\s*"image_prompt": "(.*?)",\s*"dialogue": "(.*?)"'
        
        # Find all matches
        matches = re.findall(scene_pattern, input_text, re.DOTALL)
        
        # Create story map
        story_map = {}
        for match in matches:
            scene_num = int(match[0])
            scene_data = {
                "narration": match[1].strip(),
                "image_prompt": match[2].strip(),
                "dialogue": match[3].strip()
            }
            
            # Validate scene data
            if not all(scene_data.values()):
                logger.warning(f"Scene {scene_num} has empty fields: {scene_data}")
                continue
                
            story_map[scene_num] = scene_data
        
        # Validate final story map
        if not story_map:
            raise ValueError("No valid scenes could be processed")
        
        logger.info(f"Successfully processed {len(story_map)} scenes")
        return story_map
        
    except Exception as e:
        logger.error(f"Error in story post-processing: {str(e)}")
        raise