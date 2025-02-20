export interface Resume {
  raw_text: string;
  parsed_data: Record<string, unknown>;  // Flexible JSON object with dynamic keys
  created_at: string;
  user_id: string;
  id: string;
}
