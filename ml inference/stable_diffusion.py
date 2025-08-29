# stable_diffusion.py
import torch
import os
from PIL import Image, ImageDraw, ImageFont
import logging
from typing import Tuple, Dict
from load_model import load_stablediffusion
from config import IMAGE_GENERATION_PARAMS, FONT_CONFIG
import torch.multiprocessing as mp
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Thread lock for model access
model_lock = threading.Lock()

def wrap_text(text: str, max_width: int, draw: ImageDraw.Draw, font: ImageFont.FreeTypeFont) -> str:
    """Wrap text to fit within specified width"""
    words = text.split()
    wrapped_lines = []
    current_line = []

    for word in words:
        current_line.append(word)
        line_width = draw.textlength(" ".join(current_line), font=font)
        
        if line_width > max_width:
            if len(current_line) == 1:
                wrapped_lines.append(current_line[0])
                current_line = []
            else:
                current_line.pop()
                wrapped_lines.append(" ".join(current_line))
                current_line = [word]

    if current_line:
        wrapped_lines.append(" ".join(current_line))
    
    return "\n".join(wrapped_lines)

def add_text_box(img: Image.Image,
                text: str,
                position: Tuple[int, int, int, int],
                font: ImageFont.FreeTypeFont) -> Image.Image:
    """Add text box with background to image"""
    draw = ImageDraw.Draw(img)
    
    # Draw background box
    draw.rectangle(position, fill=(255, 255, 255, 90))
    
    # Calculate text position
    box_width = position[2] - position[0] - 40
    wrapped_text = wrap_text(text, box_width, draw, font)
    
    # Center text in box
    text_bbox = draw.textbbox((0, 0), wrapped_text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    
    box_center_x = (position[2] + position[0]) // 2
    box_center_y = (position[3] + position[1]) // 2
    text_x = box_center_x - text_width // 2
    text_y = box_center_y - text_height // 2
    
    # Draw text
    draw.text((text_x, text_y), wrapped_text, font=font, fill=(0, 0, 0, 255))
    
    return img

def generate_image(prompt: str,
                  pipe,
                  seed: int = 42,
                  params: dict = IMAGE_GENERATION_PARAMS) -> Image.Image:
    """Generate a single image using SDXL Turbo"""
    try:
        # Use a lock to ensure only one thread accesses the model at a time
        with model_lock:
            generator = torch.manual_seed(seed)
            positive_magic = {
            "en": "Ultra HD, 4K, cinematic composition." # for english prompt,
    
}
            negative_prompt = " "  # using an empty string if you do not have specific concept to remove
            
            
            # Generate image with SDXL Turbo
            logger.info(f"Generating image for prompt: {prompt[:50]}...")
            image = pipe(
            prompt=prompt + positive_magic["en"],
            negative_prompt=negative_prompt,
            width=512,
            height=512,
            num_inference_steps=15,
            true_cfg_scale=7,
            generator=torch.Generator(device="cuda").manual_seed(42)
        ).images[0]
            
            return image
        
    except Exception as e:
        logger.error(f"Image generation error: {str(e)}")
        raise Exception(f"Image generation error: {str(e)}")

def process_scene(scene_data, model, output_dir):
    """Process a single scene - for thread pool"""
    scene_num, prompt = scene_data
    try:
        # Generate the image using the shared model instance
        image = generate_image(prompt, model)
        
        # Save the image
        output_path = os.path.join(output_dir, f"scene_{scene_num}.png")
        image.save(output_path)
        logger.info(f"Saved scene {scene_num} to {output_path}")
        return scene_num, True
    except Exception as e:
        logger.error(f"Error processing scene {scene_num}: {str(e)}")
        return scene_num, False

def generate_stablediffusion(story_post_process: Dict, output_dir, model=None) -> None:
    """Generate images for all scenes in the story concurrently using SDXL Turbo"""
    try:
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
        
        # Check for CUDA availability
        if not torch.cuda.is_available():
            raise RuntimeError("CUDA is not available. Cannot generate images.")
        
        # Load model if not provided
        if model is None:
            logger.info("Loading SDXL Turbo model...")
            model = load_stablediffusion()
            logger.info("Model loaded successfully")
        positive_magic = {
        "en": "Ultra HD, comic cartoon composition."}
        # Move model to GPU
        #model.to("cuda")  # Use balanced device map for multi-GPU setups
        
        # Prepare prompts and scene numbers
        tasks = []
        for idx, (scene_num, scene_content) in enumerate(story_post_process.items()):
            
            if idx >= 4:
                break
            image_prompt = scene_content['image_prompt']
            dialogue = scene_content.get('dialogue', '')
            prompt = f'{image_prompt} Render the following dialogue in a speech bubble: "{dialogue}". Maintain environment setup and character consistency.'
            tasks.append((scene_num, prompt))
        
        # Process scenes concurrently using a thread pool and the same model instance
        logger.info(f"Starting concurrent image generation for {len(tasks)} scenes using SDXL Turbo")
        
        # Use ThreadPoolExecutor to submit tasks
        with ThreadPoolExecutor(max_workers=4) as executor:
            # Submit all tasks to the thread pool
            futures = []
            for scene_num, prompt in tasks:
                futures.append(
                    executor.submit(
                        process_scene, 
                        (scene_num, prompt), 
                        model, 
                        output_dir
                    )
                )
            
            # Process results as they complete
            for future in as_completed(futures):
                scene_num, success = future.result()
                if success:
                    logger.info(f"Successfully processed scene {scene_num}")
                else:
                    logger.warning(f"Failed to process scene {scene_num}")
        
        logger.info("All image generation completed")
                
    except Exception as e:
        logger.error(f"Error in batch image generation: {str(e)}")
        raise

def add_text_on_genImages(story_post_process, input_dir: str, output_dir: str) -> None:
    """Add text overlays to the generated images"""
    try:
        os.makedirs(output_dir, exist_ok=True)
        
        # Load fonts
        base_font_size = FONT_CONFIG["base_size"]
        font_path = FONT_CONFIG["path"]
        narration_font = ImageFont.truetype(font_path, base_font_size )
        dialogue_font = ImageFont.truetype(font_path, base_font_size)
        
        # Process each scene
        for scene_num, scene_content in story_post_process.items():
            logger.info(f"Adding text to scene {scene_num}")
            
            # Load image
            image_path = os.path.join(input_dir, f"scene_{scene_num}.png")
            if not os.path.exists(image_path):
                logger.warning(f"Image not found: {image_path}")
                continue
                
            image = Image.open(image_path).convert("RGBA")
            img_width, img_height = image.size
            
            # Add narration at top
            #image = add_text_box(
            #    image,
            #    scene_content['narration'],
            ##    (0, 0, img_width, 70),
             #   narration_font
           # )
            
            # Add dialogue at bottom
            image = add_text_box(
                image,
                scene_content['narration'],
                (0, img_height - 70, img_width, img_height),
                dialogue_font
            )
            
            # Save final image
            output_path = os.path.join(output_dir, f"scene_{scene_num}_with_text.png")
            image.convert("RGB").save(output_path)
            logger.info(f"Saved scene {scene_num} with text to {output_path}")
            
    except Exception as e:
        logger.error(f"Error in text overlay process: {str(e)}")
        raise Exception(f"Text overlay error: {str(e)}")