import type { Locator, Page } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** Path this page lives at, relative to `baseURL`. */
  protected abstract readonly path: string;

  async goto(): Promise<void> {
    await this.page.goto(this.path);
  }

  protected button(name: string): Locator {
    return this.page.getByRole('button', { name });
  }

  protected link(name: string): Locator {
    return this.page.getByRole('link', { name });
  }

  protected heading(name: string): Locator {
    return this.page.getByRole('heading', { name });
  }
}
