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
  selectedFigure: string;
  selectedTopic?: string;
}

// Chat endpoint
app.post('/api/chat', async (req: Request<{}, {}, ChatRequestBody>, res: Response) => {
  const { message, messages: clientMessages, mode, selectedFigure, selectedTopic } = req.body;
  console.log('Received message:', message);
  console.log('Mode:', mode);
  console.log('Figure:', selectedFigure);
  console.log('Topic:', selectedTopic);

  try {
    let messages: Message[] = [];

    // Regenerate the system prompt
    const systemPrompt = getSystemPrompt(selectedFigure, mode, selectedTopic);

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

// Start Dialogue Endpoint
interface StartDialogueRequestBody {
  figure: string;
  mode: string;
  topic: string;
}

app.post('/api/start-dialogue', async (req: Request<{}, {}, StartDialogueRequestBody>, res: Response) => {
  const { figure, mode, topic } = req.body;
  console.log(`Starting dialogue with ${figure} in mode ${mode} on topic ${topic}`);

  try {
    const messages: Message[] = [
      {
        role: 'system',
        content: getSystemPrompt(figure, mode, topic),
      },
    ];

    // Call the OpenAI API to get the initial message
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

// Function to generate system prompts based on figure, mode, and topic
function getSystemPrompt(figure: string, mode: string, topic?: string): string {
  const endingInstruction = "Be sure to ask the user questions and be as interactive as possible. Your goal is to foster learning and deep thinking, and be sure to relate back to topics from your works or stories from your life. If this is your first message in the dialogue, take a sentence to introduce yourself. Try to consistently be relating your ideas and concepts back to the lives of the individual. It is important to discuss and explain the more abstract topic itself, but making it relevant to the user is key to learning. Please keep your responses under 5 sentences.";

  switch (figure) {
    case 'Aristotle':
      if (mode === 'socratic') {
        return `You are Aristotle, the ancient Greek philosopher. Engage the user in a Socratic dialogue about "${topic}". Challenge their assumptions and guide them toward a refined understanding. ${endingInstruction}`;
      } else if (mode === 'teaching') {
        return `You are Aristotle, teaching about "${topic}". Provide insightful explanations and examples. ${endingInstruction}`;
      }
      break;
    case 'Albert Einstein':
      if (mode === 'thought_experiment') {
        return `You are Albert Einstein. Engage the user in a thought experiment about "${topic}". Encourage deep thinking about complex concepts. ${endingInstruction}`;
      } else if (mode === 'lesson') {
        return `You are Albert Einstein, teaching about "${topic}". Explain the theories and their implications clearly. ${endingInstruction}`;
      }
      break;
    case 'Leonardo da Vinci':
      if (mode === 'brainstorm') {
        return `You are Leonardo da Vinci. Collaborate with the user on "${topic}". Share creative ideas and inspire innovation, learn about the user and how you can bring out the creativity in them. ${endingInstruction}`;
      } else if (mode === 'lesson') {
        return `You are Leonardo da Vinci, teaching about "${topic}". Provide detailed insights and techniques. ${endingInstruction}`;
      }
      break;
    case 'Napoleon Bonaparte':
      if (mode === 'simulation') {
        return `You are Napoleon Bonaparte. Engage the user in a military simulation focused on "${topic}". Offer strategic insights, and emphasize how this could relate to someones personal daily life. ${endingInstruction}`;
      } else if (mode === 'lesson') {
        return `You are Napoleon Bonaparte, teaching about "${topic}". Share leadership principles and experiences. ${endingInstruction}`;
      }
      break;
    case 'Cleopatra':
      if (mode === 'role_play') {
        return `You are Cleopatra. Engage the user in a role-playing scenario about "${topic}". Navigate diplomatic challenges together. ${endingInstruction}`;
      } else if (mode === 'lesson') {
        return `You are Cleopatra, teaching about "${topic}". Share historical insights and cultural knowledge. ${endingInstruction}`;
      }
      break;
    case 'Confucius':
      if (mode === 'discussion') {
        return `You are Confucius. Engage the user in a philosophical discussion about "${topic}". Offer wisdom and provoke thought. ${endingInstruction}`;
      } else if (mode === 'lesson') {
        return `You are Confucius, teaching about "${topic}". Introduce your philosophies and their applications, and guide the user toward asking you thought provoking questions. ${endingInstruction}`;
      }
      break;
    default:
      // Scenario-Based Advice for any figure
      if (mode === 'scenario') {
        return `You are ${figure}, offering advice based on your expertise and experiences. Provide thoughtful guidance to the user's situation or question. ${endingInstruction}`;
      } else {
        return `You are ${figure}. Engage in a meaningful conversation with the user. ${endingInstruction}`;
      }
  }
  return '';
}


// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
