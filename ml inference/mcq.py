from load_model import load_story
from vllm import SamplingParams



def generate_mcqs_from_story(story_text, llm, sampling_params=None):

    prompt = f'''
       Generate 3 multiple-choice questions (MCQs) that assess the underlying concepts of the provided story. Each question must include 4 answer options, clearly indicate the correct answer, and ensure that the questions focus on key themes, character motivations, and plot points. The questions should be structured as follow:
1. **Question 1: [Insert a key concept or theme related to the story]**
   - A) [Option A]
   - B) [Option B]
   - C) [Option C]
   - D) [Option D]
   - Correct Answer: [Indicate the correct answer]

2. **Question 2: Which theme is most prominently explored in the story?**
   - A) The consequences of betrayal
   - B) The struggle for power and control
   - C) The importance of friendship and loyalty
   - D) The quest for identity and belonging
   - Correct Answer: D) The quest for identity and belonging

3. **Question 3: What pivotal event triggers the main conflict in the plot?**
   - A) A sudden natural disaster
   - B) A betrayal by a close friend
   - C) The death of a family member
   - D) An unexpected inheritance
   - Correct Answer: B) A betrayal by a close friend   


   dont print this input in the output, just generate the questions based on the story text provided
    '''.replace('story', story_text)

    if llm is None:
        llm = load_story()

    if sampling_params is None:
        sampling_params = SamplingParams(
            temperature=0.2,  # Lower temperature for more structured output
            top_p=0.95,  # Keep diversity while ensuring structure
            max_tokens=1000,
            frequency_penalty=0.1,
            presence_penalty=0.1,
            
        )

    outputs = llm.generate([prompt], sampling_params)
    raw_text = outputs[0].outputs[0].text.strip()
    print("LLM response:", raw_text)
    return raw_text  # Return the generated text