import { supabase } from './supabaseClient';

export const resumeService = {
  createResume: async (resumeData: any, user_id: string, raw_text: string) => {
    try {
      console.log('Creating resume for user:', user_id);
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
  
  deleteResume: async (resumeId: number) => {
    try {
      console.log('Deleting resume with ID:', resumeId);
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', resumeId);
        
      if (error) {
        console.error('Error deleting resume:', error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting resume:', error);
      throw error;
    }
  },
  
  deleteMultipleResumes: async (resumeIds: number[]) => {
    try {
      if (resumeIds.length === 0) return true;
      
      console.log(`Deleting ${resumeIds.length} resumes with IDs:`, resumeIds);
      const { error } = await supabase
        .from('resumes')
        .delete()
        .in('id', resumeIds);
        
      if (error) {
        console.error('Error deleting multiple resumes:', error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting multiple resumes:', error);
      throw error;
    }
  },
  
  updateResume: async (resumeData: any, user_id: string, raw_text: string) => {
    try {
      // First check if user has any resumes
      console.log('Checking for existing resumes for user:', user_id);
      const { data: existingResumes, error: fetchError } = await supabase
        .from('resumes')
        .select('id, created_at')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        console.error('Error fetching existing resumes:', fetchError);
        throw fetchError;
      }

      console.log(`Found ${existingResumes?.length || 0} existing resumes`);
      
      // If user has resumes
      if (existingResumes && existingResumes.length > 0) {
        // Keep the most recent resume and delete others if there are multiple
        if (existingResumes.length > 1) {
          console.log(`Cleaning up ${existingResumes.length - 1} older resumes`);
          const mostRecentId = existingResumes[0]?.id;
          const idsToDelete = existingResumes.slice(1).map(resume => resume.id);
          
          // Delete older resumes using the dedicated function
          try {
            await resumeService.deleteMultipleResumes(idsToDelete);
          } catch (deleteError) {
            console.error('Error during cleanup of older resumes:', deleteError);
            // Continue with update even if delete fails
          }
          
          // Update the most recent resume
          const { data, error } = await supabase
            .from('resumes')
            .update({
              parsed_data: resumeData, 
              raw_text: raw_text,
              updated_at: new Date().toISOString()
            })
            .eq('id', mostRecentId)
            .select(`*`)
            .single();
            
          if (error) {
            console.error('Error updating resume:', error);
            throw error;
          }
          
          return data;
        } 
        // If only one resume exists, just update it
        else {
          const { data, error } = await supabase
            .from('resumes')
            .update({
              parsed_data: resumeData, 
              raw_text: raw_text,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingResumes[0]?.id)
            .select(`*`)
            .single();
            
          if (error) {
            console.error('Error updating resume:', error);
            throw error;
          }
          
          return data;
        }
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
      // Get the most recent resume for this user
      const { data, error } = await supabase
        .from('resumes')
        .select(`*`)
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(1)
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