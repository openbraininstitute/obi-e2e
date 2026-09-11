# OBI Assistant

The assistant panel a project carries. It opens over the page the user is on and
takes a question in plain English.

Asking it something costs credits and depends on the AI service being up, so
these tests only check that the panel opens and is ready to be asked.

User: authenticated

## Open the assistant panel

Precondition:

1. Inside my project

Steps:

1. Open the assistant

Expected:

- The panel is headed "OBI Assistant"
- There is a box to type a question into
- The box invites the user to say what they would like to do
- There is a way to send the question

## The panel suggests questions to start from

After: Open the assistant panel

Steps:

1. Look at what the panel offers

Expected:

- At least one question is suggested
- Every suggestion has text
- Past chats can be reached through "History"
- A new chat can be started through "New Chat"

## Close the assistant panel

After: Open the assistant panel

Steps:

1. Click "Collapse"

Expected:

- The box to type a question into is gone
- The page underneath is still showing
