export interface Resume {
  id: string;
  raw_text: string;
  parsed_data: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  user_id: string;
}
