import { FastifyRequest, FastifyReply } from 'fastify';
import { ChatOpenAI } from "@langchain/openai";
import { API_KEY_OPENAI } from '../constants';

const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  openAIApiKey: API_KEY_OPENAI,
});

export const analyzeJobPageHandler = async (
  request: FastifyRequest<{ Body: { pageContent: string } }>,
  reply: FastifyReply
) => {
  try {
    const { pageContent } = request.body;

    const response = await llm.invoke(
      `Extract the job title from the following job description. Return only the job title, no other text or commentary: ${pageContent.substring(0, 2000)}`
    );

    return reply.send(response.content.toString());
  } catch (error) {
    console.error('Error analyzing job page:', error);
    return reply.status(500).send({ error: 'Failed to analyze page' });
  }
};

export const extractJobInfoHandler = async (
  request: FastifyRequest<{ Body: { pageContent: string } }>,
  reply: FastifyReply
) => {
  try {
    const { pageContent } = request.body;

    const response = await llm.invoke(
      `Extract the job title from this job posting page content.
       Return only a JSON object with a single string property "jobTitle".
       If no job title is found, return an empty string.
       Look for the most prominent job title in the content.
       Page content: ${pageContent.substring(0, 2000)}`
    );

    return reply.send(response.content.toString());
  } catch (error) {
    console.error('Error extracting job info:', error);
    return reply.status(500).send({ error: 'Failed to extract job info' });
  }
};