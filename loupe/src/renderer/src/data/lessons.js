export const LESSONS = [
  {
    title: 'What AI Actually Is (For Designers)',
    category: 'Foundations',
    read_time: 4,
    content: [
      'Artificial intelligence, at its core, is a system that learns patterns from data and uses those patterns to make predictions or generate outputs. It is not magic, and it is not thinking. It is sophisticated pattern matching at enormous scale.',
      'Large language models — the technology behind ChatGPT, Claude, and Gemini — are trained on vast amounts of text from the internet, books, and code. They learn the statistical relationships between words and ideas. When you ask a question, they predict the most likely useful response based on everything they\'ve seen.',
      'For designers, the most useful mental model is this: AI is a very well-read intern. It has absorbed enormous amounts of human knowledge and can retrieve and recombine it impressively — but it can\'t verify facts, it can\'t feel empathy, and it doesn\'t know your users. You still need to do the thinking.',
      'Where AI genuinely helps designers is in accelerating the mechanical parts of your job: generating drafts, summarising research, producing variations, writing documentation. These are tasks that eat time but don\'t require your deepest skills. AI handles the 80%; you handle the 20% that matters.',
      'Understanding what AI is — and isn\'t — helps you use it without being either over-reliant or needlessly suspicious. It\'s a tool with a specific set of strengths. Learn those strengths, and you\'ll use it well.'
    ],
    takeaway: 'Think of AI as a fast, tireless pattern-matcher — hand it the repetitive work, and spend your energy on the parts that require real human judgment.'
  },
  {
    title: 'Why AI Hallucinates (And What To Do About It)',
    category: 'Foundations',
    read_time: 3,
    content: [
      'Hallucination is the term for when an AI confidently states something false. It\'s one of the most important things to understand about working with AI tools — and it\'s not going away anytime soon.',
      'It happens because language models are trained to produce plausible-sounding text, not accurate text. They predict what words should come next based on patterns. When the model reaches the edge of what it knows, it doesn\'t stop and say "I\'m not sure." It keeps predicting — and those predictions can be fluent nonsense.',
      'In practice this means: AI-generated statistics, citations, names, and facts have a non-trivial chance of being wrong. The more obscure the topic, the higher the risk. The model will often sound more confident about things it\'s less certain about.',
      'The fix isn\'t to distrust AI entirely. It\'s to build verification into your workflow. Use AI to draft, summarise, and brainstorm — then verify anything that matters before it goes anywhere important.',
      'Design the interfaces around this reality too. If you\'re building a product with AI-generated content, add source links, confidence indicators, and easy ways for users to flag errors.'
    ],
    takeaway: 'Treat all AI-generated facts as drafts — never publish AI research summaries, statistics, or citations without verifying them against original sources.'
  },
  {
    title: 'The Top 3 AI Tools for UX Designers Right Now',
    category: 'Tools',
    read_time: 5,
    content: [
      'The AI tool landscape moves fast, but three categories have proven genuinely useful for working designers: writing assistants, research synthesisers, and design-specific AI.',
      'Writing assistants like Claude and ChatGPT are workhorses for UX writing tasks — generating microcopy variants, writing error messages, drafting onboarding flows, and summarising research notes into themes. The key is to treat them as a first draft engine, not a final answer.',
      'Research synthesisers — tools like Dovetail AI, Notion AI, and emerging features in UserZoom and Maze — can process large volumes of transcripts, notes, and survey responses to surface themes and patterns. They compress hours of affinity mapping into minutes. You still need to validate the themes, but they\'re a remarkable time saver.',
      'Design-specific AI in tools like Figma (with its AI features), Galileo AI, and Uizard can generate wireframes and UI screens from text descriptions. These are most useful for rapid exploration and communicating rough ideas to stakeholders — not for production-ready design. Think of them as a very fast sketching partner.',
      'The honest assessment: none of these tools replace deep UX skill. They accelerate the parts of the job that are already fast — and they can make junior designers faster. But research empathy, systems thinking, and design strategy remain firmly human territory.'
    ],
    takeaway: 'Pick one AI tool to integrate deeply into your current workflow this month — don\'t try to adopt everything at once.'
  },
  {
    title: 'Prompting with the RTCC Framework',
    category: 'Workflow',
    read_time: 4,
    content: [
      'Most designers who say AI doesn\'t give useful outputs are writing prompts like search queries. The difference between a mediocre AI response and a useful one is almost entirely in how you ask.',
      'The RTCC framework gives you four elements to include in any prompt: Role, Task, Context, and Constraints. Together they tell the AI who it\'s supposed to be, what you need, why you need it, and what rules to follow.',
      'Role: Give the AI a persona relevant to your task. "You are a senior UX writer with expertise in financial products" primes it to draw on relevant patterns. Task: State specifically what you want — not "help me with error messages" but "write five microcopy variants for a payment failure state." Context: Explain the situation — the product, the user, the tone, what you\'ve already tried. Constraints: Set the boundaries — word count, reading level, tone, what to avoid.',
      'A full prompt might look like: "You are a UX writer specialising in mobile banking apps. Write five short error messages for a failed bank transfer. The app is for first-time account holders who may be anxious about money. Tone: calm, clear, non-technical. Max 15 words each. Avoid blame language."',
      'That prompt will consistently outperform "write me some error messages for a payment failure." Practice building this habit and AI becomes a much more reliable tool.'
    ],
    takeaway: 'Before you type your next AI prompt, write out Role, Task, Context, and Constraints — even rough notes will dramatically improve what you get back.'
  },
  {
    title: 'AI in User Research: Opportunities and Risks',
    category: 'Workflow',
    read_time: 5,
    content: [
      'User research is one of the areas where AI has the most potential — and the most risk — for designers. Understanding both is essential before you bring AI into your research process.',
      'The opportunity is real: AI can transcribe interviews faster than any human, synthesise themes from hundreds of responses, identify patterns across survey data, and generate discussion guides and screener questions quickly. These are genuinely time-consuming tasks that AI handles well.',
      'The risks are also real. AI synthesis can smooth over the specific, surprising things participants say — the moments that don\'t fit a pattern are exactly where the most interesting insights live. An AI looking for themes will naturally cluster toward the common and miss the outlier that should change your whole design.',
      'There\'s also the risk of premature closure. When AI hands you five neat themes from 30 interviews, it feels complete. But did it capture the one participant who described a workaround that reveals a fundamental problem with your IA? Maybe. Maybe not. You have to check.',
      'The right approach: use AI for transcription, initial tagging, and first-pass synthesis — then do a human review pass specifically looking for things that feel unexpected, contradictory, or too thin. Don\'t let AI do your sense-making for you; let it do your data wrangling.'
    ],
    takeaway: 'Use AI to handle the transcription and initial synthesis, then do one focused human pass specifically looking for the surprising and contradictory data points AI might smooth over.'
  },
  {
    title: 'What\'s Actually Changing in UX Jobs',
    category: 'Industry',
    read_time: 4,
    content: [
      'There\'s a lot of noise about AI replacing UX designers. The reality is more nuanced — and in some ways more interesting — than either the doomsayers or the optimists suggest.',
      'What\'s clearly changing: the ratio of execution to thinking in a UX designer\'s job is shifting. Tasks that used to require hours — generating wireframe variations, writing documentation, producing copy alternatives — can now be done in minutes with AI assistance. This means teams can be leaner, or individual designers can do more.',
      'What\'s not changing: the core of UX work remains deeply human. Understanding what users actually need, making judgment calls about trade-offs, navigating organisational politics, building trust with stakeholders, recognising when a technically correct solution is emotionally wrong — none of this is something AI does.',
      'The roles most at risk are narrow execution roles — junior designers hired primarily to produce deliverables quickly. The roles most durable are those built around research depth, systems thinking, and strategic influence.',
      'The most useful response is to lean into the human parts. Get better at facilitation, at research, at communication, at understanding the business. Use AI to handle the execution work so you have more space to develop those skills. The designers who will struggle are those who resist AI entirely and those who offload their judgment to it.'
    ],
    takeaway: 'Actively develop your research, facilitation, and strategic skills — these are the parts of UX work that AI cannot replicate, and they\'re where your career resilience lives.'
  },
  {
    title: 'Figma AI: What\'s Actually Useful',
    category: 'Tools',
    read_time: 3,
    content: [
      'Figma has been rolling out AI features steadily, and the quality varies enough that it\'s worth knowing which ones are actually worth your time and which are more demo than daily tool.',
      'The genuinely useful features: the AI rename layers feature is a quiet time-saver if you\'re inheriting a messy file. The auto-layout suggestions are occasionally helpful when you\'re in a hurry. The "find component" natural language search is better than manually hunting through a large library.',
      'The hyped-but-limited features: AI-generated designs from prompts produce outputs that look plausible at small scale but rarely survive zooming in. The components are generic, the spacing is inconsistent, and they almost always need significant cleanup. Useful for rough client communication sketches, not for production work.',
      'The genuinely interesting (when it works): the AI prototyping features that turn static designs into interactive flows are getting better. For quick user testing prototypes, this can meaningfully cut time.',
      'The honest summary: Figma AI is a set of features in active development. Check in on them quarterly rather than committing to a workflow that includes them — they\'re changing fast enough that today\'s evaluation might be wrong in three months.'
    ],
    takeaway: 'In Figma, use AI for renaming, library search, and quick rough concepts — but don\'t route production design work through AI generation yet.'
  },
  {
    title: 'How to Build Your Personal AI Workflow',
    category: 'Workflow',
    read_time: 5,
    content: [
      'The designers getting the most out of AI aren\'t the ones using the most tools — they\'re the ones who\'ve built deliberate, repeatable habits around one or two tools they understand well.',
      'Start by auditing where your time goes in a typical week. Look for the tasks that are high volume, low creativity, and follow a consistent pattern. These are your AI candidates: writing first drafts, summarising notes, generating naming options, writing up research findings in a standard format.',
      'Pick one task and spend a week building a good prompt for it. Iterate on it until the first output is about 80% of what you need. Save that prompt somewhere accessible. This becomes a personal prompt library — and it compounds over time.',
      'Build a review habit. AI output should always have a human pass before it leaves your desk. Set a personal rule: "I always read and edit before I send." This takes 5 minutes and prevents the hallucination-embarrassment problem.',
      'Finally, stay connected to the parts of the work that don\'t use AI. Don\'t outsource your first-draft thinking to AI — use it to accelerate once you know what you want to say. The designers who are most fluent with AI are also the most intentional about where they choose not to use it.'
    ],
    takeaway: 'This week, pick one recurring task and write a reusable RTCC prompt for it — save it somewhere you\'ll actually find it again.'
  }
]
