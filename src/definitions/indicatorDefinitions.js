export const DIAMOND_MODEL = ["adversary", "capability", "infrastructure", "victim"];
export const QUERY_TYPES = ["opensearch", "osquery", "sql", "splunk"];

export const INDICATOR_TYPES = [
  {
    name: "Regular expressions",
    type: "regex",
    fields: [
      { field: "name", type: "text", label: "Name", displayList: true },
      { field: "pattern", type: "code", label: "Pattern", displayList: false },
      { field: "relevant_tags", type: "list", label: "Relevant tags", displayList: true },
      { field: "location", type: "text", label: "Location", displayList: true },
      {
        field: "diamond",
        type: "option",
        choices: DIAMOND_MODEL,
        label: "Diamond model",
        displayList: true
      },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "code"
  },
  {
    name: "Queries",
    type: "query",
    fields: [
      { field: "name", type: "text", label: "Name", displayList: true },
      { field: "pattern", type: "longcode", label: "Rule text", displayList: false },
      { field: "relevant_tags", type: "list", label: "Relevant tags", displayList: true },
      { field: "query_type", type: "option", choices: QUERY_TYPES, label: "Query type", displayList: true },
      { field: "target_systems", type: "list", label: "Target systems", displayList: true },
      { field: "location", type: "text", label: "Location", displayList: true },
      {
        field: "diamond",
        type: "option",
        choices: DIAMOND_MODEL,
        label: "Diamond model",
        displayList: true
      },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "database"
  },
  {
    name: "Yara rules",
    type: "yara",
    fields: [
      { field: "name", type: "text", label: "Name", displayList: true },
      { field: "pattern", type: "longcode", label: "Rule text", displayList: false },
      { field: "relevant_tags", type: "list", label: "Relevant tags", displayList: true },
      { field: "location", type: "text", label: "Location", displayList: true },
      {
        field: "diamond",
        type: "option",
        choices: DIAMOND_MODEL,
        label: "Diamond model",
        displayList: true
      },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "bolt"
  },
  {
    name: "Sigma rules",
    type: "sigma",
    fields: [
      { field: "name", type: "text", label: "Name", displayList: true },
      { field: "pattern", type: "longcode", label: "Rule text", displayList: false },
      { field: "relevant_tags", type: "list", label: "Relevant tags", displayList: true },
      { field: "location", type: "text", label: "Location", displayList: true },
      {
        field: "diamond",
        type: "option",
        choices: DIAMOND_MODEL,
        label: "Diamond model",
        displayList: true
      },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "bolt"
  }
];
