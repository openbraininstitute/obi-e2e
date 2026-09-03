/**
 * Tags decide which project runs a test.
 */
export const PUBLIC = ['@public'];
export const PRIVATE = ['@private'];
export const ONBOARDING = ['@onboarding'];

/** Reads only. Safe to run anywhere, including production. */
export const PUBLIC_READONLY = [...PUBLIC, '@readonly'];
export const PRIVATE_READONLY = [...PRIVATE, '@readonly'];
export const ONBOARDING_READONLY = [...ONBOARDING, '@readonly'];

/** Also runs against production on the daily schedule. */
export const PUBLIC_SMOKE = [...PUBLIC, '@smoke', '@readonly'];
export const PRIVATE_SMOKE = [...PRIVATE, '@smoke', '@readonly'];
