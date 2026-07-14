// Shared types for the object-type definition files (observable/entity/
// indicator/dfiq Definitions.ts). These describe the config-driven metadata the
// generic components (ObjectList, EditObject, NewObject, ...) render from.

/** Widget used to render/edit a field in the generic object components. */
export type FieldWidget =
  | "text"
  | "longtext"
  | "list"
  | "datetime"
  | "date"
  | "option"
  /** Like "option", but the user may also type a value not in `choices`. */
  | "option-custom"
  | "code"
  /** Code editor with YARA syntax highlighting. */
  | "yara"
  | "bool";

export interface FieldDefinition {
  field: string;
  type: FieldWidget;
  label: string;
  displayList: boolean;
  editable?: boolean;
  sortable?: boolean;
  width?: string;
  maxWidth?: string;
  /** Allowed values for `type: "option"` fields. */
  choices?: string[];
}

/** A suggested relationship from one object type to a set of target types. */
export interface LinkSuggestion {
  verb: string;
  targets: string[];
}

export interface ObjectTypeDefinition {
  name: string;
  /** The backend object type discriminator, e.g. "ipv4", "malware", "yara". */
  type: string;
  fields: FieldDefinition[];
  icon?: string;
  color?: string;
  /** Extra fields to search when filtering this type. */
  filterAliases?: string[];
  /** Per-field placeholder text (used by the DFIQ forms). */
  placeholders?: Record<string, unknown>;
}
