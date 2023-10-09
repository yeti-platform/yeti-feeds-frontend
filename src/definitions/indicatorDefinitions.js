export const DIAMOND_MODEL = ["adversary", "capability", "infrastructure", "victim"];

export const INDICATOR_TYPES = [
  {
    name: "Regular expression",
    type: "regex",
    fields: [
      { field: "name", type: "text", label: "Name", displayList: true },
      { field: "pattern", type: "code", label: "Pattern", displayList: true },
      { field: "location", type: "text", label: "Location", displayList: true },
      { field: "diamond", type: "option", choices: DIAMOND_MODEL, label: "Diamond model", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "bolt"
  },
  {
    name: "Yara rule",
    type: "yara",
    fields: [
      { field: "name", type: "text", label: "Name", displayList: true },
      { field: "pattern", type: "longcode", label: "Rule text", displayList: true },
      { field: "location", type: "text", label: "Location", displayList: true },
      { field: "diamond", type: "option", choices: DIAMOND_MODEL, label: "Diamond model", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "bolt"
  },
  {
    name: "Sigma rule",
    type: "sigma",
    fields: [
      { field: "name", type: "text", label: "Name", displayList: true },
      { field: "pattern", type: "longcode", label: "Rule text", displayList: true },
      { field: "location", type: "text", label: "Location", displayList: true },
      { field: "diamond", type: "option", choices: DIAMOND_MODEL, label: "Diamond model", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "bolt"
  }
];
