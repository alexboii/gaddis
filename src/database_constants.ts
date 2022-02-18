// The field name on which edges are defined.
// Editing this will break every entity ever, so don't do it.
const EDGE_FIELD_DONT_EVEN_THINK_ABOUT_EDITING_THIS_VALUE = "___edges";
export const EDGE_FIELD = EDGE_FIELD_DONT_EVEN_THINK_ABOUT_EDITING_THIS_VALUE;

export function reverseEdgeName(className: EntityCollection, edgeName: string) {
  return `___from__${className}__${edgeName}`;
}

export type EntityCollection = typeof Collections[keyof typeof Collections];

// Contains external data set names, e.g. Firebase collections.
// DO NOT EDIT for existing entities, since that'll break them.
export const Collections = {
  // Must be "as const" because otherwise typescript infers type
  // as any string and doesn't differentiate these.
  Comment: "comment" as const,
  Conversation: "conversation" as const,
  Message: "message" as const,
  Network: "network" as const,
  Profile: "profile" as const,
  Post: "post" as const,
  Test: "test" as const,
  User: "user" as const,
  PostImage: "post_image" as const,
};
