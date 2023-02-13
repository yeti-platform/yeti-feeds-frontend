export const INDICATOR_TYPES = [
  {
    name: "Regular expression",
    type: "regex",
    fields: [
      { field: "name", type: "text", label: "Name" },
      { field: "pattern", type: "code", label: "Pattern" },
      { field: "location", type: "text", label: "Location" },
      { field: "description", type: "longtext", label: "Description" }
    ],
    icon: "bolt"
  },
  {
    name: "Yara rule",
    type: "yara",
    fields: [
      { field: "name", type: "text", label: "Name" },
      { field: "pattern", type: "longcode", label: "Rule text" },
      { field: "location", type: "text", label: "Location" },
      { field: "description", type: "longtext", label: "Description" }
    ],
    icon: "bolt"
  }
];
