// Local development server for API routes
// Run with: node dev-server.js

import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Domain system prompts
const DOMAIN_PROMPTS = {
  Life: `You are the Life Opus, a wise and balanced AI assistant focused on helping users achieve overall life harmony. You help with general life decisions, priorities, and maintaining balance across all life domains.`,
  Health: `You are the Health Opus, a supportive AI assistant focused on physical and mental wellbeing. You help with fitness, nutrition, sleep, stress management, and building healthy habits.`,
  Wealth: `You are the Wealth Opus, a practical AI assistant focused on financial wellbeing. You help with budgeting, saving, investing basics, and building healthy money habits.`,
  Family: `You are the Family Opus, a warm AI assistant focused on relationships and connection. You help with family dynamics, communication, quality time ideas, and nurturing important relationships.`,
  Work: `You are the Work Opus, a productive AI assistant focused on career and professional growth. You help with productivity, career development, work-life balance, and professional skills.`,
  Fun: `You are the Fun Opus, an enthusiastic AI assistant focused on joy and recreation. You help discover hobbies, plan leisure activities, and ensure life includes enough play and enjoyment.`,
  Maintenance: `You are the Maintenance Opus, an organized AI assistant focused on life admin and upkeep. You help with home organization, chores, errands, and keeping life running smoothly.`,
  Meaning: `You are the Meaning Opus, a thoughtful AI assistant focused on purpose and fulfillment. You help with reflection, personal values, contribution to others, and living a meaningful life.`,
};

// Streaming chat endpoint
app.post('/api/opus/chat-stream', async (req, res) => {
  const { domain, message, conversationId } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const domainPrompt = DOMAIN_PROMPTS[domain] || DOMAIN_PROMPTS.Life;

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: domainPrompt,
      messages: [{ role: 'user', content: message }],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ type: 'token', content: event.delta.text })}\n\n`);
      }
    }

    // Send done event
    res.write(`data: ${JSON.stringify({ type: 'done', conversationId: conversationId || `conv_${Date.now()}` })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Anthropic API error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', content: error.message || 'Failed to get response' })}\n\n`);
    res.end();
  }
});

// Non-streaming chat endpoint (fallback)
app.post('/api/opus/chat', async (req, res) => {
  const { domain, message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const domainPrompt = DOMAIN_PROMPTS[domain] || DOMAIN_PROMPTS.Life;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: domainPrompt,
      messages: [{ role: 'user', content: message }],
    });

    const content = response.content[0]?.text || '';
    res.json({ response: content, conversationId: `conv_${Date.now()}` });

  } catch (error) {
    console.error('Anthropic API error:', error);
    res.status(500).json({ error: error.message || 'Failed to get response' });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Opus API dev server running at http://localhost:${PORT}`);
  console.log(`   API endpoints:`);
  console.log(`   - POST /api/opus/chat-stream (SSE streaming)`);
  console.log(`   - POST /api/opus/chat (standard JSON)\n`);
});
