import { ItemSubflow } from '@flogo/core';
import { PayloadOf, getItem } from '../../utils';
import { FlowState } from '../flow.state';
import { CommitItemConfiguration } from '../flow.actions';
import { subflowSchemaUpdate } from './subflow-schema-update';
import { getLinkedSubflow } from './get-linked-subflow';
import { itemUpdate } from './item-update';
import { removeSubschemaIfNotUsed } from '@flogo/flow/core/state/flow/cases/remove-subschema';

export function commitTaskConfiguration(state: FlowState, payload: PayloadOf<CommitItemConfiguration>) {
  const { handlerType, item: { id: itemId } } = payload;
  const oldLinkedSubflowId = getLinkedSubflow(getItem(state, handlerType, itemId) as ItemSubflow);
  state = itemUpdate(state, payload);
  state = subflowSchemaUpdate(state, payload);
  const newLinkedSubflowId = getLinkedSubflow(getItem(state, handlerType, itemId) as ItemSubflow);
  if (oldLinkedSubflowId !== newLinkedSubflowId) {
    state = removeSubschemaIfNotUsed(state, oldLinkedSubflowId);
  }
  return state;
}
