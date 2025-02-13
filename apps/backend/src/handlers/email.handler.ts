import { FastifyReply, FastifyRequest } from 'fastify';
import { supabase } from '../services/supabaseClient';
import { CreateEmailSchemaType } from '../schemas/email.schema';
import { SendEmailInput } from '../types/email.types';

export const createEmailHandler = async (request: FastifyRequest<{ Body: CreateEmailSchemaType }>, reply: FastifyReply) => {
  
  try {

    const { data, error } = await supabase
      .from('emails')
      .insert(request.body)
      .select(
        `*,
        user:users(id, email)
        `
      )
      .single();

    console.log("Email created:", data);

    if (error) {
      reply.status(500).send({ error: error.message });
    }

    // TODO: Uncomment this when we have a real API
    // const APIResponse = await sendEmailToAPI({email_body: data.email_body, subject: data.subject, from_email: data.user.email, to_email: data.to_email});

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

export const sendEmailToAPI = async (
  {from_email, subject, email_body, to_email}: 
  {from_email: string, subject: string, email_body: string, to_email: string}
) => {

  // TODO: Replace with actual API call
  // Example with resend
  const response = await fetch('https://api.email.com/send', {
    method: 'POST',
    body: JSON.stringify({ from: from_email, subject, text: email_body, to: to_email })
  });

  if (!response.ok) {
    throw new Error('Failed to send email');
  }

  return response.json();
};