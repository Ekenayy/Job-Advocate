import {
  trimMessages,
} from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import {
  START,
  END,
  MessagesAnnotation,
  StateGraph,
  MemorySaver,
} from "@langchain/langgraph";
import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { v4 as uuidv4 } from "uuid";
import { API_KEY_OPENAI } from '../constants';
import { promptEmail } from "./prompts/promptEmail";

export const emailAgent = async (
  companyBackground: string | undefined, 
  personBackground: string | undefined, 
  myQualifications: string | undefined, 
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
  
  I want you to respond with an email subject and an email body as keys on an object.
  
  Company Background: {company_background}
  Person Background: {person_background}
  My Qualifications: {qualifications}
  Job Requirements: {job_requirements}`;
  
    const promptTemplate = PromptTemplate.fromTemplate(template);
  
    const formattedPrompt = await promptTemplate.format({
      company_background: safeCompanyBackground,
      person_background: safePersonBackground,
      qualifications: safeQualifications,
      job_requirements: safeRequirements,
    });

    const response = await llm.invoke(formattedPrompt);
  // const prompt = await promptTemplate.invoke({})

  return response;
}
