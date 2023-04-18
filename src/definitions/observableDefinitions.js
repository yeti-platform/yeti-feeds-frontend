export const OBSERVABLE_TYPES = [
  {
    name: "IP",
    type: "ip",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "globe"
  }
];
