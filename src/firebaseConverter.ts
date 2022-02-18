import firebase from "firebase/compat/app";
import "firebase/functions";
import DataConverterConnector, { DataRead } from "./converter";
import {
  AnyEntity,
  BaseEntityDefinition,
  StaticEntityClass,
} from "./entity_types";
import { NotImplementedError } from "./errors";

export default class FirebaseConverter implements DataConverterConnector {
  // TODO: how do we serialize?
  // TODO : how do we add filters?
  // should this return : Entity?
  async read<T extends AnyEntity>(
    id: string,
    entityClass: StaticEntityClass<T, BaseEntityDefinition>
  ): Promise<DataRead | undefined> {
    const collection = entityClass.definition.collection;
    try {
      return await firebase.functions().httpsCallable("readEntity")({
        id,
        collection,
      });
    } catch (error) {
      console.warn(
        `Error executing read for id "${id}" of class "${entityClass}"`,
        error
      );
      return undefined;
    }
  }

  async readMultiple<T extends AnyEntity>(
    ids: Array<string>,
    entityClass: StaticEntityClass<T, BaseEntityDefinition>
  ): Promise<{ [data: string]: Array<any> } | undefined> {
    const collection = entityClass.definition.collection;
    try {
      if (!ids) {
        return undefined;
      }
      return (await firebase.functions().httpsCallable("readMultipleEntities")({
        ids,
        collection,
      })) as unknown as { [data: string]: Array<any> };
    } catch (error) {
      console.warn(
        `Error executing readMultiple for ids "${ids}" of class "${entityClass}"`,
        error
      );
      return undefined;
    }
  }

  async readAll<T extends AnyEntity>(
    entityClass: StaticEntityClass<T, BaseEntityDefinition>
  ): Promise<never> {
    throw new NotImplementedError("readAll");
  }

  // TODO: remove entity as a parameter for something more generic? removes tight coupling
  async write<T extends AnyEntity>(
    id: string,
    entityClass: StaticEntityClass<T, BaseEntityDefinition>,
    data: {}
  ): Promise<DataRead | undefined> {
    const writeFunction = firebase.functions().httpsCallable("writeEntity");
    const collection = entityClass.definition.collection;

    try {
      return await writeFunction({
        id,
        collection,
        data,
      });
    } catch (error) {
      console.error(
        `Error executing write for id "${id}" of class "${entityClass}"`,
        error
      );
      return undefined;
    }
  }

  getFirebaseDocumentFromPath<T extends AnyEntity>(
    id: string,
    entityClass: StaticEntityClass<T, BaseEntityDefinition>
  ): firebase.firestore.DocumentReference {
    const collection = entityClass.definition.collection;
    return firebase.firestore().doc(`${collection}/${id}`);
  }
}
