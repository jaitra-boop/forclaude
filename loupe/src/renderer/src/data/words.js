export const WORDS = [
  {
    word: 'Hallucination',
    definition: 'When an AI confidently states something that is factually wrong or completely made up. The model generates plausible-sounding text that has no basis in reality.',
    designer_tip: 'Always verify AI-generated copy, data, or research summaries. Build review checkpoints into any AI-assisted workflow.'
  },
  {
    word: 'Token',
    definition: 'The smallest unit of text an AI model processes — roughly a word or a few characters. Models have a maximum number of tokens they can handle at once.',
    designer_tip: 'When prompting AI tools, being concise often gets better results. Long, rambling prompts can hit token limits and lose context.'
  },
  {
    word: 'Prompt',
    definition: 'The instruction or question you give to an AI model. The quality and structure of your prompt directly shapes the quality of the output.',
    designer_tip: 'Treat prompting like writing a brief. The more context, constraints, and examples you give, the closer to what you need you will get.'
  },
  {
    word: 'Fine-tuning',
    definition: 'Training a pre-built AI model further on a specific dataset to make it specialise in a particular domain or style.',
    designer_tip: 'Fine-tuned models power tools like GitHub Copilot. For design teams, this is how brand-specific or style-consistent AI outputs become possible.'
  },
  {
    word: 'Grounding',
    definition: 'Connecting an AI model to real, verified data sources so its outputs are anchored in fact rather than hallucinated.',
    designer_tip: 'Grounded AI tools are more trustworthy for research synthesis. Look for AI research tools that cite their sources.'
  },
  {
    word: 'Inference',
    definition: 'The moment when a trained AI model actually runs and produces an output in response to an input. The "thinking" step.',
    designer_tip: 'Inference speed affects UX. Slow inference creates awkward pauses. Fast inference enables real-time, conversational AI experiences.'
  },
  {
    word: 'Context Window',
    definition: 'The maximum amount of text an AI can "see" and work with at one time — like the model\'s short-term memory.',
    designer_tip: 'If an AI seems to forget earlier parts of a conversation, you\'ve likely hit the context window. Break large tasks into smaller, focused sessions.'
  },
  {
    word: 'Temperature',
    definition: 'A setting that controls how creative or random an AI\'s outputs are. Low temperature = predictable; high temperature = more varied and surprising.',
    designer_tip: 'For copy generation, try different temperature settings. Low for legal text, high for brainstorming taglines or concept names.'
  },
  {
    word: 'Multimodal',
    definition: 'AI that can process and generate multiple types of data — text, images, audio, video — rather than just one.',
    designer_tip: 'Multimodal AI unlocks image-to-design, voice-to-text, and sketch-to-component workflows. This is where design tools are heading.'
  },
  {
    word: 'Agent',
    definition: 'An AI that can take actions autonomously — searching the web, writing code, calling tools — to complete a multi-step task without constant human input.',
    designer_tip: 'AI agents can run usability test analyses, compile research reports, or generate design variants overnight. Think of them as async collaborators.'
  },
  {
    word: 'Embeddings',
    definition: 'A way of converting text (or images) into lists of numbers that capture meaning, so similar things end up numerically close to each other.',
    designer_tip: 'Embeddings power semantic search and recommendation. They\'re why "show me more like this" features work in AI-enhanced design tools.'
  },
  {
    word: 'Guardrails',
    definition: 'Rules and filters built into an AI system to prevent it from producing harmful, biased, or inappropriate outputs.',
    designer_tip: 'When advocating for responsible AI in your org, guardrails are a key design consideration — not just a technical one. Who decides the rules?'
  },
  {
    word: 'RAG',
    definition: 'Retrieval-Augmented Generation — a technique where the AI searches a database for relevant information before generating a response, making it more accurate.',
    designer_tip: 'RAG is how tools like Notion AI or Confluence AI answer questions about your own documents. It\'s the basis of "chat with your data" features.'
  },
  {
    word: 'Boilerplate',
    definition: 'Standard, repetitive text or code that appears in many places with little variation. AI is very good at generating it.',
    designer_tip: 'Use AI to generate boilerplate design system documentation, accessibility annotations, or handoff notes — then spend your energy on the nuanced parts.'
  },
  {
    word: 'Latency',
    definition: 'The delay between sending a request to an AI and receiving a response. High latency = slow; low latency = fast.',
    designer_tip: 'Latency is a UX problem, not just an engineering one. Design loading states, skeleton screens, and progress indicators for AI-powered features.'
  },
  {
    word: 'Deterministic',
    definition: 'When a system always produces the same output given the same input. Most AI models are non-deterministic — you can get different answers to the same question.',
    designer_tip: 'Non-determinism means AI outputs need human review. Build "regenerate" and "edit" affordances into any AI-assisted feature you design.'
  }
]
