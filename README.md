
By Sohan Kumar – Fullstack + ML Engineer | India
Hi, I’m Sohan Kumar, a fullstack and machine learning engineer from India. I designed and built a fully containerized, production-deployed AI system that generates educational comics for children.
The website takes user input (e.g., “White Blood Cells”), generates a kid-friendly story using a large language model, creates consistent comic panels using a diffusion model, and displays the subject as an engaging comic.
This blog breaks down how I built the entire stack from scratch:
•	ML Inference Optimised for production deployment. (FastAPI Backend on Jarvis Labs)
•	Backend orchestration with auth, payments, and DB writes. (Express.js)
•	Frontend design and integration. (Next.js + TailwindCSS)
•	DevOps & CI/CD automation. (AWS (Route 53, ECR, ECS Fargate, CodeBuild, Codepipeline, ALB))
If you’re hiring for SDE or ML Engineer roles and my projects resonates with your requirements or know someone hiring, feel free to reach out! Also check out my GitHub for my other Golang Fullstack realtime Chat application.
After completing the FastAI Deep Learning course Part 1 by Jeremy Howard, where I learned to build neural networks without using pytorch or tensorflow libraries and other foundational coursework, I moved to Part 2, which dives into how models like Stable Diffusion work from the ground up. At that point, I wanted to build something and not fall into tutorial hell.
As someone who loves both tech and different storytelling formats like novels, videogames and movies, I noticed there weren’t many fun and interactive ways for children to learn science and History concepts. So, I decided to build a tool that transforms educational topics into visually engaging comic stories.

![project aws architecture](https://github.com/user-attachments/assets/2a6ff755-353b-4bc2-8d9c-cefbd454ef4d)



 
 ML Inference Pipeline
While I’m aware of the capabilities of ChatGPT-4o and other multimodal models (like text rendering in images), my project started back in November 2024, long before GPT-4o launched in March 2025. I was deep into designing my own inference engine by then, and committed to learning how to deploy it at scale.
I have decided to use SDXL Turbo for image generation and mistral 4b aws for story generation after experimenting, finetuning few models, prompt engineering, pipeline inference runs. I didn’t want to call external api like ChatGPT or Claude as I wanted to deploy the models myself in a production environment. I decided to use FastAPI and after days of reading documentation and iteration. I have succeeded in deploying to gpu cloud platform Jarvis Labs powered by a single NVIDIA RTX A6000 gpu which aligns with my budget.
•	Designed and deployed my own ML inference engine without using third-party APIs
•	Achieved 90% inference speedup using:
o	fp16, AWQ, AWQ-Marlin,TensorRT,ONXX and CUDA optimizations
o	Preloading models into VRAM on startup to avoid reload times
o	Pydantic input Validation
•	Used async FastAPI endpoints + semaphores to handle concurrent requests (up to 17,000/day)
•	UUID tracking for each user request and intermediate steps
•	Generated Comics are saved to Aws S3 and S3 image URL are sent to Main express Backend thus saving latency
Comic Story Format & Flow
The core idea is simple: a user types a topic like "White Blood Cells" and selects the genre (e.g., Science). The backend routes this through the following:
1.	Profanity Check
2.	Prompt sent to LLM → generates structured scenes:
{
  "scene": 1,
  "narration": "The brave white blood cells stood guard...",
  "stable_diffusion_prompt": "Cartoon style image of white blood cells fighting bacteria",
  "dialogue": "We won’t let them pass!"
}

1.	Python Dictionary (HashMap) stores scenes.
2.	Prompts are passed to SDXL Turbo to generate visuals
3.	Narration is overlaid at the top, dialogue at the bottom of each image (each intermediate step is numbered using Uuid. 
4.	Final Comic is then saved to Aws S3 bucket and the Image url is sent as response to the Main Backend
I spent months experimenting with speech bubbles using:
•	ControlNet
•	Face detection with Haar Cascades
•	Image segmentation tools
Unfortunately, none gave consistent results across various prompts and panels, so I had to  pivoted to overlaying text on the final image — a simpler and more reliable alternative. I followed Agile framework so had to move to main backend development and so on and so forth.
________________________________________
 From Jupyter Notebook to Production Pipeline
Early experiments began in Jupyter Lab, where I tried training my own dataset for behavior fine-tuning. As my understanding grew, I migrated to a modular architecture.
That transition taught me a ton about:
•	Code structure
•	Dependency management
•	Modularizing Python projects
•	Deploying real-time inference services
________________________________________ Backend Architecture
The backend, built using Express.js, sits between the frontend and the ML pipeline.
What it does:
•	Accepts user input via REST APIs
•	Profanity checking
•	Google OAuth 2.0 authentication
•	Razorpay payment integration
•	UUID-based tracking of request flow
•	MySQL database writes for user history
•	Session management
•	Communicates with ML inference pipeline
•	Saves final comic to AWS S3
•	Returns the comic’s public URL to the frontend
If the user is logged in, their comic is also saved to their dashboard.
DataBase schema:
I used two tables one for session management and other for google oauth members
________________________________________ Frontend Design
I built the frontend using Next.js and TailwindCSS with a colourful visually appealing design.
Features:
•	Razorpay payments to unlock premium features
•	Google OAuth login with JWT + cookie-based session management
•	Responsive design (mobile + tablet support)
•	RESTful API integration with backend
•	Dashboard to view saved comics (for logged-in users)
________________________________________
 DevOps & CI/CD
One of my biggest goals was to learn AWS and DevOps hands-on. I chose not to use Vercel or other managed platforms.
Infrastructure:
•	Domain purchased: sohankumar.com via Route 53
•	SSL Certificate via AWS ACM
•	Frontend & backend are Dockerized and deployed separately to ECS Fargate
•	Load Balancing handled by Application Load Balancer
•	CI/CD via:
o	CodeBuild (build containers)
o	S3 (store build artifacts)
o	CodePipeline (orchestration and deployment)
o	Triggered on changes to the main branch
After 10+ failed attempts, I successfully implemented fully automated CI/CD with independent scaling of frontend and backend.
________________________________________
 Final Thoughts
This project took me from experimenting with Jupyter notebooks to building a production-ready AI platform used to generate comics that make learning fun for kids.
Along the way, I:
•	Learned fullstack dev, devops, ML inference optimization, and CI/CD from scratch
•	Designed a robust system capable of handling real-world load
•	Found a way to combine DSA knowledge, ML engineering, and UI/UX for a meaningful goal
If you're looking for a passionate engineer with hands-on experience across the entire stack — from CUDA to Codepipeline — I’d love to connect.

Tech Stack overview:
Languages: Python, JavaScript (TypeScript), SQL.
Backend Development: FastAPI (ML inference Production), Express.js (API gateway), REST APIs, Async I/O, Concurrency Semaphores.
Ml inference : Phi 3 main ,SDXL, CUDA , AWQ marlin , TensorRT
Frontend Development: Next.js Tailwind CSS, HTML.
Databases & Storage: MySQL (user data), AWS S3 (image storage, Artifacts for cicd)
Cloud & DevOps: AWS (ECS Fargate, ALB, Route 53, S3,ECR ,ACM, VPC, NAT Gateway, Security Groups, Target Groups, CodeBuild, Codepipeline ,CloudWatch), Docker, GitHub Actions (CI/CD), Jarvis Labs (GPU inference hosting).
Authentication & Payments: Google OAuth 2.0, Razorpay (test mode), Role-Based Access Control.
Monitoring & Testing: Postman (API testing), Logs via AWS/ECS, CloudFormation
Developer Tools: Git, Linux, VSCode. 

