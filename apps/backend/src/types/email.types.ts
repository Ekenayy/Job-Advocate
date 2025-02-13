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