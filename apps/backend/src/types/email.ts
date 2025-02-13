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
