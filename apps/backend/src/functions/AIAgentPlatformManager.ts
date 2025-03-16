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
  jobRequirements: string | undefined,
  advocateName: string | undefined,
  userName: string | undefined
) => {   
  // Provide default values for undefined inputs
  const safeCompanyBackground = companyBackground || 'No company background provided';
  const safePersonBackground = personBackground || 'No person background provided';
  const safeQualifications = myQualifications || 'No qualifications provided';
  const safeRequirements = jobRequirements || 'No job requirements provided';
  const safeAdvocateName = advocateName || '[Hiring Manager]';
  const safeUserName = userName || '';

  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    openAIApiKey: API_KEY_OPENAI,
  });


  const template = `
  You are a helpful assistant tasked with creating an effective outreach cold email to a functional employee of a company where the user wants to apply for a job. This email should follow Steve Dalton's 6-Point Email (6PE) structure, which is designed to maximize the chances of getting a response. Your goal is to craft a personalized, concise, and engaging email that will encourage the recipient to respond positively.
  
  The 6-Point Email (6PE) structure consists of the following elements:

  1. Personalized greeting
  2. Shared interest or connection
  3. Compliment about the company
  4. Your background (briefly)
  5. Request
  6. Closing

  Guidelines for each point:

  1. Personalized greeting: Use the recipient's name if available.
  2. Shared interest or connection: Mention something you have in common or a connection you've identified.
  3. Compliment about the company: Offer a genuine, specific compliment about the company's recent achievements or values.
  4. Your background: Briefly mention your relevant experience or skills that align with the company's needs.
  5. Request: Ask for a brief informational interview or conversation about their experience at the company.
  6. Closing: Thank them for their time and express your eagerness to hear back.

  Tone and style:

  - Keep the email concise (75 words or less)
  - Be professional yet friendly
  - Show enthusiasm without being overly eager
  - Avoid generic statements; be specific and personal
  - Address the email to {advocateName}
  - If available, use the {advocateName} in the subject line of the email
  - If available, sign off with {userName} in the body of the email
  - Mention educational background if it's relevant to the role or company
  - Use my most relevant skills that match the job requirements
  - Reference most recent and relevant experiences

  Remember to make the email feel personal and authentic. Avoid using clichés or overly formal language. The goal is to create a genuine connection and spark the recipient's interest in responding.

  Now, create the email based on these instructions and the provided input variables.

  Company Background: {background}
  Person Background: {person}

  My Qualifications:
  Skills: {quals_skills}
  Recent Experience: {quals_exp}
  Education: {quals_edu}

  Job Requirements: {requirements}


  Response format:
  {{
    "subject": "Brief, personalized subject line",
    "body": "Professional, concise email body"
  }}`;
  
    const promptTemplate = new PromptTemplate({
      template,
      inputVariables: ["background", "person", "quals_skills", "quals_exp", "quals_edu", "requirements", "advocateName", "userName"]
    });
  
    const formattedPrompt = await promptTemplate.format({
      background: safeCompanyBackground,
      person: JSON.stringify(safePersonBackground),
      quals_skills: JSON.stringify(typeof safeQualifications === 'object' ? safeQualifications.skills : []),
      quals_exp: JSON.stringify(typeof safeQualifications === 'object' ? safeQualifications.experience?.[0] : {}),
      quals_edu: JSON.stringify(typeof safeQualifications === 'object' ? safeQualifications.education : []),
      requirements: safeRequirements,
      advocateName: safeAdvocateName,
      userName: safeUserName
    });

    const response = await llm.invoke(formattedPrompt);

    const contentString = response.content.toString().replace(/```json\n|\n```/g, '');
    const emailData = JSON.parse(contentString);

    console.log('myQualifications', safeQualifications);
  
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
