import { Type, Static } from '@sinclair/typebox';

export const OnboardingProfileSchema = Type.Object({
  jobTitle: Type.Optional(Type.String()),
  user_id: Type.String(),
  resume: Type.Optional(Type.Object({
    filename: Type.String(),
    mimetype: Type.String(),
    data: Type.Any()
  }))
});

export type OnboardingProfileType = Static<typeof OnboardingProfileSchema>;