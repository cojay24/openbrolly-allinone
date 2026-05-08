/**
 * @openbrolly/firebase
 *
 * Client-safe exports only. For the Admin SDK import from '@openbrolly/firebase/admin'.
 * For TypeScript types import from '@openbrolly/firebase/types'.
 */
export { getDb, getStorageInstance, getAuthInstance } from './client'
export type {
  Client,
  BrandConfig,
  FieldDefinition,
  FieldSchema,
  FieldType,
  Location,
  LocationStatus,
  Enquiry,
  EnquiryType,
  EnquiryStatus,
} from './types'
