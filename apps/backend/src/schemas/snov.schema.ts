import { Static, Type } from "@sinclair/typebox";

export const snovEmployeeSchema = Type.Object({
  first_name: Type.String(),
  last_name: Type.String(),
  position: Type.String(),
  source_page: Type.String(),
  email: Type.String(),
});

export const snovSearchQuerySchema = Type.Object({
  domain: Type.String(),
  jobTitle: Type.String(),
  potentialAdvocates: Type.Array(Type.String(), {
    description: 'The potential advocates for the job'
  })
});

export type snovSearchQuerySchemaType = Static<typeof snovSearchQuerySchema>;


export const snovSearchResponseSchema = Type.Array(snovEmployeeSchema);
