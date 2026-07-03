Feature: Fixed partner pairing
  As one half of a couple
  I want to pair with my partner once
  So that every nom is automatically shared between us

  # Pairing requires an account — a guest is prompted to sign in.
  Scenario: A guest is prompted to sign in to pair
    Given a visitor opens the partner page
    Then they are prompted to sign in to pair

  # A signed-in, unpaired user can invite their partner by email.
  @requires-deploy
  Scenario: A signed-in user can invite a partner
    Given the test user signs in
    When the test user opens the partner page
    Then they see the invite-a-partner form

  # QR is the primary path: a signed-in user sees their scannable code + scan button.
  @requires-deploy
  Scenario: A signed-in user can scan to pair
    Given the test user signs in
    When the test user opens the partner page
    Then they see their pairing QR code
    And a scan-partner-code button is available
