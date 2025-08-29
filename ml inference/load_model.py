# load_model.py
import torch
from huggingface_hub import login
from vllm import LLM
from diffusers import DiffusionPipeline
import logging
from config import HUGGING_FACE_TOKEN

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def load_story():
    """Load the LLM model for story generation"""
    
    try:
        logger.info("Loading LLM model...")
        model_path = "Sreenington/Phi-3-mini-4k-instruct-AWQ"
        VLLM_ALLOW_LONG_MAX_MODEL_LEN=1
        
        llm = LLM(
            model=model_path,
            dtype="float16",
            tensor_parallel_size=1,
            quantization="awq_marlin",
           
            max_model_len = 4096,
            enable_prefix_caching=False,
            enable_chunked_prefill=True,
            gpu_memory_utilization=0.30,
            max_num_batched_tokens = 4096
           
        )
        
        logger.info("LLM model loaded successfully")
        return llm
        
    except Exception as e:
        logger.error(f"Error loading LLM model: {str(e)}")
        raise Exception(f"not working load story: {str(e)}")

def load_stablediffusion():
    """Load SDXL Turbo model"""
    try:
        logger.info("Loading qwen image model...")
        
        # Clear CUDA cache before loading model
        torch.cuda.empty_cache()
        
        model_name = "Qwen/Qwen-Image"

        if torch.cuda.is_available():
            torch_dtype = torch.bfloat16
        else:
            torch_dtype = torch.float32

        # Load across both GPUs automatically
        pipe = DiffusionPipeline.from_pretrained(
            model_name,
            torch_dtype=torch_dtype,

            device_map="balanced"  # This is where "auto" is valid
        )
        

       
        
        logger.info("SDXL Turbo model loaded successfully")
        return pipe
        
    except Exception as e:
        logger.error(f"Error loading SDXL Turbo model: {str(e)}")
        raise Exception(f"Error loading SDXL Turbo model: {str(e)}")