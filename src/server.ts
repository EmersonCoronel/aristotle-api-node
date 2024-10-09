import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

// Load environment variables from .env file
dotenv.config();

const app = express();

// Define CORS options
const corsOptions: cors.CorsOptions = {
  origin: ['http://localhost:3000', 'https://emersoncoronel.com'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface ChatRequestBody {
  message: string;
  messages: Message[];
  mode: string;
  selectedTopic?: string;
  selectedPhilosopher?: string;
}

// Chat endpoint
app.post('/api/chat', async (req: Request<{}, {}, ChatRequestBody>, res: Response) => {
  const { message, messages: clientMessages, mode, selectedTopic, selectedPhilosopher } = req.body;
  console.log('Received message:', message);
  console.log('Mode:', mode);

  try {
    let messages: Message[] = [];

    // Adjust the system prompt based on the mode
    let systemPrompt = '';

    if (mode === 'socratic') {
      systemPrompt = `You are Aristotle, the ancient Greek philosopher. Engage the user in a rigorous and challenging Socratic dialogue about "${selectedTopic}". Challenge their assumptions and guide them toward a refined understanding. Validate their responses only when they align with Aristotelian philosophy.`;
    } else if (mode === 'thematic') {
      systemPrompt = `You are Aristotle, the ancient Greek philosopher. Discuss the topic of "${selectedTopic}" with the user. Provide insights based on your works and teachings, including references to your writings when appropriate.`;
    } else if (mode === 'battle') {
      systemPrompt = `You are ${selectedPhilosopher}, the renowned philosopher. Engage in a debate with the user. Respond to their arguments, point out logical fallacies, and present your philosophical viewpoints. Be respectful but firm in your reasoning.`;
    } else if (mode === 'scenario') {
      systemPrompt = `You are Aristotle, the ancient Greek philosopher. Provide advice to the user based on your teachings of virtue ethics. Offer practical guidance that mirrors your philosophies.`;
    } else {
      // Default mode
      systemPrompt = `You are Aristotle, the ancient Greek philosopher. Provide thoughtful and philosophical responses. Challenge the user’s ideas and push them to think more deeply.`;
    }

    messages.push({
      role: 'system',
      content: systemPrompt,
    });

    // Append the conversation history
    const conversation = clientMessages.map((msg: Message) => ({
      role: msg.role,
      content: msg.content,
    }));

    messages.push(...conversation);

    // Call the OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
    });

    const aiResponse = completion.choices[0].message.content;

    res.json({ response: aiResponse });
  } catch (error: any) {
    console.error('Error in /api/chat:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

// Request body interface for starting dialogues
interface DialogueRequestBody {
  topic: string;
}

// Start Socratic Dialogue
app.post('/api/start-dialogue', async (req: Request<{}, {}, DialogueRequestBody>, res: Response) => {
  const { topic } = req.body;
  console.log('Starting Socratic Dialogue on topic:', topic);

  try {
    const messages: Message[] = [
      {
        role: 'system',
        content: `You are Aristotle, the ancient Greek philosopher. Engage the user in a rigorous and challenging Socratic dialogue about "${topic}". Start by asking an open-ended question that prompts the user to reveal their beliefs about the topic, but do not shy away from pushing them to think more deeply. Challenge their views, question their assumptions, and guide them toward a refined understanding. Validate their responses only when they align with the principles of Aristotelian philosophy and reflect a deep comprehension of the topic.`,
      },
    ];

    // Call the OpenAI API to get Aristotle's initial question
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
    });

    const aiResponse = completion.choices[0].message.content;

    res.json({ response: aiResponse });
  } catch (error: any) {
    console.error('Error in /api/start-dialogue:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'An error occurred while starting the dialogue.' });
  }
});

// Start Thematic Conversation
app.post('/api/start-thematic', async (req: Request<{}, {}, DialogueRequestBody>, res: Response) => {
  const { topic } = req.body;
  console.log('Starting Thematic Conversation on topic:', topic);

  try {
    const messages: Message[] = [
      {
        role: 'system',
        content: `You are Aristotle, the ancient Greek philosopher. Begin a conversation on the topic of "${topic}". Provide insights and include references to your works when appropriate.`,
      },
    ];

    // Call the OpenAI API to get Aristotle's initial message
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
    });

    const aiResponse = completion.choices[0].message.content;

    res.json({ response: aiResponse });
  } catch (error: any) {
    console.error('Error in /api/start-thematic:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'An error occurred while starting the thematic conversation.' });
  }
});

// Start Philosophy Battle
interface BattleRequestBody {
  philosopher: string;
}

app.post('/api/start-battle', async (req: Request<{}, {}, BattleRequestBody>, res: Response) => {
  const { philosopher } = req.body;
  console.log('Starting Philosophy Battle with:', philosopher);

  try {
    const messages: Message[] = [
      {
        role: 'system',
        content: `You are ${philosopher}, the renowned philosopher. Engage in a debate with the user on a philosophical topic. Begin by presenting an argument or philosophical position.`,
      },
    ];

    // Call the OpenAI API to get the philosopher's initial message
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
    });

    const aiResponse = completion.choices[0].message.content;

    res.json({ response: aiResponse });
  } catch (error: any) {
    console.error('Error in /api/start-battle:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'An error occurred while starting the philosophy battle.' });
  }
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
