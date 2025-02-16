import dotenv from 'dotenv';
dotenv.config();
export const API_KEY_OPENAI = process.env.API_KEY_OPENAI!;
export const SUPABASE_URL = process.env.SUPABASE_URL!;
export const API_KEY_SUPABASE = process.env.API_KEY_SUPABASE!;
export const RESEND_API_KEY = process.env.RESEND_API_KEY!;
export const HUNTER_API_KEY = process.env.HUNTER_API_KEY;