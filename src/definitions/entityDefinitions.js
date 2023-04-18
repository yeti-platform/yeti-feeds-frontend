export const ENTITY_TYPES = [
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
    name: "TTP",
    type: "ttp",
    fields: [
      { field: "name", type: "text", label: "Name", displayList: true },
      { field: "tags", type: "list", label: "Relevant tags", displayList: true },
      {
        field: "killchain",
        type: "option",
        label: "Killchain Stage",
        choices: [
          "reconnaissance",
          "weaponization",
          "delivery",
          "exploitation",
          "installation",
          "command-and-control",
          "actions-on-objectives"
        ],
        displayList: true
      },
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
    name: "Exploit",
    type: "exploit",
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
      { field: "aliases", type: "list", label: "Aliases", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "code"
  }
];
