import { EntityCollection } from "./database_constants";
import { BackEdge, Edge, Edges } from "./edges";
import Entity from "./entity";
import { AnyFieldValue, Fields } from "./fields";
import { Privacy } from "./privacy";

export type BaseEntityDefinition = EntityDefinition<
  EntityCollection,
  Fields<string, AnyFieldValue>,
  Edges<string, Edge, BackEdge>
>;

export type EntityDefinition<
  TEntityCollection extends EntityCollection,
  TFields extends Fields<string, AnyFieldValue>,
  TEdges extends Edges<string, Edge, BackEdge>
> = {
  collection: TEntityCollection;
  privacy: Privacy;
  fields: TFields;
  edges: TEdges;
};

export type AnyEntityClass = StaticEntityClass<AnyEntity, BaseEntityDefinition>;
export type AnyEntity = Entity<BaseEntityDefinition>;

export type StaticEntityClass<
  TEntity,
  TEntityDefinition extends BaseEntityDefinition
> = {
  new (id?: string, fieldData?: {}, edgesData?: {}): TEntity;
  definition: TEntityDefinition;
};

export type FieldData<X extends string> = Partial<Record<X, AnyFieldValue>>;
export type EdgeData<X extends string> = Partial<Record<X, string[]>>;

// Verifies that the entity passed in either matches the destination of the edge
// name, if it's a forward edge, or defines an edge back here if it's a back edge.
export type ValidEdgeEntity<TEdgeEntity extends AnyEntity, TEdge> = AnyEntity &
  (
    | {
        getEntityClassHelper(): StaticEntityClass<
          TEdgeEntity,
          EntityDefinition<
            Extract<TEdge, Edge>["destination"],
            Fields<string, AnyFieldValue>,
            Edges<string, Edge, BackEdge>
          >
        >;
      }
    | {
        definition(): EntityDefinition<
          Extract<TEdge, BackEdge>["declaredOn"]["definition"]["collection"],
          Fields<string, AnyFieldValue>,
          Edges<string, Edge, BackEdge>
        >;
      }
  );
