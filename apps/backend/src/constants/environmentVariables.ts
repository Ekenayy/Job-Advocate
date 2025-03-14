import dotenv from 'dotenv';
dotenv.config();
export const API_KEY_OPENAI = process.env.API_KEY_OPENAI!;
export const SUPABASE_URL = process.env.SUPABASE_URL!;
export const API_KEY_SUPABASE = process.env.API_KEY_SUPABASE!;
export const RESEND_API_KEY = process.env.RESEND_API_KEY!;
// export const HUNTER_API_KEY = process.env.HUNTER_API_KEY;
export const SNOV_CLIENT_ID = process.env.SNOV_CLIENT_ID;
export const SNOV_CLIENT_SECRET = process.env.SNOV_CLIENT_SECRET;
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
export const CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY!;
export const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY!;
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
export const WEB_URL = process.env.WEB_URL!;
export const YEARLY_PRICE_ID = process.env.YEARLY_PRICE_ID!;
export const MONTHLY_PRICE_ID = process.env.MONTHLY_PRICE_ID!;
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;