Feature: Get the app
  As a visitor
  I want to find how to install Noms
  So that I can run it on my phone

  Scenario: A visitor finds the TestFlight link
    Given a visitor opens the download page
    Then a TestFlight beta link is shown
