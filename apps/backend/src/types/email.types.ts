export interface Email {
    id: number;
    user_id: string;
    advocate_id: number | null;
    to_email: string;
    subject: string;
    email_body: string;
    sent_at: string | null;
    status: EmailStatus;
    created_at: string;
    error_message?: string;
}

export type EmailStatus = 'pending' | 'sent' | 'failed' | 'delivered';

export interface CreateEmailInput {
    user_id: string;
    advocate_id: number | null;
    to_email: string;
    subject: string;
    email_body: string;
}

export interface SendEmailInput {
    email_id: number;
    status: EmailStatus;
    error_message?: string;
}

export interface UserInfo {
  name: string;
  email: string;
  role: string;
}
export interface AdvocateInfo {
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  role: string;
}
export interface EmailContent {
  subject: string;
  body: string;
}
export interface EmailRequest {
  from: UserInfo;
  to: AdvocateInfo;
  content: EmailContent;
}
export interface EmailResponse {
  success: boolean;
  data?: any;
  error?: any;
}
