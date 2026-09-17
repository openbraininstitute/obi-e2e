import type { Page } from '@playwright/test';

/** A project's home page, where the assistant is opened from. */
export function projectRoute(labId: string, projectId: string): string {
  return `/app/virtual-lab/${labId}/${projectId}`;
}

export function assistant(page: Page) {
  const question = page.getByTestId('ai-chat-input');

  return {
    open: page.getByTestId('ai-assistant-open-button'),
    collapse: page.getByTestId('ai-assistant-collapse-button'),

    heading: page.getByRole('heading', { name: 'OBI Assistant' }),
    question,
    invitation: page.getByPlaceholder('What would you like to do?'),
    send: page.getByTestId('ai-assistant-send-button'),

    newChat: page.getByTestId('ai-assistant-new-chat-button'),
    history: page.getByTestId('ai-assistant-history-button'),
  };
}

/** The suggested prompt text, scoped to the assistant's own suggestion list. */
export async function suggestions(page: Page): Promise<string[]> {
  return page
    .getByTestId('ai-assistant-suggestions')
    .getByTestId('ai-assistant-suggestion')
    .allTextContents();
}
