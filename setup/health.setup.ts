import { expect, test as setup } from '@playwright/test';

import { checkAllServices, formatStatusTable } from '../api/health';
import { services } from '../api/services';

/**
 * Runs before every other project. A service that is down produces one clear
 * failure here instead of a suite full of unexplained test failures.
 */
setup('backend services are healthy', async () => {
  const statuses = await checkAllServices();
  const unhealthy = statuses.filter((status) => !status.healthy);

  const skipped = services().filter((service) => service.vpcOnly);
  console.log(
    [
      formatStatusTable(statuses),
      ...skipped.map((service) => `  skip  ${service.label}  reachable only inside the VPC`),
    ].join('\n')
  );

  expect(
    unhealthy,
    `These backend services are not healthy, so the run would fail for reasons that are not the application under test:\n${formatStatusTable(unhealthy)}`
  ).toEqual([]);
});
