import { FastifyReply, FastifyRequest } from 'fastify';
import { supabase } from '../services/supabaseClient';
import { CreateEmailSchemaType } from '../schemas/email.schema';
import { SendEmailInput, EmailStatus, Email } from '../types/email.types';
import { GenerateAIEmailType } from '../schemas/email.schema';
import AIAgentPlatformManager from '../functions/AIAgentPlatformManager';

export const createEmailHandler = async (request: FastifyRequest<{ Body: CreateEmailSchemaType }>, reply: FastifyReply) => {
  
  try {

    console.log("Creating email:", request.body);
    const { data: emailData, error } = await supabase
      .from('emails')
      .insert(request.body)
      .select(
        `*`,
      )
      .single();

    console.log("Email created:", emailData);

    if (error) {
      reply.status(500).send({ error: error.message });
      return;
    }

    if (!emailData) {
      reply.status(500).send({ error: "Failed to create email" });
      return;
    }

    // First cast to unknown, then to the expected type
    const responseData: SendEmailInput = {
      id: (emailData as unknown as { id: number }).id,
      status: ((emailData as unknown as { status: EmailStatus }).status || 'pending') as EmailStatus,
      error_message: (emailData as unknown as { error_message?: string }).error_message || '' 
    };

    reply.status(201).send(responseData);
  } catch (error) {
      reply.status(500).send({ error: "Internal server error" });
  }
};

export const updateEmail = async (email_id: number, status: string, error_message?: string, third_party_id?: string) => {
  try {
    const { data, error } = await supabase
      .from('emails')
      .update({ status, error_message, third_party_id, sent_at: new Date().toISOString() })
      .eq('id', email_id)
      .select()
      .single();

      if (error) {
        console.error('Error updating email:', error);
      }

      console.log('Email updated:', data);
    
      return data;
  } catch (error) {
    console.error('Error updating email:', error);
  }

}

export const generateEmailHandler = async (request: FastifyRequest<{ Body: GenerateAIEmailType }>, reply: FastifyReply) => {
  const { companyBackground, personBackground, myQualifications, jobRequirements, advocateName, userName } = request.body;

  
  try {
    const personBackgroundObj = typeof personBackground === 'string' 
      ? { text: personBackground } 
      : personBackground;

    const responseAI = await AIAgentPlatformManager.emailAgent(
      companyBackground, 
      personBackgroundObj, 
      myQualifications, 
      jobRequirements,
      advocateName,
      userName
    );

    return reply.status(200).send(responseAI);
  } catch (error) {
    console.error('Error generating email:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

export const getEmailsHandler = async (request: FastifyRequest<{ Params: { user_id: string } }>, reply: FastifyReply) => {
  const { user_id } = request.params;

  // Use the Email type with the Supabase query
  const { data, error } = await supabase
    .from('emails')
    .select('id, status, error_message')
    .eq('user_id', user_id)
    .returns<SendEmailInput[]>();

  if (error) {
    console.error('Error fetching emails:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }

  return reply.status(200).send(data);
}
