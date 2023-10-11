export const DIAMOND_MODEL = ["adversary", "capability", "infrastructure", "victim"];

export const INDICATOR_TYPES = [
  {
    name: "Regular expressions",
    type: "regex",
    fields: [
      { field: "name", type: "text", label: "Name", displayList: true, displayInfoBox: true },
      { field: "pattern", type: "code", label: "Pattern", displayList: false, displayInfoBox: true },
      { field: "relevant_tags", type: "list", label: "Relevant tags", displayList: true, displayInfoBox: true },
      { field: "location", type: "text", label: "Location", displayList: true, displayInfoBox: true },
      {
        field: "diamond",
        type: "option",
        choices: DIAMOND_MODEL,
        label: "Diamond model",
        displayList: true,
        displayInfoBox: true
      },
      { field: "description", type: "longtext", label: "Description", displayList: false, displayInfoBox: true }
    ],
    icon: "code"
  },
  {
    name: "Queries",
    type: "query",
    fields: [
      { field: "name", type: "text", label: "Name", displayList: true, displayInfoBox: true },
      { field: "pattern", type: "longcode", label: "Rule text", displayList: false, displayInfoBox: true },
      { field: "relevant_tags", type: "list", label: "Relevant tags", displayList: true, displayInfoBox: true },
      { field: "query_type", type: "text", label: "Query type", displayList: true, displayInfoBox: true },
      { field: "target_systems", type: "text", label: "Target system", displayList: true, displayInfoBox: true },
      { field: "description", type: "longtext", label: "Description", displayList: false, displayInfoBox: true }
    ],
    icon: "database"
  },
  {
    name: "Yara rules",
    type: "yara",
    fields: [
      { field: "name", type: "text", label: "Name", displayList: true, displayInfoBox: true },
      { field: "pattern", type: "longcode", label: "Rule text", displayList: false, displayInfoBox: true },
      { field: "relevant_tags", type: "list", label: "Relevant tags", displayList: true, displayInfoBox: true },
      { field: "location", type: "text", label: "Location", displayList: true, displayInfoBox: true },
      {
        field: "diamond",
        type: "option",
        choices: DIAMOND_MODEL,
        label: "Diamond model",
        displayList: true,
        displayInfoBox: true
      },
      { field: "description", type: "longtext", label: "Description", displayList: false, displayInfoBox: true }
    ],
    icon: "bolt"
  },
  {
    name: "Sigma rules",
    type: "sigma",
    fields: [
      { field: "name", type: "text", label: "Name", displayList: true, displayInfoBox: true },
      { field: "pattern", type: "longcode", label: "Rule text", displayList: false, displayInfoBox: true },
      { field: "relevant_tags", type: "list", label: "Relevant tags", displayList: true, displayInfoBox: true },
      { field: "location", type: "text", label: "Location", displayList: true, displayInfoBox: true },
      {
        field: "diamond",
        type: "option",
        choices: DIAMOND_MODEL,
        label: "Diamond model",
        displayList: true,
        displayInfoBox: true
      },
      { field: "description", type: "longtext", label: "Description", displayList: false, displayInfoBox: true }
    ],
    icon: "bolt"
  }
];
