Feature: Restaurant search and rotation
  As someone deciding where to eat
  I want to search restaurants and save favorites
  So that I can build up a rotation to nominate from later

  # Guest-browsable: search works with no account. Results are REAL Google
  # Places data for the query, rendered as place cards.
  Scenario: A guest searches for restaurants
    Given a visitor opens the search page
    When they search for "pizza"
    Then at least one restaurant card is visible

  # Saving requires an account — a guest who tries to save is routed to sign-in.
  Scenario: A guest is prompted to sign in when saving a favorite
    Given a visitor opens the search page
    When they search for "pizza"
    And they tap add-to-rotation on the first result
    Then they land on the sign-in screen

  # Honest read of owner-auth data: a signed-in user's seeded rotation shows the
  # real saved restaurant name, not just a route change.
  @requires-deploy
  Scenario: A signed-in user sees a saved restaurant in their rotation
    Given the test user signs in
    When the test user opens their rotation
    Then a restaurant named "Zingerman's Delicatessen" is listed
