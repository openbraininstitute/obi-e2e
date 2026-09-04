/** Checks the backend services before anything else runs. */

import { checkAllServices, formatStatusTable } from '@api/health';
import { services } from '@api/services';
import { resetCreditReport } from '@fixtures/credit-report';
import { expect, test as setup } from '@playwright/test';

setup('backend services are healthy', async () => {
  resetCreditReport();

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

  await Bun.write('test-results/services.json', `${JSON.stringify({ services: rows }, null, 2)}\n`);

  expect(
    unhealthy,
    `These backend services are not healthy, so the run would fail for reasons that are not the application under test:\n${formatStatusTable(unhealthy)}`
  ).toEqual([]);
});
