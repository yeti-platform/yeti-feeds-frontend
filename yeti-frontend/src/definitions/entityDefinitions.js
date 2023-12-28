export const ENTITY_TYPES = [
  {
    name: "Investigation",
    type: "investigation",
    fields: [
      { field: "created", type: "date", label: "Created", displayList: true, editable: false, width: "190px" },
      { field: "name", type: "text", label: "Name", displayList: true, editable: true },
      { field: "reference", type: "text", label: "Reference", displayList: true, editable: true },
      { field: "tags", type: "list", label: "Relevant tags", displayList: true, editable: false },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true }
    ],
    icon: "mdi-fire"
  },
  {
    name: "Malware",
    type: "malware",
    fields: [
      { field: "created", type: "date", label: "Created", displayList: true, editable: false, width: "190px" },
      { field: "name", type: "text", label: "Name", displayList: true, editable: true },
      { field: "tags", type: "list", label: "Relevant tags", displayList: true, editable: false },
      { field: "family", type: "text", label: "Family", displayList: true, editable: true },
      { field: "aliases", type: "list", label: "Aliases", displayList: true, editable: true },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true }
    ],
    icon: "mdi-spider"
  },
  {
    name: "Tool",
    type: "tool",
    fields: [
      { field: "created", type: "date", label: "Created", displayList: true, editable: false, width: "190px" },
      { field: "name", type: "text", label: "Name", displayList: true, editable: true },
      { field: "tags", type: "list", label: "Relevant tags", displayList: true, editable: false },
      { field: "aliases", type: "list", label: "Aliases", displayList: true, editable: true },
      { field: "kill_chain_phases", type: "list", label: "Kill chain phases", displayList: true, editable: true },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true }
    ],
    icon: "mdi-tools"
  },
  {
    name: "Attack pattern",
    type: "attack-pattern",
    fields: [
      { field: "created", type: "date", label: "Created", displayList: true, editable: false, width: "190px" },
      { field: "name", type: "text", label: "Name", displayList: true, editable: true },
      { field: "tags", type: "list", label: "Relevant tags", displayList: true, editable: false },
      { field: "kill_chain_phases", type: "list", label: "Kill chain phases", displayList: true, editable: true },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true }
    ],
    icon: "mdi-flash"
  },
  {
    name: "Threat actor",
    type: "threat-actor",
    fields: [
      { field: "created", type: "date", label: "Created", displayList: true, editable: false, width: "190px" },
      { field: "name", type: "text", label: "Name", displayList: true, editable: true },
      { field: "tags", type: "list", label: "Relevant tags", displayList: true, editable: false },
      { field: "aliases", type: "list", label: "Aliases", displayList: true, editable: true },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true },
      { field: "threat_actor_types", type: "list", label: "Threat actor types", displayList: true, editable: true },
      { field: "first_seen", type: "date", label: "First seen", displayList: true, editable: true, width: "190px" },
      { field: "last_seen", type: "date", label: "Last seen", displayList: true, editable: true, width: "190px" }
    ],
    icon: "mdi-incognito"
  },
  {
    name: "Intrusion set",
    type: "intrusion-set",
    fields: [
      { field: "created", type: "date", label: "Created", displayList: true, editable: false, width: "190px" },
      { field: "name", type: "text", label: "Name", displayList: true, editable: true },
      { field: "tags", type: "list", label: "Relevant tags", displayList: true, editable: false },
      { field: "aliases", type: "list", label: "Aliases", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true }
    ],
    icon: "mdi-account-tie"
  },
  {
    name: "Campaign",
    type: "campaign",
    fields: [
      { field: "created", type: "date", label: "Created", displayList: true, editable: false, width: "190px" },
      { field: "name", type: "text", label: "Name", displayList: true, editable: true },
      { field: "tags", type: "list", label: "Relevant tags", displayList: true, editable: false },
      { field: "aliases", type: "list", label: "Aliases", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true }
    ],
    icon: "mdi-bullhorn"
  },
  {
    name: "Identity",
    type: "identity",
    fields: [
      { field: "created", type: "date", label: "Created", displayList: true, editable: false, width: "190px" },
      { field: "name", type: "text", label: "Name", displayList: true, editable: true },
      { field: "tags", type: "list", label: "Relevant tags", displayList: true, editable: false },
      { field: "aliases", type: "list", label: "Aliases", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true }
    ],
    icon: "mdi-information-outline"
  },
  {
    name: "Company",
    type: "company",
    fields: [
      { field: "created", type: "date", label: "Created", displayList: true, editable: false, width: "190px" },
      { field: "name", type: "text", label: "Name", displayList: true, editable: true },
      { field: "tags", type: "list", label: "Relevant tags", displayList: true, editable: false },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true }
    ],
    icon: "mdi-office-building"
  },
  {
    name: "Vulnerability",
    type: "vulnerability",
    fields: [
      { field: "created", type: "date", label: "Created", displayList: true, editable: false, width: "190px" },
      { field: "name", type: "text", label: "Name", displayList: true, editable: true },
      { field: "tags", type: "list", label: "Relevant tags", displayList: true, editable: false },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true }
    ],
    icon: "mdi-shield-alert"
  },
  {
    name: "Course of action",
    type: "course-of-action",
    fields: [
      { field: "created", type: "date", label: "Created", displayList: true, editable: false, width: "190px" },
      { field: "name", type: "text", label: "Name", displayList: true, editable: true },
      { field: "tags", type: "list", label: "Relevant tags", displayList: true, editable: false },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true }
    ],
    icon: "mdi-medical-bag"
  }
];
