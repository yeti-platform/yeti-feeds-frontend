export const ENTITY_TYPES = [
  {
    name: "Malware",
    type: "malware",
    fields: [
      { field: "name", type: "text", label: "Name" },
      { field: "tags", type: "list", label: "Relevant tags" },
      { field: "family", type: "text", label: "Family" },
      { field: "aliases", type: "list", label: "Aliases" },
      { field: "description", type: "longtext", label: "Description" }
    ]
  },
  {
    name: "TTP",
    type: "ttp",
    fields: [
      { field: "name", type: "text", label: "Name" },
      { field: "tags", type: "list", label: "Relevant tags" },
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
        ]
      },
      { field: "description", type: "longtext", label: "Description" }
    ]
  }
];
