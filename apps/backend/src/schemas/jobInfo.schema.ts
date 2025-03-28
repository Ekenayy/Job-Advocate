import { Type } from '@sinclair/typebox';

export const jobInfoRequestSchema = Type.Object({
  pageContent: Type.String({
    description: 'The content of the job page to analyze'
  }),
  pageUrl: Type.Optional(Type.String({
    description: 'The URL of the job page to analyze'
  })),
  currentDomain: Type.Optional(Type.String({
    description: 'The current domain of the job page to analyze'
  })),
  domainHints: Type.Optional(Type.Object({
    links: Type.Optional(Type.Array(Type.String())),
    emails: Type.Optional(Type.Array(Type.String())),
    metaTags: Type.Optional(Type.Object({})),
    socialProfiles: Type.Optional(Type.Array(Type.String())),
    hostingPlatform: Type.Optional(Type.String())
  }))
});

export const jobInfoResponseSchema = Type.Object({
  jobTitle: Type.String({
    description: 'The extracted job title'
  }),
  companyName: Type.String({
    description: 'The extracted company name'
  }),
  companyDomain: Type.String({
    description: 'The extracted company domain'
  }),
  companyBackground: Type.String({
    description: 'The extracted company background'
  }),
  jobRequirements: Type.String({
    description: 'The extracted job requirements'
  }),
  potentialAdvocates: Type.Array(Type.String(), {
    description: 'The potential advocates for the job'
  })
});