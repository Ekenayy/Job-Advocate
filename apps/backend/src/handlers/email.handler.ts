import { FastifyReply, FastifyRequest } from 'fastify';
import { supabase } from '../services/supabaseClient';
import { CreateEmailSchemaType } from '../schemas/email.schema';

export const createEmailHandler = async (request: FastifyRequest<{ Body: CreateEmailSchemaType }>, reply: FastifyReply) => {
  
  try {
    console.log("Creating email...");
    // const { body } = request.body;
    console.log("Body:", request.body);
    // Create a new email in database
    const { data, error } = await supabase
      .from('emails')
      .insert(request.body)
      .select()
      .single();

    console.log("Email created:", data);

    if (error) {
      // if (error) throw new Error(`Failed to create app: ${error.message}`);     
      reply.status(500).send({ error: error.message });
    }

    reply.status(201).send(data);
  } catch (error) {
      reply.status(500).send({ error: "Internal server error" });
  }
};