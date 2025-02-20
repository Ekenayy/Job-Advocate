import { ChatOpenAI } from "@langchain/openai";
import {PromptTemplate } from "@langchain/core/prompts";
import { API_KEY_OPENAI } from '../constants';

const emailAgent = async (
  companyBackground: string | undefined,
  personBackground: Record<string, unknown> | undefined,
  myQualifications: {
    skills?: string[];
    experience?: Record<string, unknown>[];
    education?: Record<string, unknown>[];
  } | undefined,
  jobRequirements: string | undefined
) => {   
  // Provide default values for undefined inputs
  const safeCompanyBackground = companyBackground || 'No company background provided';
  const safePersonBackground = personBackground || 'No person background provided';
  const safeQualifications = myQualifications || 'No qualifications provided';
  const safeRequirements = jobRequirements || 'No job requirements provided';

  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    openAIApiKey: API_KEY_OPENAI,
  });

  const template = `
  You are a helpful assistant that can help me write an email to someone at a company that I want to work at.
  
  Keep the emails short and concise. They should be no longer than 130 words. 
  
  I want you to respond with an email subject and an email body as a JSON object.
  
  Company Background: {background}
  Person Background: {person}

  My Qualifications:
  Skills: {quals_skills}
  Recent Experience: {quals_exp}
  Education: {quals_edu}

  Job Requirements: {requirements}

  Guidelines:
  1. Use my most relevant skills that match the job requirements
  2. Reference my most recent and relevant experience
  3. Mention educational background if it's relevant to the role or company
  4. Keep the tone professional but conversational
  5. Focus on how my background aligns with their needs
  6. Include a clear call to action (like a meeting request)

  Response format:
  {{
    "subject": "Brief, personalized subject line",
    "body": "Professional, concise email body"
  }}`;
  
    const promptTemplate = new PromptTemplate({
      template,
      inputVariables: ["background", "person", "quals_skills", "quals_exp", "quals_edu", "requirements"]
    });
  
    const formattedPrompt = await promptTemplate.format({
      background: safeCompanyBackground,
      person: JSON.stringify(safePersonBackground),
      quals_skills: JSON.stringify(typeof safeQualifications === 'object' ? safeQualifications.skills : []),
      quals_exp: JSON.stringify(typeof safeQualifications === 'object' ? safeQualifications.experience?.[0] : {}),
      quals_edu: JSON.stringify(typeof safeQualifications === 'object' ? safeQualifications.education : []),
      requirements: safeRequirements
    });

    const response = await llm.invoke(formattedPrompt);

    const contentString = response.content.toString().replace(/```json\n|\n```/g, '');
    const emailData = JSON.parse(contentString);
  
    return {
      subject: emailData.subject,
      body: emailData.body
    };
}

const resumeAgent = async (resume: string) => {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    openAIApiKey: API_KEY_OPENAI,
  });

  const template = `
  You are a helpful assistant that can help me scan a resume and extract the following information:
    -Summary
    -Skills
    -Experience
    -Education
    -Projects
    -Certifications
    -Awards
    -Publications
    -Languages
  
    The summary is a section where a user-generated overview of short-term professionals goals. You do not need to generate a summary of the resume in your response. 

    I want you to respond with the information as key/value pairs in a JSON object.
    
    If you cannot find the information, respond with an empty array for that section. Do not make up information.
  
  Resume: {resume}`;

  const promptTemplate = PromptTemplate.fromTemplate(template);

  const formattedPrompt = await promptTemplate.format({
    resume: resume
  });

  const response = await llm.invoke(formattedPrompt);

  const contentString = response.content.toString().replace(/```json\n|\n```/g, '');
  const resumeData = JSON.parse(contentString);

  return resumeData;
}

const AIAgentPlatformManager = {
  emailAgent,
  resumeAgent
}

export default AIAgentPlatformManager;
