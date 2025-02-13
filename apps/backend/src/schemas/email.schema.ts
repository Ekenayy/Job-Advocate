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
