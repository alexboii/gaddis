import firebase from "firebase/compat/app";

export type AnyFieldValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | Array<AnyFieldValue>
  | firebase.firestore.Timestamp;

export type Fields<TName extends string, TValue extends AnyFieldValue> = Record<
  TName,
  Field<TValue>
>;

export interface Field<TValue extends AnyFieldValue> {
  description: string;
  type: TValue;
  initialValue: TValue;
}

type FieldTypes = {
  String: string;
  MaybeString: string | null | undefined;
  Number: number;
  MaybeNumber: number | null | undefined;
  Boolean: boolean;
  MaybeBoolean: boolean | null | undefined;
  Timestamp: firebase.firestore.Timestamp;
  MaybeTimestamp: firebase.firestore.Timestamp | null | undefined;
};

export const FieldType: FieldTypes = {
  String: "",
  MaybeString: null,
  Number: 0,
  MaybeNumber: null,
  Boolean: false,
  MaybeBoolean: null,
  Timestamp: firebase.firestore.Timestamp.now(),
  MaybeTimestamp: null,
};
