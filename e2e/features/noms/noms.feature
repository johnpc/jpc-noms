Feature: Collaborative noms
  As one of a paired couple
  I want to build a shared nom and mark a pick
  So that we decide where to eat together and the car gets the address

  # Noms require an account.
  Scenario: A guest is prompted to sign in to see noms
    Given a visitor opens the noms page
    Then they are prompted to sign in to nominate

  # The primary screen is "Today's nom": a guest is prompted to sign in.
  Scenario: A guest is prompted to sign in on the Today screen
    Given a visitor opens the today page
    Then they are prompted to sign in on the today screen

  # You don't need a partner to start a nom — a signed-in user can always create.
  @requires-deploy
  Scenario: A signed-in user can start a nom without a partner
    Given the test user signs in
    When the test user opens the noms page
    Then the start-a-nom control is available

  # Honest read of the shared (multi-owner) nom + a real selection. The seeded
  # open nom has the test user as a member and one option. Noms are dated (not
  # named), so the list is read by row presence and the nom by its options.
  @requires-deploy
  Scenario: A member opens a shared nom and selects a restaurant
    Given the test user signs in
    When the test user opens the noms page
    Then a shared nom is listed
    When the test user opens the first nom
    Then a restaurant option is shown
    When the test user selects the first option
    Then the nom shows it is selected
