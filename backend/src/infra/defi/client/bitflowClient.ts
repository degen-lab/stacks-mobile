import { BitflowSDK } from '@bitflowlabs/core-sdk';
import {
  BITFLOW_API_HOST,
  BITFLOW_API_KEY,
  KEEPER_API_HOST,
  KEEPER_API_KEY,
  READONLY_CALL_API_HOST,
} from '../../../shared/constants';

export const bitflowClient = new BitflowSDK({
  BITFLOW_API_HOST,
  BITFLOW_API_KEY,
  READONLY_CALL_API_HOST,
  KEEPER_API_KEY,
  KEEPER_API_HOST,
});
