import { FastifyRequest, FastifyReply } from 'fastify';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import AIAgentPlatformManager from '../functions/AIAgentPlatformManager';
import { resumeService } from '../services/resumeService';
import { Resume } from '../types/resume.types';

export const resumeHandler = async (request: FastifyRequest, reply: FastifyReply): Promise<Resume> => {
  let user_id;

  const file = await request.file({limits: {fileSize: 10_000_000}}); // 10MB

  if (!file) {
    return reply.status(400).send({ error: 'No file uploaded' });
  }

  user_id = (file.fields.user_id as any)?.value;
  const updateExisting = (file.fields.update as any)?.value === 'true';

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

    // Creates a JSON object from the resume
    const resumeData = await AIAgentPlatformManager.resumeAgent(text);

    // Store in database - either update or create
    let resume;
    if (updateExisting) {
      resume = await resumeService.updateResume(resumeData, user_id, text);
    } else {
      resume = await resumeService.createResume(resumeData, user_id, text);
    }

    reply.status(200);
    return resume;
  } catch (error) {
    console.error('Error handling resume:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
};

// Get resume by user ID
export const getResumeHandler = async (
  request: FastifyRequest<{ Params: { userId: string } }>,
  reply: FastifyReply
) => {
  try {
    const { userId } = request.params;
    const resume = await resumeService.getResumeByUserId(userId);
    
    if (!resume) {
      return reply.status(404).send({ error: 'Resume not found' });
    }
    
    return reply.status(200).send(resume);
  } catch (error) {
    console.error('Error fetching resume:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
};
