export const DIAMOND_MODEL = ["adversary", "capability", "infrastructure", "victim"];
export const QUERY_TYPES = ["opensearch", "osquery", "sql", "splunk"];

export const INDICATOR_TYPES = [
  {
    name: "Regular expression",
    type: "regex",
    fields: [
      { field: "created", type: "date", label: "Created", displayList: true, editable: false, width: "200px" },
      { field: "name", type: "text", label: "Name", displayList: true, editable: true },
      { field: "pattern", type: "code", label: "Pattern", displayList: false, editable: true },
      { field: "relevant_tags", type: "list", label: "Relevant tags", displayList: true, editable: true },
      { field: "location", type: "text", label: "Location", displayList: true, editable: true },
      {
        field: "diamond",
        type: "option",
        choices: DIAMOND_MODEL,
        label: "Diamond model",
        displayList: true,
        editable: true
      },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true }
    ],
    icon: "mdi-regex"
  },
  {
    name: "Query",
    type: "query",
    fields: [
      { field: "created", type: "date", label: "Created", displayList: true, editable: false, width: "200px" },
      { field: "name", type: "text", label: "Name", displayList: true, editable: true },
      { field: "pattern", type: "code", label: "Query text", displayList: false, editable: true },
      { field: "relevant_tags", type: "list", label: "Relevant tags", displayList: true, editable: true },
      {
        field: "query_type",
        type: "option",
        choices: QUERY_TYPES,
        label: "Query type",
        displayList: true,
        editable: true
      },
      { field: "target_systems", type: "list", label: "Target systems", displayList: true, editable: true },
      { field: "location", type: "text", label: "Location", displayList: true, editable: true },
      {
        field: "diamond",
        type: "option",
        choices: DIAMOND_MODEL,
        label: "Diamond model",
        displayList: true,
        editable: true
      },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true }
    ],
    icon: "mdi-database-search"
  },
  {
    name: "Yara",
    type: "yara",
    fields: [
      { field: "created", type: "date", label: "Created", displayList: true, editable: false, width: "200px" },
      { field: "name", type: "text", label: "Name", displayList: true, editable: true },
      { field: "pattern", type: "code", label: "Rule text", displayList: false, editable: true },
      { field: "relevant_tags", type: "list", label: "Relevant tags", displayList: true, editable: true },
      { field: "location", type: "text", label: "Location", displayList: true, editable: true },
      {
        field: "diamond",
        type: "option",
        choices: DIAMOND_MODEL,
        label: "Diamond model",
        displayList: true,
        editable: true
      },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true }
    ],
    icon: "mdi-code-braces"
  },
  {
    name: "Sigma",
    type: "sigma",
    fields: [
      { field: "created", type: "date", label: "Created", displayList: true, editable: false, width: "200px" },
      { field: "name", type: "text", label: "Name", displayList: true, editable: true },
      { field: "pattern", type: "code", label: "Rule text", displayList: false, editable: true },
      { field: "relevant_tags", type: "list", label: "Relevant tags", displayList: true, editable: true },
      { field: "location", type: "text", label: "Location", displayList: true, editable: true },
      {
        field: "diamond",
        type: "option",
        choices: DIAMOND_MODEL,
        label: "Diamond model",
        displayList: true,
        editable: true
      },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true }
    ],
    icon: "mdi-xml"
  }
];
