import { supabase } from './supabaseClient';

export const resumeService = {
  createResume: async (resumeData: any, user_id: string, raw_text: string) => {
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
  },
  
  updateResume: async (resumeData: any, user_id: string, raw_text: string) => {
    try {
      // First check if user already has a resume
      const { data: existingResume, error: fetchError } = await supabase
        .from('resumes')
        .select('id')
        .eq('user_id', user_id)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching existing resume:', fetchError);
        throw fetchError;
      }
      
      // If resume exists, update it
      if (existingResume) {
        const { data, error } = await supabase
          .from('resumes')
          .update({
            parsed_data: resumeData, 
            raw_text: raw_text,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingResume.id)
          .select(`*`)
          .single();
          
        if (error) {
          console.error('Error updating resume:', error);
          throw error;
        }
        
        return data;
      } 
      // If no resume exists, create a new one
      else {
        return await resumeService.createResume(resumeData, user_id, raw_text);
      }
    } catch (error) {
      console.error('Error updating resume:', error);
      throw error;
    }
  },
  
  getResumeByUserId: async (user_id: string) => {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select(`*`)
        .eq('user_id', user_id)
        .single();
        
      if (error) {
        console.error('Error fetching resume:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching resume:', error);
      throw error;
    }
  }
};