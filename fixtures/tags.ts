import type { DeploymentEnv } from './env';

/**
 * Tags decide which project runs a test.
 */
export const PUBLIC = ['@public'];
export const PRIVATE = ['@private'];
export const ONBOARDING = ['@onboarding'];

/** Reads only. Safe to run anywhere, including production. */
/**
 * Launches something and spends the project's credits. Gated behind the credits
 * setup, so a lab that cannot pay stops these and leaves the rest running.
 */
export const PRIVATE_SPENDS = [...PRIVATE, '@spends'];

export const PUBLIC_READONLY = [...PUBLIC, '@readonly'];
export const PRIVATE_READONLY = [...PRIVATE, '@readonly'];
export const ONBOARDING_READONLY = [...ONBOARDING, '@readonly'];

export const STAGING_ONLY = '@staging';
export const PRODUCTION_ONLY = '@production';

/** The tag a run must not pick up, being the other deployment's. */
export function excludedEnvironmentTag(env: DeploymentEnv): RegExp {
  return env === 'production' ? /@staging\b/ : /@production\b/;
}
