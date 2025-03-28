import { FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../services/supabaseClient';
import { WebhookEvent } from '@clerk/backend';
import clerkClient from '../services/clerkClient';

export const webhookHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const evt = request.body as WebhookEvent;
  
  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data;

    const full_name = `${first_name} ${last_name}`;
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        clerk_id: id,
        email: email_addresses[0]?.email_address,
        name: full_name,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return reply.status(500).send({ error: 'Failed to create user' });
    }

    const userData = data as { id: string };
    
    const updatedUser = await clerkClient.users.updateUser(id, {
      externalId: userData.id,
      publicMetadata: {
        subscribed: false,
        tier: 'free',
      },
    })

    if (!updatedUser) {
      console.error('Failed to update user');
      // return reply.status(500).send({ error: 'Failed to update user' });
    }

    return reply.status(200).send(data);
  }

  if (evt.type === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data;

    const full_name = `${first_name} ${last_name}`;
    
    const { data, error } = await supabase
      .from('users')
      .update({
        name: full_name,
        email: email_addresses[0]?.email_address
      })
      .eq('clerk_id', id);

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
      .eq('clerk_id', id)
      .select()
      .single();

    if (error) {  
      console.error('Error deleting user:', error);
      return reply.status(500).send({ error: 'Failed to delete user' });
    }

    console.log('user deleted', data);
    return reply.status(200).send(data);
  }

  return reply.status(200).send({ received: true });
};