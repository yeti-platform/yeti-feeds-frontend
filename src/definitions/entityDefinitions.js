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
    icon: "fire"
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
    icon: "bug"
  },
  {
    name: "Tool",
    type: "tool",
    fields: [
      { field: "name", type: "text", label: "Name", displayList: true },
      { field: "tags", type: "list", label: "Relevant tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "bug"
  },
  {
    name: "Attack pattern",
    type: "attack-pattern",
    fields: [
      { field: "name", type: "text", label: "Name", displayList: true },
      { field: "tags", type: "list", label: "Relevant tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "bolt"
  },
  {
    name: "Threat actor",
    type: "threat-actor",
    fields: [
      { field: "name", type: "text", label: "Name", displayList: true },
      { field: "tags", type: "list", label: "Relevant tags", displayList: true },
      { field: "aliases", type: "list", label: "Aliases", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "user-secret"
  },
  {
    name: "Intrusion set",
    type: "intrusion-set",
    fields: [
      { field: "name", type: "text", label: "Name", displayList: true },
      { field: "tags", type: "list", label: "Relevant tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "user"
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
    icon: "bullhorn"
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
    icon: "code"
  },
  {
    name: "Company",
    type: "company",
    fields: [
      { field: "name", type: "text", label: "Name", displayList: true },
      { field: "tags", type: "list", label: "Relevant tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "building"
  }
];
