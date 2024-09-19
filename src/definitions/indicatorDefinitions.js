export const DIAMOND_MODEL = ["adversary", "capability", "infrastructure", "victim"];
export const QUERY_TYPES = ["opensearch", "osquery", "sql", "splunk", "censys", "shodan"];

export const INDICATOR_TYPES = [
  {
    name: "Forensic artifact",
    type: "forensicartifact",
    fields: [
      {
        field: "created",
        type: "date",
        label: "Created",
        displayList: true,
        editable: false,
        width: "170px",
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
      { field: "pattern", type: "code", label: "Pattern", displayList: false, editable: true },
      { field: "tags", type: "list", label: "Tags", displayList: true, editable: false },
      { field: "relevant_tags", type: "list", label: "Relevant tags", displayList: true, editable: true },
      { field: "aliases", type: "list", label: "Aliases", displayList: false, editable: true },
      { field: "supported_os", type: "list", label: "Supported OS", displayList: true, editable: true, width: "140px" },
      { field: "location", type: "text", label: "Location", displayList: false, editable: true, sortable: true },
      {
        field: "diamond",
        type: "option",
        choices: DIAMOND_MODEL,
        label: "Diamond model",
        displayList: true,
        editable: true,
        width: "160px"
      },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true }
    ],
    filterAliases: ["aliases"],
    icon: "mdi-script-text-outline"
  },
  {
    name: "Regular expression",
    type: "regex",
    fields: [
      {
        field: "created",
        type: "date",
        label: "Created",
        displayList: true,
        editable: false,
        width: "170px",
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
      { field: "pattern", type: "code", label: "Pattern", displayList: false, editable: true },
      { field: "tags", type: "list", label: "Tags", displayList: true, editable: false },
      { field: "relevant_tags", type: "list", label: "Relevant tags", displayList: true, editable: true },
      { field: "location", type: "text", label: "Location", displayList: false, editable: true, sortable: true },
      {
        field: "diamond",
        type: "option",
        choices: DIAMOND_MODEL,
        label: "Diamond model",
        displayList: true,
        editable: true,
        width: "160px"
      },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true }
    ],
    filterAliases: [],
    icon: "mdi-regex"
  },
  {
    name: "Query",
    type: "query",
    fields: [
      {
        field: "created",
        type: "date",
        label: "Created",
        displayList: true,
        editable: false,
        width: "200px",
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
      { field: "pattern", type: "code", label: "Query text", displayList: false, editable: true },
      { field: "tags", type: "list", label: "Tags", displayList: true, editable: false },
      { field: "relevant_tags", type: "list", label: "Relevant tags", displayList: true, editable: true },
      {
        field: "query_type",
        type: "option-custom",
        choices: QUERY_TYPES,
        label: "Query type",
        displayList: true,
        editable: true
      },
      { field: "target_systems", type: "list", label: "Target systems", displayList: true, editable: true },
      { field: "location", type: "text", label: "Location", displayList: false, editable: true, sortable: true },
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
    filterAliases: ["target_systems"],
    icon: "mdi-database-search"
  },
  {
    name: "Yara",
    type: "yara",
    fields: [
      {
        field: "created",
        type: "date",
        label: "Created",
        displayList: true,
        editable: false,
        width: "200px",
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
      { field: "pattern", type: "code", label: "Rule text", displayList: false, editable: true },
      { field: "tags", type: "list", label: "Tags", displayList: true, editable: false },
      { field: "relevant_tags", type: "list", label: "Relevant tags", displayList: true, editable: true },
      { field: "location", type: "text", label: "Location", displayList: false, editable: true, sortable: true },
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
    filterAliases: [],
    icon: "mdi-code-braces"
  },
  {
    name: "Suricata",
    type: "suricata",
    fields: [
      {
        field: "created",
        type: "date",
        label: "Created",
        displayList: true,
        editable: false,
        width: "200px",
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
      { field: "pattern", type: "longtext", label: "Rule text", displayList: false, editable: true },
      { field: "tags", type: "list", label: "Tags", displayList: true, editable: false },
      { field: "relevant_tags", type: "list", label: "Relevant tags", displayList: true, editable: true },
      { field: "location", type: "text", label: "Location", displayList: false, editable: true, sortable: true },
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
    filterAliases: [],
    icon: "mdi-security-network"
  },
  {
    name: "Sigma",
    type: "sigma",
    fields: [
      {
        field: "created",
        type: "date",
        label: "Created",
        displayList: true,
        editable: false,
        width: "200px",
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
      { field: "pattern", type: "code", label: "Rule text", displayList: false, editable: true },
      { field: "tags", type: "list", label: "Tags", displayList: true, editable: false },
      { field: "relevant_tags", type: "list", label: "Relevant tags", displayList: true, editable: true },
      { field: "location", type: "text", label: "Location", displayList: false, editable: true, sortable: true },
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
    filterAliases: [],
    icon: "mdi-xml"
  }
];

import("@/definitions/private/privateIndicatorDefinitions.js").catch(e => Promise.reject("Module " + modulePath + " not found.")).then(module => { INDICATOR_TYPES.push(...module.INDICATOR_TYPES); })