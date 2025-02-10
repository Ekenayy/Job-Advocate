import { createClient } from "@supabase/supabase-js";
import { API_KEY_SUPABASE, SUPABASE_URL } from "../constants/index";

export const supabase = createClient(SUPABASE_URL, API_KEY_SUPABASE);

export default supabase;