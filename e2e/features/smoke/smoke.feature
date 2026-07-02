Feature: App shell (guest)
  As anyone opening Noms
  I want the home shell to load without an account
  So that I can start finding a restaurant before signing in

  # Guest-browsable smoke check: the app boots, redirects root -> /home, and
  # renders the real home actions (search + sign-in) with no auth required.
  Scenario: A visitor lands on the home shell
    Given a visitor opens the app at the root
    Then they are taken to the home shell
    And a link to find a restaurant is visible
    And a prompt to sign in to nominate is visible
