import { FastifyRequest, FastifyReply } from 'fastify';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";

export const resumeHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  // const data = await request.body as MultipartFields;
  const file = await request.file({limits: {fileSize: 10_000_000}}); // 10MB

  if (!file) {
    return reply.status(400).send({ error: 'No file uploaded' });
  }

  const user_id = (file.fields.user_id as any)?.value;

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
      // text = docs.map((doc: any) => doc.pageContent).join('\n');
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const loader = new DocxLoader(blob);
      const docs = await loader.load();
      text = docs?.[0]?.pageContent || '';
    }
    
    // Handle file upload and job title
    // Store in your database/storage
    return reply.status(200).send({ text, user_id });
  } catch (error) {
    console.error('Error handling onboarding:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
};