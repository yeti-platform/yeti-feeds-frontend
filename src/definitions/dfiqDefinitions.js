import { placeholder } from "@babel/types";

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

export const FORM_METADATA = {
  scenario: {
    placeholders: {
      name: "Name of the scenario, e.g. Host compromise assessment",
      description: "Description of the scenario. What kind of investigation is it supposed to address?"
    },
    rules: {
      name: [value => !!value || "Required"]
    }
  },
  facet: {
    placeholders: {
      name: "Name of the facet, e.g. Does the host have malware on its filesystem?",
      description:
        "Facets are used to group questions. Describe what facet of the scenario the questions are supposed to address."
    }
  },
  question: {
    placeholders: {
      name: "Name of the question, e.g. Are there any indicators of known malware on the filesystem?",
      description:
        "Give more details about what the question is trying to answer and what information it will provide.",
      approach: {
        name: "Name of the approach, e.g. Filesystem analysis",
        description:
          "Detailed description of the approach, e.g. Hash all files in the filesystem and compare them against known badness."
      },
      approachStep: {
        name: "Name of the step, e.g. Hash all files",
        type: "Type of step, e.g. command. Auto-populated with all already existing types.",
        stage: "Stage of the step, e.g. collection. Auto-populated with all already existing stages.",
        value: "The command to execute, the query to run, etc., e.g. find . -type f -exec md5sum {} \\;",
        description: "Describe the steps in more detail if needed."
      }
    }
  }
};

const SCENARIO_TEMPATE = `
name: ""
type: scenario
description: ""
uuid: UUID_PLACEHOLDER
id:
dfiq_version: 1.1.0
tags:
`;

const FACET_TEMPATE = `
name: ""
type: facet
description: ""
uuid: UUID_PLACEHOLDER
id:
dfiq_version: 1.1.0
tags:
parent_ids:
  - PARENT_UUID_PLACEHOLDER
`;

const QUESTION_TEMPATE = `
name: ""
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
