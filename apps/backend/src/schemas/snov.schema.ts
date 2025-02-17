import { Type } from "@sinclair/typebox";

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
});

export const snovSearchResponseSchema = Type.Array(snovEmployeeSchema);
