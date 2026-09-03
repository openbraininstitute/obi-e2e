import { BasePage } from './base.page';

export class HomePage extends BasePage {
  protected readonly path = '/';

  readonly heroHeading = this.page.getByRole('heading', {
    level: 1,
    name: /Create your Virtual Lab/i,
  });

  // Desktop and mobile navigation both render "Login", so this matches three times.
  readonly loginLink = this.link('Login').first();

  readonly virtualLabsLink = this.page.getByRole('link', { name: /Go to\s+Virtual Labs/i });
}
