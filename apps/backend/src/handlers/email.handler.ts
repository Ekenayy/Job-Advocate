import { FastifyReply, FastifyRequest } from 'fastify';
import { supabase } from '../services/supabaseClient';
import { CreateEmailSchemaType, EmailRequestSchemaType } from '../schemas/email.schema';
import { SendEmailInput } from '../types/email.types';
import { sendEmail } from '../services/emailService';
import { GenerateAIEmailType } from '../schemas/email.schema';
import { emailAgent } from '../functions/AIAgentEmailManager';

export const createEmailHandler = async (request: FastifyRequest<{ Body: CreateEmailSchemaType }>, reply: FastifyReply) => {
  
  try {

    const { email_body, subject } = request.body;

    const { data, error } = await supabase
      .from('emails')
      .insert(request.body)
      .select(
        `*,
        from:users(id, name, email),
        to:advocates(id, first_name, last_name, email)
        `
      )
      .single();

    console.log("Email created:", data);

    if (error) {
      reply.status(500).send({ error: error.message });
    }

    const responseFromEmailService = await sendEmail({
      from: {
        name: data.from.name,
        email: data.from.email
      },
      to: {
        first_name: data.to.first_name,
        last_name: data.to.last_name,
        email: data.to.email
      },
      content: {
        subject: subject,
        body: email_body
      }
    });

    if (responseFromEmailService.success) {
      await updateEmail(data.id, 'sent', undefined, responseFromEmailService.data.id);
    } else {
      await updateEmail(data.id, 'failed', responseFromEmailService.error.message);
    }

    const responseData: SendEmailInput = {
      email_id: data.id,
      status: data.status,
      error_message: data.error_message
    };

    reply.status(201).send(responseData as SendEmailInput);
  } catch (error) {
      reply.status(500).send({ error: "Internal server error" });
  }
};

export const sendEmailHandler = async (request: FastifyRequest<{ Body: EmailRequestSchemaType }>, reply: FastifyReply) => {
  try {
    const result = await sendEmail(request.body);
    
    if (!result.success) {
      return reply.status(400).send(result);
    }
    
    return reply.status(200).send(result);
  } catch (error) {
    return reply.status(500).send({ 
      success: false, 
      error: 'Internal server error' 
    });
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
  const { companyBackground, personBackground, myQualifications, jobRequirements } = request.body;

  try {
    const responseAI = await emailAgent(companyBackground, personBackground, myQualifications, jobRequirements);


    return reply.status(200).send({ responseAI });
  } catch (error) {
    console.error('Error generating email:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
}