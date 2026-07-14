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

/**
 * The object families that share the generic /{root_type}/... endpoint shape.
 * The generic components (ObjectList, EditObject, ...) build URLs from this.
 */
export type RootType = "observables" | "entities" | "indicators" | "dfiq";
