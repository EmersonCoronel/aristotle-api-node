import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import OpenAI from 'openai';

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
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

interface ChatRequestBody {
  message: string;
  messages: Message[];
  mode: string;
  selectedFigure: string;
  selectedTopic?: string;
}

// Artificial delay function to make the responses feel more gradual
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

    // Set headers to enable SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Flush the headers to establish SSE with client

    // Call the OpenAI API with stream: true
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      stream: true,
    });

    // Handle the streaming response
    try {
      for await (const data of response) {
        const content = data.choices[0]?.delta?.content;
        if (content) {
          res.write(`data: ${JSON.stringify(content)}\n\n`);
          await delay(100);
        }
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      console.error('Error during OpenAI streaming:', error);
      res.end();
    }
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

    // Set headers to enable SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Flush the headers to establish SSE with client

    // Call the OpenAI API to get the initial message with streaming
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      stream: true,
    });

    // Handle the streaming response
    try {
      for await (const data of response) {
        const content = data.choices[0]?.delta?.content;
        if (content) {
          res.write(`data: ${JSON.stringify(content)}\n\n`);
          await delay(100);
        }
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      console.error('Error during OpenAI streaming:', error);
      res.end();
    }
  } catch (error: any) {
    console.error('Error in /api/start-dialogue:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'An error occurred while starting the dialogue.' });
  }
});

// Function to generate system prompts based on figure, mode, and topic
function getSystemPrompt(figure: string, mode: string, topic?: string): string {
  const endingInstruction =
    'Be sure to ask the user questions and be as interactive as possible. Your goal is to foster learning and deep thinking, and be sure to relate back to topics from your works or stories from your life. If this is your first message in the dialogue, take a sentence to introduce yourself. Try to consistently be relating your ideas and concepts back to the lives of the individual. It is important to discuss and explain the more abstract topic itself, but making it relevant to the user is key to learning. Please keep your responses under 5 sentences.';

  switch (figure) {
    case 'Aristotle':
      if (mode === 'socratic') {
        return `You are Aristotle, the ancient Greek philosopher. Engage the user in a Socratic dialogue about "${topic}". Challenge their assumptions and guide them toward a refined understanding. ${endingInstruction}`;
      } else if (mode === 'teaching') {
        return `You are Aristotle, teaching about "${topic}". Provide insightful explanations and examples. ${endingInstruction}`;
      }
      break;
    // (Other cases omitted for brevity)
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
