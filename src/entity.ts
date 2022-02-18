import firebase from "firebase/compat/app";
import { isArray, mergeWith } from "lodash";
import { v4 as uuidv4 } from "uuid";
import {
  EDGE_FIELD,
  EntityCollection,
  reverseEdgeName,
} from "./database_constants";
import { BackEdge, Edge, Edges } from "./edges";
import EntityFactory from "./entityFactory";
import {
  AnyEntity,
  AnyEntityClass,
  BaseEntityDefinition,
  EdgeData,
  EntityDefinition,
  FieldData,
  StaticEntityClass,
  ValidEdgeEntity,
} from "./entity_types";
import { NonExistentFieldError, ReservedKeywordError } from "./errors";
import { AnyFieldValue, Fields } from "./fields";
import { Privacy } from "./privacy";
import { VerifyDefinition } from "./verify_definitions";

abstract class EntityImpl<
  // The entity spec definition, containing all the fields, edges, etc.
  // Some of this is redundant and exists for convenience, e.g. so we don't have
  // to extract certain things every time.
  TDefinition extends EntityDefinition<TEntityCollection, TFields, TEdges>,
  // The DB collection (e.g. firebase data set) that this entity's info is stored in.
  TEntityCollection extends EntityCollection,
  // A map of all field definitions.
  TFields extends Fields<TFieldName, AnyFieldValue>,
  // A map of all edge definitions.
  TEdges extends Edges<TEdgeName, Edge, BackEdge>,
  // Valid field names for this entity.
  TFieldName extends string,
  // Valid edge names.
  TEdgeName extends string
> {
  private fieldsData: FieldData<TFieldName>;
  private fieldMutations: FieldData<TFieldName>;
  private edgesData: EdgeData<TEdgeName>;
  private edgeMutations: EdgeData<TEdgeName>;

  private _id: string;

  // is assigning an id here safe?
  constructor(
    id?: string,
    fieldData?: FieldData<TFieldName>,
    edgesData?: EdgeData<TEdgeName>
  ) {
    // TODO: need to ensure that names are unique in order to not overwrite databases, throw an error here
    if (Object.keys(this.fields()).includes(EDGE_FIELD)) {
      throw ReservedKeywordError(EDGE_FIELD);
    }

    this._id = id ?? uuidv4();

    if (fieldData != null) {
      this.fieldsData = fieldData;
    } else {
      this.fieldsData = {};
      Object.keys(this.fields()).map((name: TFieldName) => {
        const field = this.fields()[name];
        this.fieldsData[name] = field.initialValue;
      });
    }

    if (edgesData != null) {
      this.edgesData = edgesData;
    } else {
      this.edgesData = {};
      Object.keys(this.edges()).map((name: TEdgeName) => {
        const edgeDefinition: Edge | BackEdge = this.edges()[name];
        // Skip back edges. Only regular edges have a destination declaration.
        if (edgeDefinition && "destination" in edgeDefinition) {
          this.edgesData[name] = [];
        }
      });
    }

    this.fieldMutations = {};
    this.edgeMutations = {};
  }

  public abstract verify(): VerifyDefinition<TDefinition>;

  get id(): string {
    return this._id;
  }

  static getEntityClass(): AnyEntityClass {
    return this as unknown as AnyEntityClass;
  }

  // Returns the class type of this entity.
  // For example:
  //   new Profile().getEntityClassHelper()
  // returns type:
  //   StaticEntityClass<Profile, profileDefinition>
  //
  // This method can be called from an instance.
  public getEntityClassHelper(): StaticEntityClass<
    this & AnyEntity,
    TDefinition
  > {
    return (this.constructor as any).getEntityClass();
  }

  async fetch(id: string): Promise<this | undefined> {
    return await EntityFactory.fetchEntity(id, this.getEntityClassHelper());
  }

  // TODO: ensure that collection names are unique
  static collection(): EntityCollection {
    const thisClass = this.getEntityClass();
    return thisClass.definition.collection;
  }

  public definition(): TDefinition {
    return this.verify() as TDefinition;
  }

  private fields(): TFields {
    return this.definition().fields;
  }

  private edges(): TEdges {
    return this.definition().edges;
  }

  /**
   * Enforce privacy on objects
   */
  private privacy(): Privacy {
    return this.definition().privacy;
  }

  async save(): Promise<this> {
    // parse all mutations
    // return new instance?
    // TODO: if returns success then return a copy

    try {
      const edges = mergeWith(
        this.edgesData,
        this.edgeMutations,
        (objValue, srcValue) => {
          if (isArray(objValue)) {
            return objValue.concat(srcValue);
          }
        }
      );

      await EntityFactory.converter.write(
        this.id,
        this.getEntityClassHelper(),
        {
          id: this.id,
          ...this.fieldsData,
          ...this.fieldMutations,
          [EDGE_FIELD]: edges,
        }
      );

      this.edgesData = edges;
      this.edgeMutations = {};

      this.fieldsData = { ...this.fieldsData, ...this.fieldMutations };
      this.fieldMutations = {};

      return this;
    } catch (e) {
      console.error(e);
      return this;
    }
  }

  addEdge<
    TName extends TEdgeName,
    TEdgeEntity extends ValidEdgeEntity<TEdgeEntity, TEdges[TName]>
  >(edgeName: TName, entity: TEdgeEntity, _isReverse: boolean = false): this {
    // Must be a back edge if it has declaredOn property.
    // A back edge is an edge defined on another entity that points to here.
    const edgeDefinition: Edge | BackEdge = this.edges()[edgeName];
    if (edgeDefinition && "declaredOn" in edgeDefinition) {
      const backEdgeName = edgeDefinition["edgeName"];
      entity.addEdge(backEdgeName, this as any).save();
      return this;
    }

    // TODO: add validation for duplicate edge?
    const mutations: string[] | undefined = this.edgeMutations[edgeName];
    this.edgeMutations[edgeName] = mutations
      ? [...mutations, entity.id]
      : [entity.id];

    // Add reverse edge.
    if (!_isReverse) {
      const className = this.definition().collection;
      entity
        .addEdge(reverseEdgeName(className, edgeName), this as any, true)
        .save();
    }
    return this;
  }

  updateField<TName extends TFieldName>(
    fieldName: TName,
    newValue: TFields[TName]["type"]
  ): this {
    if (!Object.keys(this.fields()).includes(fieldName)) {
      throw NonExistentFieldError(fieldName, this.getEntityClassHelper());
    }

    // TODO: ensure that type matches and is not changed
    // TODO: add field validator
    this.fieldMutations[fieldName] = newValue;

    return this;
  }

  getField<T extends TFieldName>(fieldName: T): TFields[T]["type"] {
    // should we just return fieldsData?
    return this.fieldMutations[fieldName] ?? this.fieldsData[fieldName];
  }

  async getEdges<
    TName extends TEdgeName,
    TEdgeEntity extends ValidEdgeEntity<TEdgeEntity, TEdges[TName]>
  >(
    edgeName: TName,
    entityClass: StaticEntityClass<TEdgeEntity, BaseEntityDefinition>
  ): Promise<TEdgeEntity[]> {
    // TODO: create readMultipleEntities in backend to save up rest calls
    return (await EntityFactory.fetchEntities(
      this.getEdgeIds(edgeName),
      entityClass
    )) as TEdgeEntity[];
  }

  getEdgeIds<TName extends TEdgeName>(edgeName: TName): string[] {
    return this.edgeMutations[edgeName] ?? this.edgesData[edgeName] ?? [];
  }

  getFirebaseDocument(): firebase.firestore.DocumentReference {
    return EntityFactory.converter.getFirebaseDocumentFromPath(
      this.id,
      this.getEntityClassHelper()
    );
  }
}

// This exists to pull useful information off of the static entity definition
// and pass it into the actual entity class implementation where it can be used
// for type signatures. For example, it pulls all the class types for valid edges.
export default abstract class Entity<
  TEntityDefinition extends BaseEntityDefinition
> extends EntityImpl<
  // Full definition.
  TEntityDefinition,
  // This entity's collection.
  TEntityDefinition["collection"],
  // Field definition.
  TEntityDefinition["fields"],
  // Edge definitions.
  TEntityDefinition["edges"],
  // TEdges extends Edges<TEdgeName, TEdge, TBackEdge>,
  // Field names.
  Extract<keyof TEntityDefinition["fields"], string>,
  // Edge names.
  Extract<keyof TEntityDefinition["edges"], string>
> {}
