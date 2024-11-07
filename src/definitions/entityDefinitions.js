import { PRIVATE_ENTITY_TYPES } from "@/definitions/private/privateEntityDefinitions.js";

export const ENTITY_TYPES = [
  {
    name: "Investigation",
    type: "investigation",
    fields: [
      {
        field: "created",
        type: "date",
        label: "Created on",
        displayList: true,
        editable: false,
        sortable: true,
        width: "200px"
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
      { field: "reference", type: "text", label: "Reference", displayList: true, editable: true },
      { field: "tags", type: "list", label: "Tags", displayList: true, editable: false },
      {
        field: "related_observables_count",
        type: "text",
        label: "Related observables",
        displayList: true,
        editable: false,
        sortable: true
      },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true }
    ],
    filterAliases: ["reference"],
    icon: "mdi-fire",
    color: "#5F7A76"
  },
  {
    name: "Malware",
    type: "malware",
    fields: [
      {
        field: "created",
        type: "date",
        label: "Created",
        displayList: true,
        editable: false,
        sortable: true,
        width: "200px"
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
      { field: "tags", type: "list", label: "Tags", displayList: true, editable: false },
      {
        field: "related_observables_count",
        type: "text",
        label: "Related observables",
        displayList: true,
        editable: false,
        sortable: true
      },
      { field: "family", type: "text", label: "Family", displayList: true, editable: true },
      { field: "aliases", type: "list", label: "Aliases", displayList: true, editable: true },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true }
    ],
    filterAliases: ["family", "aliases"],
    icon: "mdi-spider",
    color: "#7A6F6E"
  },
  {
    name: "Tool",
    type: "tool",
    fields: [
      {
        field: "created",
        type: "date",
        label: "Created",
        displayList: true,
        editable: false,
        sortable: true,
        width: "200px"
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
      { field: "tags", type: "list", label: "Tags", displayList: true, editable: false },
      {
        field: "related_observables_count",
        type: "text",
        label: "Related observables",
        displayList: true,
        editable: false,
        sortable: true
      },
      { field: "aliases", type: "list", label: "Aliases", displayList: true, editable: true },
      { field: "kill_chain_phases", type: "list", label: "Kill chain phases", displayList: true, editable: true },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true }
    ],
    filterAliases: ["aliases"],
    icon: "mdi-tools",
    color: "#A5A58A"
  },
  {
    name: "Attack pattern",
    type: "attack-pattern",
    fields: [
      {
        field: "created",
        type: "date",
        label: "Created",
        displayList: true,
        editable: false,
        sortable: true,
        width: "200px"
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
      { field: "tags", type: "list", label: "Tags", displayList: true, editable: false },
      {
        field: "related_observables_count",
        type: "text",
        label: "Related observables",
        displayList: true,
        editable: false,
        sortable: true
      },
      { field: "aliases", type: "list", label: "Aliases", displayList: true, editable: true },
      { field: "kill_chain_phases", type: "list", label: "Kill chain phases", displayList: true, editable: true },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true }
    ],
    filterAliases: ["aliases"],
    icon: "mdi-flash",
    color: "#6D8B92"
  },
  {
    name: "Threat actor",
    type: "threat-actor",
    fields: [
      {
        field: "created",
        type: "date",
        label: "Created",
        displayList: true,
        editable: false,
        sortable: true,
        width: "200px"
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
      { field: "tags", type: "list", label: "Tags", displayList: true, editable: false },
      {
        field: "related_observables_count",
        type: "text",
        label: "Related observables",
        displayList: true,
        editable: false,
        sortable: true
      },
      { field: "aliases", type: "list", label: "Aliases", displayList: true, editable: true },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true },
      { field: "threat_actor_types", type: "list", label: "Threat actor types", displayList: true, editable: true },
      { field: "first_seen", type: "date", label: "First seen", displayList: true, editable: true, width: "200px" },
      { field: "last_seen", type: "date", label: "Last seen", displayList: true, editable: true, width: "200px" }
    ],
    filterAliases: ["aliases"],
    icon: "mdi-incognito",
    color: "#92957A"
  },
  {
    name: "Intrusion set",
    type: "intrusion-set",
    fields: [
      {
        field: "created",
        type: "date",
        label: "Created",
        displayList: true,
        editable: false,
        sortable: true,
        width: "200px"
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
      { field: "tags", type: "list", label: "Tags", displayList: true, editable: false },
      {
        field: "related_observables_count",
        type: "text",
        label: "Related observables",
        displayList: true,
        editable: false,
        sortable: true
      },
      { field: "aliases", type: "list", label: "Aliases", displayList: true, editable: true },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true }
    ],
    filterAliases: ["aliases"],
    icon: "mdi-account-tie",
    color: "#B8C2A6"
  },
  {
    name: "Campaign",
    type: "campaign",
    fields: [
      {
        field: "created",
        type: "date",
        label: "Created",
        displayList: true,
        editable: false,
        sortable: true,
        width: "200px"
      },
      {
        field: "first_seen",
        type: "date",
        label: "First seen",
        displayList: true,
        editable: true,
        sortable: true,
        width: "200px"
      },
      {
        field: "last_seen",
        type: "date",
        label: "Last seen",
        displayList: true,
        editable: true,
        sortable: true,
        width: "200px"
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
      { field: "tags", type: "list", label: "Tags", displayList: true, editable: false },
      {
        field: "related_observables_count",
        type: "text",
        label: "Related observables",
        displayList: true,
        editable: false,
        sortable: true
      },
      { field: "aliases", type: "list", label: "Aliases", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true }
    ],
    filterAliases: ["aliases"],
    icon: "mdi-bullhorn",
    color: "#8C8A93"
  },
  {
    name: "Identity",
    type: "identity",
    fields: [
      {
        field: "created",
        type: "date",
        label: "Created",
        displayList: true,
        editable: false,
        sortable: true,
        width: "200px"
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
      { field: "tags", type: "list", label: "Tags", displayList: true, editable: false },
      {
        field: "related_observables_count",
        type: "text",
        label: "Related observables",
        displayList: true,
        editable: false,
        sortable: true
      },
      { field: "aliases", type: "list", label: "Aliases", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true }
    ],
    filterAliases: ["aliases"],
    icon: "mdi-information-outline",
    color: "#5A6B72"
  },
  {
    name: "Company",
    type: "company",
    fields: [
      {
        field: "created",
        type: "date",
        label: "Created",
        displayList: true,
        editable: false,
        sortable: true,
        width: "200px"
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
      { field: "tags", type: "list", label: "Tags", displayList: true, editable: false },
      {
        field: "related_observables_count",
        type: "text",
        label: "Related observables",
        displayList: true,
        editable: false,
        sortable: true
      },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true }
    ],
    filterAliases: [],
    icon: "mdi-office-building",
    color: "#7B8284"
  },
  {
    name: "Vulnerability",
    type: "vulnerability",
    fields: [
      {
        field: "created",
        type: "date",
        label: "Created",
        displayList: true,
        editable: false,
        sortable: true,
        width: "200px"
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
      { field: "title", type: "text", label: "Title", displayList: true, editable: true, sortable: true },
      { field: "tags", type: "list", label: "Tags", displayList: true, editable: false },
      {
        field: "related_observables_count",
        type: "text",
        label: "Related observables",
        displayList: true,
        editable: false,
        sortable: true
      },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true }
    ],
    filterAliases: ["title"],
    icon: "mdi-shield-alert",
    color: "#A8B2B1"
  },
  {
    name: "Course of action",
    type: "course-of-action",
    fields: [
      {
        field: "created",
        type: "date",
        label: "Created",
        displayList: true,
        editable: false,
        sortable: true,
        width: "200px"
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
      { field: "tags", type: "list", label: "Tags", displayList: true, editable: false },
      {
        field: "related_observables_count",
        type: "text",
        label: "Related observables",
        displayList: true,
        editable: false,
        sortable: true
      },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true }
    ],
    filterAliases: [],
    icon: "mdi-medical-bag",
    color: "#768585"
  }
];

ENTITY_TYPES.push(...PRIVATE_ENTITY_TYPES);
