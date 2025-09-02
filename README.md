


https://github.com/user-attachments/assets/9a89afde-5087-4436-869c-d051b5097b40



# By Sohan Kumar – Fullstack + ML Engineer | India

Hi, I’m **Sohan Kumar**, a fullstack and machine learning engineer from India.  
I designed and built a fully containerized, production-deployed AI system that generates educational comics for children.

The website takes user input (e.g., **“White Blood Cells”**), generates a kid-friendly story using a large language model, creates consistent comic panels using a diffusion model, and displays the subject as an engaging comic.

This blog breaks down how I built the entire stack from scratch:

- **ML Inference** – Optimised for production deployment (FastAPI Backend on Jarvis Labs)  
- **Backend orchestration** – Auth, payments, and DB writes (Express.js)  
- **Frontend design and integration** – Next.js + TailwindCSS  
- **DevOps & CI/CD automation** – AWS (Route 53, ECR, ECS Fargate, CodeBuild, CodePipeline, ALB)  

If you’re hiring for **SDE or ML Engineer roles** and my project resonates with your requirements (or you know someone hiring), feel free to reach out!  
Also check out my GitHub for my other **Golang Fullstack realtime Chat application**.

After completing the **FastAI Deep Learning course Part 1** by Jeremy Howard, where I learned to build neural networks without using PyTorch or TensorFlow libraries, I moved to **Part 2**, which dives into how models like Stable Diffusion work from the ground up. At that point, I wanted to build something real and not fall into tutorial hell.

As someone who loves both **tech and storytelling** (novels, videogames, movies), I noticed there weren’t many fun and interactive ways for children to learn **Science and History concepts**.  
So, I decided to build a tool that transforms educational topics into **visually engaging comic stories**.

---

![project aws architecture](https://github.com/user-attachments/assets/2a6ff755-353b-4bc2-8d9c-cefbd454ef4d)

---

# ML Inference Pipeline

While I’m aware of the capabilities of ChatGPT-4o and other multimodal models (like text rendering in images), my project started back in **November 2024**, long before GPT-4o launched in March 2025.  
I was deep into designing my own inference engine by then, and committed to learning how to deploy it at scale.

I decided to use **Qwen Image** for image generation and **Phi-3-mini-4k-instruct** for story generation after experimenting, finetuning a few models, doing prompt engineering, and running pipeline inference.  
I didn’t want to call external APIs like ChatGPT or Claude, as I wanted to deploy the models myself in a **production environment**.  

I chose **FastAPI** and after days of reading documentation and iteration, I succeeded in deploying to **Jarvis Labs GPU cloud**, powered by a single **NVIDIA RTX A6000 GPU** (budget-friendly).

- Designed and deployed my own ML inference engine without using third-party APIs  
- Achieved **90% inference speedup** using:  
  - fp16, AWQ, AWQ-Marlin, TensorRT, ONNX, CUDA optimizations  
  - Preloading models into VRAM on startup to avoid reload times  
  - Pydantic input validation  
- Used **async FastAPI endpoints + semaphores** to handle concurrent requests (up to 17,000/day)  
- UUID tracking for each user request and intermediate steps  
- Generated comics saved to **AWS S3**, with S3 image URLs sent to Express backend (reducing latency)  

---

# Comic Story Format & Flow

The core idea is simple:  
A user types a topic like `"White Blood Cells"` and selects the genre (e.g., Science).  
The backend routes this through the following:

1. Profanity Check  
2. Prompt sent to LLM → generates structured scenes:  


{
  "scene": 1,
  "narration": "The brave white blood cells stood guard...",
  "stable_diffusion_prompt": "Cartoon style image of white blood cells fighting bacteria",
  "dialogue": "We won’t let them pass!"
}
3. Python Dictionary (HashMap) stores scenes

4. Prompts passed to qwen image to generate visuals

5. Narration overlaid at the top, dialogue at the bottom of each image (each intermediate step is UUID-tracked)

Final comic saved to AWS S3, image URL returned to backend

I spent months experimenting with speech bubbles using:

ControlNet

Face detection with Haar Cascades

Image segmentation tools

Unfortunately, none gave consistent results across prompts and panels, so I pivoted to overlaying text on the final image — simpler and more reliable.
Following Agile, I moved on to backend development.

From Jupyter Notebook to Production Pipeline

Early experiments began in Jupyter Lab, where I trained my own dataset for fine-tuning.
As my understanding grew, I migrated to a modular architecture.

That transition taught me a ton about:

Code structure

Dependency management

Modularizing Python projects

Deploying real-time inference services

# Backend Architecture

The backend, built using Express.js, sits between the frontend and ML pipeline.

What it does:

Accepts user input via REST APIs

Profanity checking

Google OAuth 2.0 authentication

Razorpay payment integration

UUID-based request tracking

MySQL database writes for user history

Session management

Communicates with ML inference pipeline

Saves final comic to AWS S3

Returns comic’s public URL to frontend

If the user is logged in, their comic is also saved to their dashboard.

# Database Schema:

One table for session management

One table for Google OAuth members

# Frontend Design

Built with Next.js + TailwindCSS, with a colourful, visually appealing design.

Features:

Razorpay payments to unlock premium features

Google OAuth login with JWT + cookie-based session management

Responsive design (mobile + tablet)

REST API integration with backend

Dashboard to view saved comics

# DevOps & CI/CD

One of my biggest goals was to learn AWS + DevOps hands-on.
I chose not to use Vercel or other managed platforms.

Infrastructure:

Domain: sohankumar.com via Route 53

SSL Certificate via AWS ACM

Frontend & backend Dockerized and deployed separately to ECS Fargate

Load balancing via Application Load Balancer

CI/CD via:

CodeBuild (build containers)

S3 (store build artifacts)

CodePipeline (orchestrate + deploy)

Triggered on changes to main branch

After 10+ failed attempts, I successfully implemented automated CI/CD with independent scaling of frontend and backend.

Final Thoughts

This project took me from experimenting in Jupyter notebooks to building a production-ready AI platform that generates comics to make learning fun for kids.

Along the way, I:

Learned fullstack dev, DevOps, ML inference optimization, and CI/CD from scratch

Designed a robust system capable of handling real-world load

Combined DSA knowledge, ML engineering, and UI/UX for a meaningful goal

# Tech Stack Overview

Languages: Python, JavaScript (TypeScript), SQL

Backend Development: FastAPI (ML inference), Express.js (API gateway), REST APIs, Async I/O, Concurrency Semaphores

ML Inference: Phi 3 main, SDXL, CUDA, AWQ-Marlin, TensorRT

Frontend Development: Next.js, TailwindCSS, HTML

Databases & Storage: MySQL (user data), AWS S3 (image storage, CI/CD artifacts)

Cloud & DevOps: AWS (ECS Fargate, ALB, Route 53, S3, ECR, ACM, VPC, NAT Gateway, Security Groups, Target Groups, CodeBuild, CodePipeline, CloudWatch), Docker, GitHub Actions, Jarvis Labs (GPU inference hosting)

Authentication & Payments: Google OAuth 2.0, Razorpay (test mode), Role-Based Access Control

Monitoring & Testing: Postman (API testing), Logs via AWS/ECS, CloudFormation

Developer Tools: Git, Linux, VSCode
