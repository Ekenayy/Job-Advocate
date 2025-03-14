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

    console.log("Page content:", pageContent);

    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Extract the job title, company name, company domain, company background, job requirements, and potential advocates from the following job description in json format.

          If you are given information about multiple positions at multiple companies, only extract information from the position and company that you have the most information about. Often times, many jobs postings will appear in a sidebar, but are not the job posting that the user has clicked on.

          For the job title:
          - Extract only the core job title without location, remote status, or technology stack
          - Remove prefixes like "Remote", "Hybrid", "Virtual", etc.
          - Remove suffixes like "(Node.js, AWS)", "| Hybrid", etc.
          - Standardize titles: "Sr." → "Senior", "Jr." → "Junior", "Mgr" → "Manager", etc.
          - Keep the seniority level (Junior, Mid, Senior, Lead, etc.) if present
          - Keep the specialization (Frontend, Backend, Full Stack, etc.) if present

          For potential advocates:
          - Identify 3-5 job titles of people at the company who would be valuable for the candidate to connect with
          - Include the hiring manager's likely title
          - Include team members with similar or complementary roles
          - Include senior roles that might influence hiring decisions
          - Format as an array of standardized job titles (e.g., ["Engineering Manager", "Senior Software Engineer"])

          Return a JSON object with exactly these fields:
          - jobTitle: The standardized core job title
          - companyName: The name of the company
          - companyDomain: The company's domain as a URL (e.g., "company.com")
          - companyBackground: The company's background as a string
          - jobRequirements: The job requirements as a string
          - potentialAdvocates: Array of 3-5 job titles of people who would be valuable connections

          Job description: ${pageContent}`
        }
      ],
      system: "You are a helpful assistant that extracts job information from job postings. Always respond with valid JSON containing all requested fields. For job titles and potential advocates, extract only the core titles without location, remote status, or technology stack."
    });

    if (!response.content[0] || typeof response.content[0] !== 'object') {
      throw new Error('Invalid response format from Claude');
    }

    const content = response.content[0];
    
    if (content.type === 'text') {
      console.log("Text content received:", content.text);
      // Try to parse the text as JSON
      try {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          console.log("Extracted JSON string:", jsonStr);
          const parsedJson = JSON.parse(jsonStr);
          console.log("Successfully parsed JSON:", parsedJson);
          return reply.send(parsedJson);
        } else {
          console.error("No JSON object found in text response");
        }
      } catch (parseError) {
        console.error("Error parsing text as JSON:", parseError);
      }
    }
    
    // Handle value field format
    if ('value' in content) {
      return reply.send(content.value);
    }
    
    throw new Error('Response format not recognized');
  } catch (error) {
    console.error("Error extracting job info:", error);
    return reply.status(500).send({ error: "Failed to extract job info" });
  }
};

// For backward compatibility, alias the function
export const analyzeJobPageHandler = extractJobInfoHandler;
