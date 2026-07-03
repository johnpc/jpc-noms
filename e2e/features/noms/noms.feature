Feature: Collaborative noms
  As one of a paired couple
  I want to build a shared nom and mark a pick
  So that we decide where to eat together and the car gets the address

  # Noms require an account.
  Scenario: A guest is prompted to sign in to see noms
    Given a visitor opens the noms page
    Then they are prompted to sign in to nominate

  # Honest read of the shared (multi-owner) nom + a real selection. The seeded
  # nom "Date night" has the test user as a member and one option.
  @requires-deploy
  Scenario: A member opens a shared nom and selects a restaurant
    Given the test user signs in
    When the test user opens the noms page
    Then the shared nom "Date night" is listed
    When the test user opens the "Date night" nom
    Then a restaurant option is shown
    When the test user selects the first option
    Then the nom shows it is selected
