export const ENTITY_TYPES = [
  {
    name: "Investigation",
    type: "investigation",
    fields: [
      { field: "name", type: "text", label: "Name", displayList: true },
      { field: "reference", type: "text", label: "Reference", displayList: true },
      { field: "tags", type: "list", label: "Relevant tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "mdi-fire"
  },
  {
    name: "Malware",
    type: "malware",
    fields: [
      { field: "name", type: "text", label: "Name", displayList: true },
      { field: "tags", type: "list", label: "Relevant tags", displayList: true },
      { field: "family", type: "text", label: "Family", displayList: true },
      { field: "aliases", type: "list", label: "Aliases", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "mdi-spider"
  },
  {
    name: "Tool",
    type: "tool",
    fields: [
      { field: "name", type: "text", label: "Name", displayList: true },
      { field: "tags", type: "list", label: "Relevant tags", displayList: true },
      { field: "aliases", type: "list", label: "Aliases", displayList: true },
      { field: "kill_chain_phases", type: "list", label: "Kill chain phases", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "mdi-tools"
  },
  {
    name: "Attack pattern",
    type: "attack-pattern",
    fields: [
      { field: "name", type: "text", label: "Name", displayList: true },
      { field: "tags", type: "list", label: "Relevant tags", displayList: true },
      { field: "kill_chain_phases", type: "list", label: "Kill chain phases", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "mdi-flash"
  },
  {
    name: "Threat actor",
    type: "threat-actor",
    fields: [
      { field: "name", type: "text", label: "Name", displayList: true },
      { field: "tags", type: "list", label: "Relevant tags", displayList: true },
      { field: "aliases", type: "list", label: "Aliases", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false },
      { field: "threat_actor_types", type: "list", label: "Threat actor types", displayList: true },
      { field: "created", type: "date", label: "Created", displayList: true },
      { field: "first_seen", type: "date", label: "First seen", displayList: true },
      { field: "last_seen", type: "date", label: "Last seen", displayList: true }
    ],
    icon: "mdi-incognito"
  },
  {
    name: "Intrusion set",
    type: "intrusion-set",
    fields: [
      { field: "name", type: "text", label: "Name", displayList: true },
      { field: "tags", type: "list", label: "Relevant tags", displayList: true },
      { field: "aliases", type: "list", label: "Aliases", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "mdi-account-tie"
  },
  {
    name: "Campaign",
    type: "campaign",
    fields: [
      { field: "name", type: "text", label: "Name", displayList: true },
      { field: "tags", type: "list", label: "Relevant tags", displayList: true },
      { field: "aliases", type: "list", label: "Aliases", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "mdi-bullhorn"
  },
  {
    name: "Identity",
    type: "identity",
    fields: [
      { field: "name", type: "text", label: "Name", displayList: true },
      { field: "tags", type: "list", label: "Relevant tags", displayList: true },
      { field: "aliases", type: "list", label: "Aliases", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "mdi-user"
  },
  {
    name: "Company",
    type: "company",
    fields: [
      { field: "name", type: "text", label: "Name", displayList: true },
      { field: "tags", type: "list", label: "Relevant tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "mdi-office-building"
  },
  {
    name: "Vulnerability",
    type: "vulnerability",
    fields: [
      { field: "name", type: "text", label: "Name", displayList: true },
      { field: "tags", type: "list", label: "Relevant tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "mdi-shield-alert"
  },
  {
    name: "Course of action",
    type: "course-of-action",
    fields: [
      { field: "name", type: "text", label: "Name", displayList: true },
      { field: "tags", type: "list", label: "Relevant tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "mdi-medical-bag"
  }
];
