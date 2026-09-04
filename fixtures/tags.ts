/** Tags that say how a test runs. See docs/scenario-tags.md. */

import type { DeploymentEnv } from './env';

export const PUBLIC = ['@public'];
export const PRIVATE = ['@private'];
export const ONBOARDING = ['@onboarding'];

export const PRIVATE_SPENDS = [...PRIVATE, '@spends'];

export const PUBLIC_READONLY = [...PUBLIC, '@readonly'];
export const PRIVATE_READONLY = [...PRIVATE, '@readonly'];
export const ONBOARDING_READONLY = [...ONBOARDING, '@readonly'];

export const STAGING_ONLY = '@staging';
export const PRODUCTION_ONLY = '@production';

/** The tag to skip on this deployment. */
export function excludedEnvironmentTag(env: DeploymentEnv): RegExp {
  return env === 'production' ? /@staging\b/ : /@production\b/;
}
