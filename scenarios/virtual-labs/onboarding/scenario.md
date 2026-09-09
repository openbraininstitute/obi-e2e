# Onboarding user enters and configures a virtual lab

User: onboarding

The onboarding auth setup performs the real sign-in before these browser cases
run. The first case verifies that an authenticated onboarding session can enter
the application after visiting the public home and login routes.

## Onboarding user reaches the authenticated application after opening the home page

Page: `/`

Steps:

1. Open the home page
2. Open the login route

Expected:

- The authenticated onboarding user is redirected into a virtual lab workspace
- The current virtual lab and first project are visible
- The user profile control is visible

## Onboarding user creates a project in the virtual lab

Page: `/app/virtual-lab/sync`

Steps:

1. Open the current project menu
2. Click "Add project"
3. Enter a run-specific project name and description
4. Click "Create project"

Expected:

- The new project becomes the current project
- The project is recorded for onboarding-only cleanup

## Onboarding user opens the project invitation form

Steps:

1. Click "Add member"

Expected:

- The "Invite new members to virtual lab" form is visible
- "Add member" and "Send" are visible

## Onboarding user opens the virtual lab administrator invitation controls

Steps:

1. Open the virtual lab menu
2. Open the "Administrators" tab
3. Click "Add administrator"

Expected:

- The team members section is visible
- An email field and "Send" action are visible for adding an administrator

## Onboarding user reaches the credit verification gate

Steps:

1. Click "Buy credits"
2. Choose "Purchase Credits"

Expected:

- The "Verify your email to continue" dialog is visible
- The dialog asks for the reference email
- The "Send verification email" action is visible

## Onboarding user can open subscription settings

Steps:

1. Open the user profile menu
2. Open subscription settings

Expected:

- The account subscription section is visible
- The current "Free account" state is visible
- The "Change subscription" action is visible
