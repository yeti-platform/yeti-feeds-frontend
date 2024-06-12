export const DFIQ_TYPES = [
  {
    name: "Scenario",
    type: "scenario",
    fields: [
      {
        field: "dfiq_id",
        type: "text",
        label: "DFIQ ID",
        displayList: true,
        editable: true,
        width: "120px",
        sortable: true
      },
      { field: "name", type: "text", label: "Name", displayList: true, editable: true, sortable: true },
      { field: "internal", type: "bool", label: "Internal", displayList: false, editable: false, sortable: true },
      {
        field: "dfiq_version",
        type: "text",
        label: "DFIQ Version",
        displayList: false,
        editable: true,
        sortable: true
      },
      { field: "dfiq_tags", type: "list", label: "DFIQ tags", displayList: true, editable: true },
      { field: "contributors", type: "list", label: "Contributors", displayList: false, editable: true },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true },
      { field: "modified", type: "date", label: "Modified on", displayList: false, editable: false },
      {
        field: "created",
        type: "date",
        label: "Created on",
        displayList: true,
        editable: false,
        width: "200px",
        sortable: true
      }
    ],
    filterAliases: ["dfiq_tags", "dfiq_id"],
    icon: "mdi-script"
  },
  {
    name: "Facet",
    type: "facet",
    fields: [
      {
        field: "dfiq_id",
        type: "text",
        label: "DFIQ ID",
        displayList: true,
        editable: true,
        width: "120px",
        sortable: true
      },
      { field: "name", type: "text", label: "Name", displayList: true, editable: true, sortable: true },
      { field: "internal", type: "bool", label: "Internal", displayList: false, editable: false, sortable: true },
      {
        field: "dfiq_version",
        type: "text",
        label: "DFIQ Version",
        displayList: false,
        editable: true,
        sortable: true
      },
      { field: "dfiq_tags", type: "list", label: "DFIQ tags", displayList: true, editable: true },
      { field: "parent_ids", type: "list", label: "Parent IDs", displayList: true, editable: true },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true },
      { field: "contributors", type: "list", label: "Contributors", displayList: false, editable: true },
      { field: "modified", type: "date", label: "Modified on", displayList: false, editable: false },
      {
        field: "created",
        type: "date",
        label: "Created on",
        displayList: true,
        editable: false,
        width: "200px",
        sortable: true
      }
    ],
    filterAliases: ["dfiq_tags", "dfiq_id", "parent_ids"],
    icon: "mdi-magnify-scan"
  },
  {
    name: "Question",
    type: "question",
    fields: [
      {
        field: "dfiq_id",
        type: "text",
        label: "DFIQ ID",
        displayList: true,
        editable: true,
        width: "120px",
        sortable: true
      },
      { field: "name", type: "text", label: "Name", displayList: true, editable: true, sortable: true },
      { field: "internal", type: "bool", label: "Internal", displayList: false, editable: false, sortable: true },
      {
        field: "dfiq_version",
        type: "text",
        label: "DFIQ Version",
        displayList: false,
        editable: true,
        sortable: true
      },
      { field: "dfiq_tags", type: "list", label: "DFIQ tags", displayList: true, editable: true },
      { field: "parent_ids", type: "list", label: "Parent IDs", displayList: true, editable: true },
      { field: "contributors", type: "list", label: "Contributors", displayList: false, editable: true },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true },
      { field: "modified", type: "date", label: "Modified on", displayList: false, editable: false },
      {
        field: "created",
        type: "date",
        label: "Created on",
        displayList: true,
        editable: false,
        width: "200px",
        sortable: true
      }
    ],
    filterAliases: ["dfiq_tags", "dfiq_id", "parent_ids"],
    icon: "mdi-help"
  },
  {
    name: "Approach",
    type: "approach",
    fields: [
      {
        field: "dfiq_id",
        type: "text",
        label: "DFIQ ID",
        displayList: true,
        editable: true,
        width: "120px",
        sortable: true
      },
      { field: "name", type: "text", label: "Name", displayList: true, editable: true, sortable: true },
      { field: "internal", type: "bool", label: "Internal", displayList: false, editable: false, sortable: true },
      {
        field: "dfiq_version",
        type: "text",
        label: "DFIQ Version",
        displayList: false,
        editable: true,
        sortable: true
      },
      { field: "dfiq_tags", type: "list", label: "DFIQ tags", displayList: true, editable: true },
      { field: "contributors", type: "list", label: "Contributors", displayList: false, editable: true },
      { field: "modified", type: "date", label: "Modified on", displayList: false, editable: false },
      {
        field: "created",
        type: "date",
        label: "Created on",
        displayList: true,
        editable: false,
        width: "200px",
        sortable: true
      }
    ],
    filterAliases: ["dfiq_tags", "dfiq_id"],
    icon: "mdi-tools"
  }
];

const SCENARIO_TEMPATE = `
display_name: Scenario template
type: scenario
description: >
  Multi-line description
id: S0999
dfiq_version: 1.0.0
tags:
  - tag1
  - tag2
`;

const FACET_TEMPATE = `
display_name: Facet template
type: facet
description: >
  Multiline description
id: F0999
dfiq_version: 1.0.0
tags:
parent_ids:
  - S1999
`;

const QUESTION_TEMPATE = `
display_name: Question template
type: question
description:
id: Q0999
dfiq_version: 1.0.0
tags:
  - tag1
parent_ids:
  - F1999
`;

const APPROACH_TEMPATE = `
display_name: Approach template
type: approach
id: Q1999.01
dfiq_version: 1.0.0
tags:
  - tag1
description:
  summary: Summary of the approach description
  details: Approaches' descriptions are complex objects
  references:
    - "[ref1](https://google.com)"
    - "[ref2](https://google.com)"
view:
  data:
    - type: artifact
      value: BrowserHistory
    - type: description
      value: Description of the forensic artifact
  notes:
    covered:
      - This covers browsing that happens on a host
    not_covered:
      - This does not cover how to make pizza
  processors:
    - name: Plaso
      options:
        - type: parsers
          value: webhist
      analysis:
        - name: OpenSearch
          steps:
            - description: &filter-desc Filter the results to just file downloads
              type: opensearch-query
              value: data_type:("chrome:history:file_downloaded" OR "safari:downloads:entry")
`;

export const DFIQ_TEMPLATES = {
  scenario: SCENARIO_TEMPATE.trim(),
  facet: FACET_TEMPATE.trim(),
  question: QUESTION_TEMPATE.trim(),
  approach: APPROACH_TEMPATE.trim()
};

export const DFIQ_APPROACH_VIEW_TYPES = ["artifact", "description"];
export const DFIQ_APPROACH_VIEW_PROCESSOR_STEP_TYPES = ["opensearch-query", "pandas", "manual"];
