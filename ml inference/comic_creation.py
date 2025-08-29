# comic_creation.py
import os
from PIL import Image, ImageOps
import logging


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_comic_pages(image_folder, output_folder, 
                      image_size=(768, 768), grid_rows=5, grid_cols=2, 
                      padding=10):
    """Create comic pages from generated images"""
    try:
        # Compute page size
        page_size = (
            grid_cols * image_size[0] + (grid_cols + 1) * padding,
            grid_rows * image_size[1] + (grid_rows + 1) * padding
        )
        
        # Load images
        logger.info(f"Loading images from {image_folder}")
        image_paths = [
            os.path.join(image_folder, f) 
            for f in sorted(os.listdir(image_folder)) 
            if f.endswith(('.png', '.jpg', '.jpeg'))
        ]
        
        if not image_paths:
            raise ValueError(f"No valid images found in {image_folder}")
        
        images = []
        for img_path in image_paths:
            try:
                img = Image.open(img_path)
                images.append(img)
            except Exception as e:
                logger.error(f"Error loading image {img_path}: {str(e)}")
                continue
        
        # Create output folder
        os.makedirs(output_folder, exist_ok=True)
        
        # Create pages
        pages = []
        for i in range(0, len(images), grid_rows * grid_cols):
            logger.info(f"Creating page {len(pages) + 1}")
            page = Image.new("RGB", page_size, (255, 255, 255))
            
            for j in range(grid_rows * grid_cols):
                if i + j < len(images):
                    row = j // grid_cols
                    col = j % grid_cols
                    
                    x = padding + col * (image_size[0] + padding)
                    y = padding + row * (image_size[1] + padding)
                    
                    try:
                        resized_img = images[i + j].resize(image_size)
                        bordered_img = ImageOps.expand(resized_img, border=1, fill='black')
                        page.paste(bordered_img, (x, y))
                    except Exception as e:
                        logger.error(f"Error processing image {i + j}: {str(e)}")
                        continue
            
            pages.append(page)
        
        # Save pages
        
        # Save only the first page
        if pages:
            output_path = os.path.join(output_folder, f"{os.path.basename(output_folder)}.png")
            try:
                pages[0].save(output_path)
                logger.info(f"Saved page 1 to {output_path}")
            except Exception as e:
                logger.error(f"Error saving page 1: {str(e)}")
                
    except Exception as e:
        logger.error(f"Error in comic page creation: {str(e)}")
        raise