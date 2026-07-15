import type { components } from "@/services/api-schema";

/**
 * Ergonomic aliases over the generated OpenAPI schema.
 *
 * api-schema.d.ts is generated from the backend's /openapi.json (see the
 * `generate-api` npm script) — never edit it by hand. Import the aliases from
 * here rather than reaching into `components["schemas"][...]` at every call
 * site.
 */
export type Schemas = components["schemas"];

// Observables
export type ObservableSearchRequest = Schemas["ObservableSearchRequest"];
export type ObservableSearchResponse = Schemas["ObservableSearchResponse"];
/** The discriminated union of every observable subtype (ipv4 | hostname | ...). */
export type Observable = ObservableSearchResponse["observables"][number];
export type NewObservableRequest = Schemas["NewObservableRequest"];
export type NewExtendedObservableRequest = Schemas["NewExtendedObservableRequest"];
export type PatchObservableRequest = Schemas["PatchObservableRequest"];
export type NewBulkObservableAddRequest = Schemas["NewBulkObservableAddRequest"];
export type BulkObservableAddResponse = Schemas["BulkObservableAddResponse"];
export type ObservableTagRequest = Schemas["ObservableTagRequest"];
export type ObservableTagResponse = Schemas["ObservableTagResponse"];
export type ObservableType = Schemas["ObservableType"];

// Entities
export type EntitySearchRequest = Schemas["EntitySearchRequest"];
export type EntitySearchResponse = Schemas["EntitySearchResponse"];
export type Entity = EntitySearchResponse["entities"][number];
export type NewEntityRequest = Schemas["NewEntityRequest"];
export type PatchEntityRequest = Schemas["PatchEntityRequest"];
export type EntityTagRequest = Schemas["EntityTagRequest"];
export type EntityTagResponse = Schemas["EntityTagResponse"];
export type EntityMultipleGetRequest = Schemas["EntityMultipleGetRequest"];

// Indicators
export type IndicatorSearchRequest = Schemas["IndicatorSearchRequest"];
export type IndicatorSearchResponse = Schemas["IndicatorSearchResponse"];
export type Indicator = IndicatorSearchResponse["indicators"][number];
export type NewIndicatorRequest = Schemas["NewIndicatorRequest"];
export type PatchIndicatorRequest = Schemas["PatchIndicatorRequest"];
export type IndicatorTagRequest = Schemas["IndicatorTagRequest"];
export type IndicatorTagResponse = Schemas["IndicatorTagResponse"];
export type IndicatorMultipleGetRequest = Schemas["IndicatorMultipleGetRequest"];

// Tags
export type Tag = Schemas["Tag"];
export type TagSearchRequest = Schemas["TagSearchRequest"];
export type TagSearchResponse = Schemas["TagSearchResponse"];
export type TagMultipleGetRequest = Schemas["TagMultipleGetRequest"];
/** Body of PUT /tags/{id} — a full replacement, not a partial patch. */
export type TagUpdateRequest = Schemas["UpdateRequest"];
export type MergeTagRequest = Schemas["MergeTagRequest"];
export type MergeTagResult = Schemas["MergeTagResult"];

// Users
export type User = Schemas["User"];
export type UserDetailsResponse = Schemas["UserDetailsResponse"];
export type SearchUserRequest = Schemas["SearchUserRequest"];
export type SearchUserResponse = Schemas["SearchUserResponse"];
export type NewUserRequest = Schemas["NewUserRequest"];
export type ToggleUserRequest = Schemas["ToggleUserRequest"];
export type ToggleableField = Schemas["ToggleableField"];
export type PatchRoleRequest = Schemas["PatchRoleRequest"];
export type ResetPasswordRequest = Schemas["ResetPasswordRequest"];
export type NewApiKeyRequest = Schemas["NewApiKeyRequest"];
export type NewApiKeyResponse = Schemas["NewAPIKeyResponse"];
export type ToggleApiKeyRequest = Schemas["ToggleApiKeyRequest"];
export type DeleteApiKeyRequest = Schemas["DeleteApiKeyRequest"];
export type DeleteApiKeyResponse = Schemas["DeleteApiKeyResponse"];
export type RegisteredApiKey = Schemas["RegisteredApiKey"];

// Groups / RBAC
export type Group = Schemas["Group-Output"];
export type GroupInput = Schemas["Group-Input"];
export type GroupSearchRequest = Schemas["GroupSearchRequest"];
export type GroupSearchResponse = Schemas["GroupSearchResponse"];
export type NewGroupRequest = Schemas["NewGroupRequest"];
export type RBACIdentity = Schemas["RBACIdentity"];
export type UpdateMembersResponse = Schemas["UpdateMembersResponse"];
/** One ACL edge: who (`source`) has what `role` on what (`target`). `id` is the edge's. */
export type RoleRelationship = Schemas["RoleRelationship-Output"];
/** The object families that carry an ACL — i.e. the `{type}` in /rbac/{type}/{id}. */
export type AclRootType = "observable" | "entity" | "indicator" | "dfiq" | "rbacgroup" | "user";

// Tasks / exports
export type TaskType = Schemas["TaskType"];
export type ExportTask = Schemas["ExportTask-Output"];
export type ExportTaskInput = Schemas["ExportTask-Input"];
export type TaskSearchRequest = Schemas["TaskSearchRequest"];
export type TaskSearchResponse = Schemas["TaskSearchResponse"];

// Templates
export type Template = Schemas["Template"];
export type TemplateSearchRequest = Schemas["TemplateSearchRequest"];
export type TemplateSearchResponse = Schemas["TemplateSearchResponse"];

// Graph
export type GraphSearchRequest = Schemas["GraphSearchRequest"];
export type GraphSearchResponse = Schemas["GraphSearchResponse"];
export type GraphAddRequest = Schemas["GraphAddRequest"];
export type GraphPatchRequest = Schemas["GraphPatchRequest"];

// Context (shared across observable/entity/indicator)
export type AddContextRequest = Schemas["AddContextRequest"];
export type ReplaceContextRequest = Schemas["ReplaceContextRequest"];
export type DeleteContextRequest = Schemas["DeleteContextRequest"];

// DFIQ
export type DFIQSearchResponse = Schemas["DFIQSearchResponse"];
/** Scenario | Facet | Question. */
export type DFIQObject = DFIQSearchResponse["dfiq"][number];

/**
 * The object families that share the generic /{root_type}/... endpoint shape.
 * The generic components (ObjectDetails, ObjectList, EditObject, ...) build
 * URLs from this.
 */
export type RootType = "observable" | "entity" | "indicator" | "dfiq";

/** Root types that ObjectDetails renders (observables have their own view). */
export type DetailRootType = Extract<RootType, "entity" | "indicator" | "dfiq">;
export type ObjectDetail = Entity | Indicator | DFIQObject;

/** Root types with a /tag endpoint — notably, DFIQ has none. */
export type TaggableRootType = Extract<RootType, "observable" | "entity" | "indicator">;

/**
 * A Yeti object viewed through one of the *generic* components (ObjectDetails,
 * ObjectList, EditObject...). Those render several object families with a single
 * template and index fields dynamically (`object[field.field]`), and the
 * families genuinely differ — DFIQ nodes have no tags/context, only indicators
 * have a pattern. Typing that against ObjectDetail would mean splitting the
 * template per type, which is a much bigger refactor than these components are
 * worth right now. Use the precise types (Entity, Indicator, ...) anywhere the
 * family is known statically.
 */
export type LooseYetiObject = Record<string, any>;
