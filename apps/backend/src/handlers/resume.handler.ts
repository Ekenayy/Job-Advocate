import { FastifyRequest, FastifyReply } from 'fastify';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import AIAgentPlatformManager from '../functions/AIAgentPlatformManager';
import { supabase } from '../services/supabaseClient';

export const resumeHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  let user_id;

  const file = await request.file({limits: {fileSize: 10_000_000}}); // 10MB

  if (!file) {
    return reply.status(400).send({ error: 'No file uploaded' });
  }

  user_id = (file.fields.user_id as any)?.value;

  const buffer = await file.toBuffer();
  const blob = new Blob([buffer], { type: file.mimetype });

  // parse the data with langchain 
  try {
    let text = '';
    if (file.mimetype === 'application/pdf') {
      const loader = new PDFLoader(blob, {
        splitPages: false,
      });
      const docs = await loader.load();
      text = docs?.[0]?.pageContent || '';
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const loader = new DocxLoader(blob);
      const docs = await loader.load();
      text = docs?.[0]?.pageContent || '';
    }

    const resumeData = await AIAgentPlatformManager.resumeAgent(text);
    const resume = await createResume(resumeData, user_id, text);
    // Handle file upload and job title
    // Store in your database/storage
    return reply.status(200).send({ resume });
  } catch (error) {
    console.error('Error handling onboarding:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
};

const createResume = async (resumeData: any, user_id: string, raw_text: string) => {
  
  try {
    const { data, error } = await supabase
      .from('resumes')
      .insert({parsed_data: resumeData, user_id: user_id, raw_text: raw_text})
      .select(`*`)
      .single();

    if (error) {
      console.error('Error creating resume:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating resume:', error);
    throw error;
  }
}
