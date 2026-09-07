/** Tags that say how a test runs. See docs/scenario-tags.md. */

import type { DeploymentEnv } from './run/env';

/** Signed out: the pages anyone reaches without an account. */
export const VISITOR = ['@public'];

/** Signed in as the primary user, inside the project the run made for itself. */
export const AUTHENTICATED = ['@private'];

/**
 * Signed in, and it launches something the project pays for.
 *
 * Carries `@private` too, so the authenticated project can leave it out and the
 * credits project can pick it up: a test that spends waits for a funded project.
 */
export const CREDITS = [...AUTHENTICATED, '@credits'];

/** Signed in as the second user, who owns nothing: signing up, and what follows. */
export const ONBOARDING = ['@onboarding'];

/** A run too long for the nightly suite; it has a job of its own. */
export const SLOW = '@slow';

export const STAGING_ONLY = '@staging';
export const PRODUCTION_ONLY = '@production';

/** The tag to skip on this deployment. */
export function excludedEnvironmentTag(env: DeploymentEnv): RegExp {
  return env === 'production' ? /@staging\b/ : /@production\b/;
}
