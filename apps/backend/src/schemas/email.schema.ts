import { Static, Type } from '@sinclair/typebox';

export const CreateEmailSchema = Type.Object({
    user_id: Type.String(),
    advocate_id: Type.Optional(Type.Number()),
    to_email: Type.String(),
    subject: Type.String({ maxLength: 255 }),
    email_body: Type.String(),
    status: Type.String({ enum: ['pending', 'sent', 'failed', 'delivered'] }),
});

export type CreateEmailSchemaType = Static<typeof CreateEmailSchema>;

// Define schemas for request validation
const UserInfoSchema = Type.Object({
  name: Type.String(),
  email: Type.String({ format: 'email' }),
});

const AdvocateInfoSchema = Type.Object({
  first_name: Type.String(),
  last_name: Type.String(),
  email: Type.String({ format: 'email' }),
});

const EmailContentSchema = Type.Object({
  subject: Type.String(),
  body: Type.String()
});

export const EmailRequestSchema = Type.Object({
  from: UserInfoSchema,
  to: AdvocateInfoSchema,
  content: EmailContentSchema
});

export type EmailRequestSchemaType = Static<typeof EmailRequestSchema>;

const QualificationsSchema = Type.Object({
  skills: Type.Optional(Type.Array(Type.String())),
  experience: Type.Optional(Type.Array(Type.Object({}))),
  education: Type.Optional(Type.Array(Type.Object({}))),
});

export const GenerateAIEmailSchema = Type.Object({
  companyBackground: Type.Optional(Type.String()),
  personBackground: Type.Optional(Type.Union([
    Type.String(),
    Type.Object({})
  ])),
  myQualifications: Type.Optional(QualificationsSchema),
  jobRequirements: Type.Optional(Type.String())
});

export type GenerateAIEmailType = Static<typeof GenerateAIEmailSchema>;