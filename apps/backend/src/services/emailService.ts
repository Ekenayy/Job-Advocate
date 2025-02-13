import { Resend } from "resend";
import { RESEND_API_KEY } from "../constants";
import { EmailRequest, EmailResponse } from "../types/email";

const resend = new Resend(RESEND_API_KEY);

export const sendEmail = async (
  request: EmailRequest
): Promise<EmailResponse> => {
  const { from, to, content } = request;

  try {
    const { data, error } = await resend.emails.send({
      // this will be the user's email address
      from: "onboarding@resend.dev",
      // this will be the advocate's email address
      to: [`${to.first_name} ${to.last_name} <${to.email}>`],
      // this will be the ai generated subject line
      subject: content.subject,
      // this will be the ai generated / user edited email body
      html: `
    ${content.body}
    <br/>
        <p>Best regards,</p>
        <p>${from.name}</p>
    `,
    });

    return {
      success: true,
      data: data,
      error: error,
    };
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
};
