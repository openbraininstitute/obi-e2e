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

/**
 * A short subset for a quick check, run with `bun run test:smoke`.
 *
 * This used to decide what production ran, which was the wrong thing to hang
 * it on: whether a test is fast has nothing to do with which deployment offers
 * the feature it covers. Every test now runs against both deployments, and the
 * two tags below are how a test says otherwise.
 */
export const PUBLIC_SMOKE = [...PUBLIC, '@smoke', '@readonly'];
export const PRIVATE_SMOKE = [...PRIVATE, '@smoke', '@readonly'];

/**
 * A test that belongs to one deployment only.
 *
 * The default is both: a test says nothing about deployments and runs
 * everywhere, which is what almost every test wants. These are for the few that
 * cannot — a feature that has not reached production yet, or one kept off it on
 * purpose. The config excludes the other deployment's tag, so this works from a
 * local run as well as from CI.
 *
 * A scan-config workflow does not use these. Its fixture's `env` list is the
 * only thing that decides where it runs, because whether a deployment offers a
 * workflow is a fact about the release rather than about the test.
 */
export const STAGING_ONLY = '@staging';
export const PRODUCTION_ONLY = '@production';

/** The tag a run must not pick up, being the other deployment's. */
export function excludedEnvironmentTag(env: DeploymentEnv): RegExp {
  return env === 'production' ? /@staging\b/ : /@production\b/;
}
