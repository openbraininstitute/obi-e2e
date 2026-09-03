import { checkAllServices, formatStatusTable } from '@api/health';
import { services } from '@api/services';
import { expect, test as setup } from '@playwright/test';

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

  const rows = [
    ...statuses.map((status) => ({
      key: status.service.key,
      label: status.service.label,
      version: status.version,
      status: status.healthy ? ('healthy' as const) : ('down' as const),
      problem: status.problem,
    })),
    ...skipped.map((service) => ({
      key: service.key,
      label: service.label,
      status: 'skipped' as const,
      problem: 'reachable only inside the VPC',
    })),
  ];

  // Written before the assertion so a down service still reaches the Teams
  // card. Bun.write creates test-results on the way.
  await Bun.write('test-results/services.json', `${JSON.stringify({ services: rows }, null, 2)}\n`);

  expect(
    unhealthy,
    `These backend services are not healthy, so the run would fail for reasons that are not the application under test:\n${formatStatusTable(unhealthy)}`
  ).toEqual([]);
});
