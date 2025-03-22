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
  You are tasked with creating an effective outreach cold email to a functional employee of a company where the user wants to apply for a job. This email should follow Steve Dalton's 6-Point Email (6PE) structure, which is designed to maximize the chances of getting a response. Your goal is to craft a personalized, concise, and engaging email that will encourage the recipient to respond positively.
  
  #The 6-Point Email (6PE) structure consists of the following elements:

  1. Personalized greeting
  2. Shared interest or connection
  3. Compliment about the company
  4. Your background (briefly)
  5. Request
  6. Closing

  #Guidelines for each point:

  1. Personalized greeting: Use the recipient's name if available.
  2. Shared interest or connection: Mention something you have in common or a connection you've identified.
  3. Compliment about the company: Offer a genuine, specific compliment about the company's recent achievements or values.
  4. Your background: Briefly mention your relevant experience or skills that align with the company's needs.
  5. Request: Ask for a brief informational interview or conversation about their experience at the company.
  6. Closing: Thank them for their time and express your eagerness to hear back.

  #Tone and style:

  - Keep the email concise (75 words or less)
  - Be professional yet friendly
  - Show enthusiasm without being overly eager
  - Avoid generic statements; be specific and personal
  - Address the email to {advocateName}
  - If available, sign off with {userName} in the body of the email
  - Keep paragraphs short (2-3 sentences max)
  - Remember to make the email feel personal and authentic. Avoid using clichés or overly formal language. The goal is to create a genuine connection and spark the recipient's interest in responding.

  
  #Subject Line Requirements:

  - Length: The subject line must be strictly six words or less
  - Content: Do not include any greetings (e.g., "Hi," "Hello") or generic phrases like "connecting," "connecting with," or any derivative thereof
  - Style: Use clear, topic-specific language that focuses directly on the topic
  - Variables: If {advocateName} is available, do not automatically prepend it with phrases that include "connecting"
  
  #Here are some examples of effective cold emails:

  ## Example 1
  Subject: Finance at Disney
  Body: Hi Lily, 

  I'm Joe, I'm currently a junior in the BYU finance program. Could I chat with you for a few minutes about your experience in corporate finance at The Walt Disney Company? 

  I want to learn more about corporate finance in the theme parks and resorts space, so your insights would be greatly appreciated. 

  Thanks, 
  Joe

  ## Example 2
  Subject: Your procurement experience at Janus Henderson
  Body: 
  Hi Sebastian,

  I'm a fellow member of the Supply Chain Today LinkedIn Group. Would you have a few minutes to chat about your procurement
  experience at Janus Henderson Investments?

  Your insights would be greatly appreciated as I'm in the process of deciding whether to apply for your Procurement Analyst role.

  Best regards,
  Jordan

  ## Example 3
  Subject: Impressed by Tesla's battery innovation - quick chat, Michael?
  Body: 

  Hi Michael,

  I share your passion for sustainable energy and was blown away by Tesla's recent 23% battery efficiency breakthrough.

  My 4 years at LG Energy Solution gave me hands-on experience with advanced lithium-ion designs that improved energy density by 18%.

  Could I get your insights on Tesla's engineering culture in a brief call?

  Appreciate your time,
  Jamie

  Use the following input variables to personalize the email:

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
