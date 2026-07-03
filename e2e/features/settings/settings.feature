Feature: Settings — appearance
  As anyone using Noms
  I want to choose light or dark mode
  So that the app matches my preference

  # No account needed — theme is a device preference.
  Scenario: A visitor switches to dark mode
    Given a visitor opens the settings page
    When they choose the dark theme
    Then the app is in dark mode
    When they choose the light theme
    Then the app is in light mode

  # Account management is available to a signed-in user.
  @requires-deploy
  Scenario: A signed-in user sees their account controls
    Given the test user signs in
    When the test user opens the settings page
    Then their signed-in email is shown
    And a sign-out control is available
