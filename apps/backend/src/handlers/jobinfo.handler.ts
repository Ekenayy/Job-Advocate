import { FastifyRequest, FastifyReply } from "fastify";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "../constants";
import { postHogClient } from "../services/postHogClient";

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
    user_id?: string;
  };
}

export const extractJobInfoHandler = async (
  request: FastifyRequest<JobInfoRequest>,
  reply: FastifyReply
) => {
  try {
    const { pageContent, pageUrl, currentDomain, domainHints, user_id } = request.body;

    console.log("Page content length:", pageContent.length);
    console.log("Page URL:", pageUrl);
    console.log("Current domain:", currentDomain);
    console.log("Domain hints:", domainHints);

    // Prepare domain hints for Gemini
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

    // Create the prompt for Gemini
    const prompt = `Extract the job title, company name, company background, job requirements, and potential advocates from the following job description in json format.

    If you are given information about multiple positions at multiple companies, only extract information from the position and company that you have the most information about. Often times, many jobs postings will appear in a sidebar, but are not the job posting that the user has clicked on.

    For the company name:
    - Return the most likely, widely used company name.
    -Example: If the company name is "Amazon.com Services LLC" return "Amazon" 
    - Read the entire page content to determine the most likely company name. Sometimes hints can be found at the very end of the page. 
    - Example: A job description for a company called "Function" might include the name "Function Health" later in the page. In this case, return "Function Health" as the company name.

    For the job title:
    - First, identify if the job title has suffixes, prefixes or department/product/team specifications.
    - Extract only the core job title without location, remote status, or technology stack
    - Remove prefixes like "Remote", "Hybrid", "Virtual", etc.
    - Remove suffixes like "(Node.js, AWS)", "| Hybrid", etc.
    - Standardize titles: "Sr." → "Senior", "Jr." → "Junior", "Mgr" → "Manager", etc.
    - Keep the seniority level (Junior, Mid, Senior, Lead, etc.) if present
    - Keep the specialization (Frontend, Backend, Full Stack, etc.) if present

    For potential advocates:
    - Identify 4 valuable job titles at the company and within the department that would be helpful for the candidate to connect with. Follow these guidelines:
    1.	Include variations of the job title:
    •	If the job title includes seniority level, specification, or department/product/team in the suffix or prefix, also include the generalized job title.
    •	Example of a department specification: If the input is "Product Manager, API", include "Product Manager".
    -Another example of department level level specification: If the input is "Senior Product Manager, API", include "Senior Product Manager"
    - Example of a seniority level specification: If the input is "Director, Patient Engagement", include "Patient Engagement"
    * Include the the likely department name of the job title
    * Example: If the input is "Product Manager, API", include "Product". If the input is "Software Engineer, Payments", include "Engineering".
    2.	Identify the hiring manager's likely title. Do not include generic titles. 
    •	Example: If the input is "Product Manager, API", include "Director of Product". Do not include "Product Lead" or "Product Leader"
    3.	Include senior decision-makers:
    •	Include senior roles from the same department that could influence the hiring decision.
    4. Do not include anyone who is not in the department.
    -Example: If the job title is "Product Manager, API", do not include "Software Engineer" or "Engineering Manager"
    5.	Format the output as an array of standardized job titles:
    •	Example: ["Engineering Manager", "Senior Software Engineer", "Software Engineer"]

    Return a JSON object with exactly these fields:
    - jobTitle: The standardized core job title
    - companyName: The name of the company
    - companyBackground: The company's background as a string
    - jobRequirements: The job requirements as a string
    - potentialAdvocates: Array of 3-6 job titles of people who would be valuable connections

    Job description: ${pageContent}

    You must respond with valid JSON containing all requested fields. Do not include any explanatory text before or after the JSON.`;

    // Call the Gemini API
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1000,
        responseMimeType: "application/json", // Request JSON format
      },
    });

    const response = result.response;
    console.log("Gemini API response:", response);

    // Extract the text from the response
    const responseText = response.text();
    console.log("Response text:", responseText);

    // Try to parse the response as JSON
    try {
      // First, try direct parsing in case we get clean JSON
      try {
        const parsedJson = JSON.parse(responseText);
        console.log("Successfully parsed JSON directly:", parsedJson);
        if (user_id) {
          postHogClient.capture({
            distinctId: user_id,
            event: 'jobinfo_extracted',
          properties: {
            jobinfo: parsedJson,
            currentDomain: currentDomain,
            pageUrl: pageUrl,
          }
          })
          postHogClient.flush();
        }
        return reply.send(parsedJson);
      } catch (directParseError) {
        // If direct parsing fails, try to extract JSON from the text
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          console.log("Extracted JSON string:", jsonStr);
          const parsedJson = JSON.parse(jsonStr);
          console.log("Successfully parsed JSON from match:", parsedJson);
          if (user_id) {
            postHogClient.capture({
              distinctId: user_id,
              event: 'jobinfo_extracted',
              properties: {
                jobinfo: parsedJson,
                currentDomain: currentDomain,
                pageUrl: pageUrl,
              }
            })
            postHogClient.flush();
          }
          return reply.send(parsedJson);
        } else {
          throw new Error("No JSON object found in response");
        }
      }

    } catch (parseError: unknown) {
      console.error("Error parsing response as JSON:", parseError);
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
      throw new Error(`Failed to parse response as JSON: ${errorMessage}`);
    }
  } catch (error) {
    console.error("Error extracting job info:", error);
    return reply.status(500).send({ error: "Failed to extract job info" });
  }
};

// For backward compatibility, alias the function
export const analyzeJobPageHandler = extractJobInfoHandler;
