import { EntityCollection } from "./database_constants";
import { AnyEntityClass, BaseEntityDefinition } from "./entity_types";
import { Privacy } from "./privacy";

export type Edges<
  TName extends string,
  TEdge extends Edge,
  TBackEdge extends BackEdge
> = Record<TName, TEdge | TBackEdge>;

export interface Edge {
  destination: EntityCollection;
  description: string;
  privacy: Privacy;
}

export interface BackEdge {
  declaredOn: AnyEntityClass;
  edgeName: string;
}

// Removes back edges from an Edge/BackEdge definition
export type ExtractEdges<T extends BaseEntityDefinition> = Extract<
  T["edges"][keyof T["edges"]],
  Edge
>;

// Same as ExtractEdge but filters only back edges.
export type ExtractBackEdges<T extends BaseEntityDefinition> = Extract<
  T["edges"][keyof T["edges"]],
  BackEdge
>;
