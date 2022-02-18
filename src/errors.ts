import { AnyEntityClass } from "./entity_types";

export function NotImplementedError(func?: string) {
  throw new Error(`Function ${func} must be implemented.`);
}

export function NonExistentEdgeError(entityClass: AnyEntityClass) {
  throw new Error(`${entityClass} is not a valid edge on the entity`);
}

export function NonExistentFieldError(
  fieldName: string,
  entityClass: AnyEntityClass
) {
  throw new Error(
    `${fieldName} is not a valid field on the entity ${entityClass.definition.collection}`
  );
}

export function ReservedKeywordError(fieldName: string) {
  throw new Error(
    `${fieldName} is a reserved keyword and cannot be used as a field name.`
  );
}

export function EntityDoesNotFollowCorrectEdgeStructure(
  id: string,
  entityClass: AnyEntityClass
) {
  throw new Error(
    `${entityClass.definition.collection} with id = ${id} does not have an "edges" field & therefore its format is corrupted`
  );
}
