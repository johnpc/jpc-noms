Feature: Dining stats & history
  As one of a paired couple
  I want to see the restaurants we've decided on
  So that we remember where we've eaten

  # Stats require an account.
  Scenario: A guest is prompted to sign in for stats
    Given a visitor opens the stats page
    Then they are prompted to sign in for stats

  # Honest read: the seeded SELECTED nom "Last Friday" shows a real decision +
  # the restaurant that won (Zingerman's Delicatessen).
  @requires-deploy
  Scenario: A member sees their decision history
    Given the test user signs in
    When the test user opens the stats page
    Then a decided nom "Last Friday" is listed
    And the winning restaurant "Zingerman's Delicatessen" is shown
