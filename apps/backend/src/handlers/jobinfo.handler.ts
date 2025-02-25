import { FastifyRequest, FastifyReply } from "fastify";
import { Anthropic } from "@anthropic-ai/sdk";
import { ANTHROPIC_API_KEY } from "../constants";

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

export const extractJobInfoHandler = async (
  request: FastifyRequest<{ Body: { pageContent: string } }>,
  reply: FastifyReply
) => {
  try {
    const { pageContent } = request.body;

    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Extract the job title and company domain from the following job description in json format. Return only the job title and company domain, no other text or commentary. The domain must be a url. Return a JSON object with exactly these fields:
          - jobTitle: The title of the job position
          - companyDomain: The company's domain as a URL (e.g., "company.com")
          Job description: ${pageContent.substring(0, 2000)}`
        }
      ],
      system: "You are a helpful assistant that extracts job information from job postings. Always respond with valid JSON containing jobTitle and companyDomain fields."
    });

    if (!response.content[0] || typeof response.content[0] !== 'object') {
      throw new Error('Invalid response format from Claude');
    }

    const content = response.content[0];
    if (!('value' in content)) {
      throw new Error('Response missing value field');
    }

    return reply.send(content.value);
  } catch (error) {
    console.error("Error extracting job info:", error);
    return reply.status(500).send({ error: "Failed to extract job info" });
  }
};

// For backward compatibility, alias the function
export const analyzeJobPageHandler = extractJobInfoHandler;
