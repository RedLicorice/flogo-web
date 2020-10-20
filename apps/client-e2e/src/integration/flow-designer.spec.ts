import { createApp, visitApp } from '../utils';
import { generateRandomString } from '../utils';

describe('flogo web flow designer', () => {
  before(() => {
    visitApp();
    createApp();
    createAFlow();
  });

  it('should add resource input and output', () => {
    cy.get('[data-cy=flow-schema-button]').click();
    cy.get('[data-cy=flow-resource-input-row]').eq(0).within(() => {
      cy.get('[data-cy=flow-resource-input]').type('input1');
    })
    cy.get('[data-cy=flow-resource-add-input-btn]').click();
    cy.get('[data-cy=flow-resource-input-row]').eq(1).within(() => {
      cy.get('[data-cy=flow-resource-input]').type('input2');
      cy.get('[data-cy=resource-type-dropdown-toggle]').click();
      cy.get('[data-cy=resource-type-dropdown]').contains('object').click();
    })
    cy.get('[data-cy=flow-resource-output-tab]').click();
    cy.get('[data-cy=flow-resource-output-row]').eq(0).within(() => {
      cy.get('[data-cy=flow-resource-input]').type('output1');
    })
    cy.get('[data-cy=flow-resource-add-output-btn]').click();
    cy.get('[data-cy=flow-resource-output-row]').eq(1).within(() => {
      cy.get('[data-cy=flow-resource-input]').type('output2');
      cy.get('[data-cy=resource-type-dropdown-toggle]').click();
      cy.get('[data-cy=resource-type-dropdown]').contains('boolean').click();
    })
    cy.get('[data-cy=flow-resource-input-modal-save]').click();
  })
});

const createAFlow = (flowName = generateRandomString()) => {
  cy.get('[data-cy=app-detail-create-resource]').click();
  cy.get('[data-cy=add-new-resource-name]').type(flowName);
  cy.get('[data-cy=add-new-resource-create-btn]').click();
  cy.contains(flowName).click();
}
