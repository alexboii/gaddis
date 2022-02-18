import DataConverterConnector from "./converter";
import { EDGE_FIELD } from "./database_constants";
import {
  AnyEntity,
  BaseEntityDefinition,
  StaticEntityClass,
} from "./entity_types";
import { EntityDoesNotFollowCorrectEdgeStructure } from "./errors";
import FirebaseConverter from "./firebaseConverter";

export default class EntityFactory {
  static converter: DataConverterConnector = new FirebaseConverter();

  static async fetchEntity<T extends AnyEntity>(
    entityId: string,
    entityClass: StaticEntityClass<T, BaseEntityDefinition>
  ): Promise<T | undefined> {
    const data = (await EntityFactory.converter.read(entityId, entityClass))
      ?.data;

    if (!data) {
      return undefined;
    }

    if (!data[EDGE_FIELD]) {
      throw new EntityDoesNotFollowCorrectEdgeStructure(entityId, entityClass);
    }

    return EntityFactory.deserializeEntity(data, entityClass);
  }

  static async fetchEntities<T extends AnyEntity>(
    ids: string[],
    entityClass: StaticEntityClass<T, BaseEntityDefinition>
  ): Promise<T[]> {
    const dataArray =
      (await EntityFactory.converter.readMultiple(ids, entityClass))?.data ??
      [];

    return dataArray.map((data) =>
      EntityFactory.deserializeEntity(data, entityClass)
    );
  }

  static deserializeEntity<T extends AnyEntity>(
    data: any,
    entityClass: StaticEntityClass<T, BaseEntityDefinition>
  ): T {
    const { id, [EDGE_FIELD]: edges, ...fields } = data;
    return new entityClass(id, fields, edges);
  }
}
