from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional
import os
from contextlib import asynccontextmanager
import torch
from vllm import SamplingParams
from uuid import uuid4
import io
import json

from load_model import load_story, load_stablediffusion
from s3_image_upload import upload_to_s3
from story_gen import generate_story
from stable_diffusion import generate_stablediffusion, add_text_on_genImages
from comic_creation import create_comic_pages
from story_postprocess import story_post_process
from config import OUTPUT_DIR_BASE
from mcq import generate_mcqs_from_story
# uvicorn main:app --host 0.0.0.0 --port 5000 --workers 2 --log-level info

# Pydantic models for request validation
from typing import List

class ComicRequest(BaseModel):
    user_theme: str 
    genre: str 
    style: str
    dont_include: str 
    uuid: Optional[str] = None

class ComicResponse(BaseModel):
    status: bool
    message: str
    uuid: str
    image_url: str
    mcqs: List[str]

# Global state management - define it at module level
class ModelState:
    def __init__(self):
        self.llm = None
        self.sd_model = None  # Changed from base/refiner to single sd_model
        self.is_initialized = False

# Create the global state instance at module level
global_model_state = ModelState()

# Application lifespan management
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        # Use the global model state
        print("Loading models...")
        global_model_state.llm = load_story()
        global_model_state.sd_model = load_stablediffusion()  # Load single SDXL Turbo model
        global_model_state.is_initialized = True
        print("Models loaded successfully!")
        yield
    finally:
        print("Cleaning up resources...")
        try:
            if global_model_state.llm:
                del global_model_state.llm
            if global_model_state.sd_model:
                del global_model_state.sd_model
            torch.cuda.empty_cache()
            print("Cleanup complete")
        except Exception as e:
            print(f"Error during cleanup: {str(e)}")

# Initialize FastAPI application
app = FastAPI(
    title="Comic Generator API",
    description="API for generating comics using AI models",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_status": "initialized" if global_model_state.is_initialized else "not initialized"
    }

@app.post("/generate-comic", response_model=ComicResponse)
async def generate_comic(request: ComicRequest):
    """Generate a comic based on the provided parameters"""
    
    if not global_model_state.is_initialized:
        raise HTTPException(status_code=503, detail="Models are not initialized")
    
    try:
        # Use provided UUID or generate a new one
        user_uuid = request.uuid or str(uuid4())
        
        # Create user-specific directories
        user_output_dir = os.path.join(OUTPUT_DIR_BASE, user_uuid)
        user_generated_images_dir = os.path.join(user_output_dir, 'generated_images')
        user_comic_pages_dir = os.path.join(user_output_dir, 'comic_pages')
        user_comic_pages_final_dir = os.path.join(user_output_dir, user_uuid)
        
        os.makedirs(user_generated_images_dir, exist_ok=True)
        os.makedirs(user_comic_pages_dir, exist_ok=True)
        os.makedirs(user_comic_pages_final_dir, exist_ok=True)
        
        # Prepare sampling parameters
        sampling_params = SamplingParams(
            temperature=0.9,
            top_p=0.7,
            top_k=5,
            max_tokens=1000
        )
        
        # 1. Generate story
        data_point = {
            "User": request.user_theme,
            "Genre": request.genre,
            "Style": request.style,
            "DontWantToInclude": request.dont_include
        }
        
        story = generate_story(
            data_point=data_point,
            llm=global_model_state.llm,
            sampling_params=sampling_params
        )
        
        # 2. Post-process story
        processed_story = story_post_process(story)
        mcqs = generate_mcqs_from_story(
            story_text=json.dumps(processed_story),
            llm=global_model_state.llm
        )
        # Ensure mcqs is a list of strings
        if not isinstance(mcqs, list):
            mcqs = [str(mcqs)]
        else:
            mcqs = [str(m) for m in mcqs]
        
        # 3. Generate images using SDXL Turbo
        generate_stablediffusion(
            story_post_process=processed_story,
            model=global_model_state.sd_model,  # Pass single model instead of base/refiner
            output_dir=user_generated_images_dir
        )
        
        # 4. Add text overlays
        add_text_on_genImages(
            story_post_process=processed_story,
            input_dir=user_generated_images_dir,
            output_dir=user_comic_pages_dir
        )
        
        # 5. Create final comic pages
        create_comic_pages(
            image_folder=user_comic_pages_dir,
            output_folder=user_comic_pages_final_dir
        )

        # Read the file content into memory
        comic_file_path = os.path.join(user_comic_pages_final_dir,  f"{user_uuid}.png")
        with open(comic_file_path, 'rb') as file:
            file_content = file.read()

        # Upload the file content to S3
        upload_to_s3(io.BytesIO(file_content), 'comicimages3upload', f"{user_uuid}.png")

        del story, processed_story
        torch.cuda.empty_cache()

        return ComicResponse(
            status=True,
            message="Comic generated successfully",
            uuid = user_uuid,
            image_url =  f'https://comicimages3upload.s3.us-east-1.amazonaws.com/{user_uuid}.png',
            mcqs = mcqs
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app=app,
        host="0.0.0.0",
        port=5000,
        workers=1,
        log_level="info"
    )