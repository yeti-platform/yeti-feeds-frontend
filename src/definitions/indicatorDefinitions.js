import { PRIVATE_INDICATOR_TYPES } from "@/definitions/private/privateIndicatorDefinitions.js";

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
    icon: "mdi-script-text-outline",
    color: "#80989E"
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
    icon: "mdi-regex",
    color: "#A9A99D"
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
    icon: "mdi-database-search",
    color: "#8B847C"
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
    icon: "mdi-code-braces",
    color: "#96A4A2"
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
    icon: "mdi-security-network",
    color: "#99ADA6"
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
    icon: "mdi-xml",
    color: "#8E9D99"
  }
];

INDICATOR_TYPES.push(...PRIVATE_INDICATOR_TYPES);
