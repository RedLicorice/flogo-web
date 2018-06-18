import {FlowMetadata} from '@flogo/core/interfaces/flow';
import {Trigger, TriggerHandler, TriggerConfigureState} from '../../../core';
import {Tabs} from '../../../shared/tabs/models/tabs.model';
import { TriggerSchema } from '@flogo/core';

export interface TriggerConfiguration {
  handler: any;
  trigger: any;
  isValid: boolean;
  isDirty: boolean;
  changedMappings?: HandlerMappings;
  tabs: Tabs;
}

export interface HandlerMappings {
  actionMappings: { input: any[], output: any[] };
}

export interface TriggerDetail {
  handler: TriggerHandler;
  trigger: Trigger;
}

export interface ConfiguratorStatus {
  disableSave?: boolean;
  isOpen?: boolean;
  triggers?: TriggerStatus[];
  selectedTriggerId?: string;
}

export interface ModalStatus extends TriggerConfigureState {
  flowMetadata: FlowMetadata;
}

export interface SaveData {
  trigger: Trigger;
  mappings: HandlerMappings;
}

export interface TriggerStatus {
  id?: string;
  isValid?: boolean;
  isDirty?: boolean;
  name?: string;
}

export interface CurrentTriggerState {
  flowMetadata: FlowMetadata;
  schema: TriggerSchema;
  handler: TriggerHandler;
  trigger: Trigger;
  // todo: define
  fields: any;
}
