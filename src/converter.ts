import firebase from "firebase/compat/app";
import {
  AnyEntity,
  BaseEntityDefinition,
  StaticEntityClass,
} from "./entity_types";

export type DataRead = { data: any };

/**
 * This interface is used for communicating with the data store.
 * The idea is for this to provide write/read operations that are agnostic to the particular service that we use.
 */
export default interface DataConverterConnector {
  // TODO (sasha): change from any?
  // should this return : Entity?
  read<T extends AnyEntity>(
    id: string,
    entityClass: StaticEntityClass<T, BaseEntityDefinition>
  ): Promise<DataRead | undefined>;
  readAll<T extends AnyEntity>(
    entityClass: StaticEntityClass<T, BaseEntityDefinition>
  ): Promise<DataRead | undefined>;
  readMultiple<T extends AnyEntity>(
    ids: Array<string>,
    entityClass: StaticEntityClass<T, BaseEntityDefinition>
  ): Promise<{ [data: string]: Array<any> } | undefined>;
  write<T extends AnyEntity>(
    id: string,
    entityClass: StaticEntityClass<T, BaseEntityDefinition>,
    data: {}
  ): Promise<DataRead | undefined>;
  getFirebaseDocumentFromPath<T extends AnyEntity>(
    id: string,
    entityClass: StaticEntityClass<T, BaseEntityDefinition>
  ): firebase.firestore.DocumentReference;
}
