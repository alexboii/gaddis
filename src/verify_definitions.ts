import { EntityCollection } from "./database_constants";
import { BackEdge, Edge, ExtractBackEdges } from "./edges";
import { AnyEntityClass, BaseEntityDefinition } from "./entity_types";

type GetEdges<T extends BaseEntityDefinition> = T["edges"][keyof T["edges"]];
type Validate<T> = "invalid" extends T ? never : T;

// Validation of definition
export type VerifyDefinition<TEntityDefinition extends BaseEntityDefinition> =
  Validate<VerifyDefinitionImpl<TEntityDefinition>>;

type VerifyDefinitionImpl<TEntityDefinition extends BaseEntityDefinition> =
  // If empty edges definition, skip checks. Note the order of extends matters.
  {} extends TEntityDefinition["edges"]
    ? TEntityDefinition
    : // Edges is non-empty. Verify validity.
      VerifyEdges<TEntityDefinition, GetEdges<TEntityDefinition>>;

// If this says your definition may be undefined then there is an error!
type VerifyEdges<TEntityDefinition extends BaseEntityDefinition, TEdges> =
  // Pull all the edges defined on other entities.
  TEdges extends BackEdge
    ? // Verify those back edges are valid
      VerifyExternalFieldExists<
        TEntityDefinition,
        ExtractBackEdges<TEntityDefinition>,
        TEntityDefinition["collection"]
      >
    : TEntityDefinition;

// Checks that the edxternal field referenced is actually defined and
// points to the entity for this definition.
type VerifyExternalFieldExists<
  TEntityDefinition extends BaseEntityDefinition,
  TBackEdge,
  TEntityCollection extends EntityCollection
> = TBackEdge extends {
  declaredOn: infer TClass;
  edgeName: infer TName;
}
  ? TClass extends AnyEntityClass
    ? TName extends keyof TClass["definition"]["edges"]
      ? // Verify the edge points to this collection.
        VerifyDestination<
          TEntityDefinition,
          TClass["definition"]["edges"][TName],
          TEntityCollection
        >
      : "invalid"
    : "invalid"
  : "invalid";

// Compare the collection of the external edge to this definition
//  and ensure they're the same.
type VerifyDestination<
  TEntityDefinition extends BaseEntityDefinition,
  T,
  TEntityCollection extends EntityCollection
> = T extends Edge
  ? TEntityCollection extends T["destination"]
    ? TEntityDefinition
    : "invalid"
  : "invalid";
