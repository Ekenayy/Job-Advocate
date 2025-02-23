import { FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../services/supabaseClient';
import { WebhookEvent } from '@clerk/backend';

export const webhookHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const evt = request.body as WebhookEvent;
  
  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data;

    const full_name = `${first_name} ${last_name}`;
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: id,
        email: email_addresses[0]?.email_address,
        name: full_name,
        created_at: new Date().toISOString()
      })
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return reply.status(500).send({ error: 'Failed to create user' });
    }

    return reply.status(200).send(data);
  }

  if (evt.type === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data;

    const full_name = `${first_name} ${last_name}`;
    
    const { data, error } = await supabase
      .from('users')
      .update({
        name: full_name
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating user:', error);
      return reply.status(500).send({ error: 'Failed to update user' });
    }

    return reply.status(200).send(data);
  }

  if (evt.type === 'user.deleted') {
    const { id } = evt.data;
    
    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {  
      console.error('Error deleting user:', error);
      return reply.status(500).send({ error: 'Failed to delete user' });
    }

    return reply.status(200).send(data);
  }

  return reply.status(200).send({ received: true });
};