describe('Smoke', () => {
  it('shows login page', () => {
    cy.visit('/login')
    cy.contains('Login')
  })
})
