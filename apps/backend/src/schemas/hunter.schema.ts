import { Type } from '@sinclair/typebox'

export const hunterSearchQuerySchema = Type.Object({
  domain: Type.String(),
  jobTitle: Type.String()
})

export const hunterEmployeeSchema = Type.Object({
  first_name: Type.String(),
  last_name: Type.String(),
  position: Type.String(),
  seniority: Type.String(),
  email: Type.String(),
  linkedin_url: Type.Optional(Type.String())
})

export const hunterSearchResponseSchema = Type.Array(hunterEmployeeSchema)