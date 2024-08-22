export const DFIQ_TYPES = [
  {
    name: "Scenario",
    type: "scenario",
    fields: [
      {
        field: "uuid",
        type: "text",
        label: "DFIQ UUID",
        displayList: false,
        editable: false,
        width: "120px",
        sortable: true
      },
      {
        field: "dfiq_id",
        type: "text",
        label: "DFIQ ID",
        displayList: true,
        editable: true,
        width: "120px",
        sortable: true
      },
      {
        field: "name",
        type: "text",
        label: "Name",
        displayList: true,
        editable: true,
        sortable: true,
        maxWidth: "500px"
      },
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
        field: "uuid",
        type: "text",
        label: "DFIQ UUID",
        displayList: false,
        editable: false,
        width: "120px",
        sortable: true
      },
      {
        field: "dfiq_id",
        type: "text",
        label: "DFIQ ID",
        displayList: true,
        editable: true,
        width: "120px",
        sortable: true
      },
      {
        field: "name",
        type: "text",
        label: "Name",
        displayList: true,
        editable: true,
        sortable: true,
        maxWidth: "500px"
      },
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
        field: "uuid",
        type: "text",
        label: "DFIQ UUID",
        displayList: false,
        editable: false,
        width: "120px",
        sortable: true
      },
      {
        field: "dfiq_id",
        type: "text",
        label: "DFIQ ID",
        displayList: true,
        editable: true,
        width: "110px",
        sortable: true
      },
      {
        field: "name",
        type: "text",
        label: "Name",
        displayList: true,
        editable: true,
        sortable: true,
        maxWidth: "500px"
      },
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
  }
];

const SCENARIO_TEMPATE = `
name: Scenario template
type: scenario
description: >
  Multi-line description
uuid: UUID_PLACEHOLDER
id:
dfiq_version: 1.1.0
tags:
`;

const FACET_TEMPATE = `
name: Facet template
type: facet
description: >
  Multiline description
uuid: UUID_PLACEHOLDER
id:
dfiq_version: 1.1.0
tags:
parent_ids:
  - PARENT_UUID_PLACEHOLDER
`;

const QUESTION_TEMPATE = `
name: Question template
type: question
description:
uuid: UUID_PLACEHOLDER
id:
dfiq_version: 1.1.0
tags:
parent_ids:
  - PARENT_UUID_PLACEHOLDER
`;
export const DFIQ_TEMPLATES = {
  scenario: SCENARIO_TEMPATE.trim(),
  facet: FACET_TEMPATE.trim(),
  question: QUESTION_TEMPATE.trim()
};
