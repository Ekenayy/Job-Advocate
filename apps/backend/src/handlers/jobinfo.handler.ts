import { FastifyRequest, FastifyReply } from "fastify";
import { Anthropic } from "@anthropic-ai/sdk";
import { ANTHROPIC_API_KEY } from "../constants";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "../constants";
const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

interface JobInfoRequest {
  Body: {
    pageContent: string;
    pageUrl?: string;
    currentDomain?: string;
    domainHints?: {
      links: string[];
      emails: string[];
      metaTags: Record<string, string>;
      socialProfiles: string[];
      hostingPlatform: string;
    };
  };
}

export const extractJobInfoHandler = async (
  request: FastifyRequest<JobInfoRequest>,
  reply: FastifyReply
) => {
  try {
    const { pageContent, pageUrl, currentDomain, domainHints } = request.body;

    console.log("Page content length:", pageContent.length);
    console.log("Page URL:", pageUrl);
    console.log("Current domain:", currentDomain);
    console.log("Domain hints:", domainHints);

    // Prepare domain hints for Claude
    let domainHintsText = "";
    if (domainHints) {
      domainHintsText = `
Additional domain hints:
- Current page URL: ${pageUrl || "Unknown"}
- Current domain: ${currentDomain || "Unknown"}
`;

      if (domainHints.links && domainHints.links.length > 0) {
        domainHintsText += `- Company website links found: ${domainHints.links.join(", ")}\n`;
      }

      if (domainHints.emails && domainHints.emails.length > 0) {
        domainHintsText += `- Email domains found: ${domainHints.emails.join(", ")}\n`;
      }

      if (domainHints.metaTags && Object.keys(domainHints.metaTags).length > 0) {
        domainHintsText += "- Meta tags found:\n";
        for (const [key, value] of Object.entries(domainHints.metaTags)) {
          domainHintsText += `  - ${key}: ${value}\n`;
        }
      }

      if (domainHints.socialProfiles && domainHints.socialProfiles.length > 0) {
        domainHintsText += `- Social profiles found: ${domainHints.socialProfiles.join(", ")}\n`;
      }

      if (domainHints.hostingPlatform) {
        domainHintsText += `- Job hosting platform: ${domainHints.hostingPlatform}\n`;
      }
    }

    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Extract the job title, company name, company domain, company background, job requirements, and potential advocates from the following job description in json format.

          If you are given information about multiple positions at multiple companies, only extract information from the position and company that you have the most information about. Often times, many jobs postings will appear in a sidebar, but are not the job posting that the user has clicked on.

          For the job title:
          - First, identify if the job title has suffixes, prefixes or department/product/team specifications.
          - Extract only the core job title without location, remote status, or technology stack
          - Remove prefixes like "Remote", "Hybrid", "Virtual", etc.
          - Remove suffixes like "(Node.js, AWS)", "| Hybrid", etc.
          - Standardize titles: "Sr." → "Senior", "Jr." → "Junior", "Mgr" → "Manager", etc.
          - Keep the seniority level (Junior, Mid, Senior, Lead, etc.) if present
          - Keep the specialization (Frontend, Backend, Full Stack, etc.) if present

          For potential advocates:
          - Identify 12 valuable job titles at the company that would be helpful for the candidate to connect with. Follow these guidelines:
          1.	Include variations of the job title:
          •	If the job title includes a suffix, prefix, or department/product/team specification, also include the generalized job title.
          •	Example: If the input is "Product Manager, API", include "Product Manager".
          * Include the the likely department name of the job title
          * Example: If the input is "Product Manager, API", include "Product". If the input is "Software Engineer, Payments", include "Engineering".
          2.	Include related roles:
          •	Include team members with similar job functions.
          3.	Identify the hiring manager’s likely title:
          •	Example: If the input is "Product Manager, API", include "Director of Product".
          4.	Include senior decision-makers:
          •	Include senior roles from the same department that could influence the hiring decision.
          5.	Format the output as an array of standardized job titles:
          •	Example: ["Engineering Manager", "Senior Software Engineer", "Software Engineer"]

          For the company domain:
          - Determine the most likely official company domain (e.g., "company.com")
          - Use the domain hints provided if available. Navigate to any hints to understand the company better.
          - Look for email addresses in the job posting that might reveal the company domain
          - If multiple possible domains are found, choose the most likely official one
          - Return only the domain without "http://" or "www." prefixes
          - Navigate to the company domain and check if it is a valid company website and if the job posting matches the mission and description of the company website that you navigate to
          - Take your time here. It is critical to get the company domain correct.


          Return a JSON object with exactly these fields:
          - jobTitle: The standardized core job title
          - companyName: The name of the company
          - companyDomain: The company's domain as a URL (e.g., "company.com")
          - companyBackground: The company's background as a string
          - jobRequirements: The job requirements as a string
          - potentialAdvocates: Array of 3-5 job titles of people who would be valuable connections

          ${domainHintsText}

          Job description: ${pageContent}`
        }
      ],
      system: "You are a helpful assistant that extracts job information from job postings. Always respond with valid JSON containing all requested fields. For job titles and potential advocates, extract only the core titles without location, remote status, or technology stack. For company domains, use the provided hints to determine the most likely official domain."
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
