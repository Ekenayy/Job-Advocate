import { Type } from '@sinclair/typebox';

export const jobInfoRequestSchema = Type.Object({
  pageContent: Type.String({
    description: 'The content of the job page to analyze'
  })
});

export const jobInfoResponseSchema = Type.Object({
  jobTitle: Type.String({
    description: 'The extracted job title'
  }),
  companyDomain: Type.String({
    description: 'The extracted company domain'
  }),
  companyBackground: Type.String({
    description: 'The extracted company background'
  }),
  jobRequirements: Type.String({
    description: 'The extracted job requirements'
  })
});