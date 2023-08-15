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
  },
  {
    name: "Hostname",
    type: "hostname",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "globe"
  },
  {
    name: "Url",
    type: "url",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "globe"
  },
  {
    name:"file",
    type:"file",
    fields:[
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "file"

  },
  {
    name: "sha256",
    type: "sha256",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "lock"
  },
  {
    name: "md5",
    type: "md5",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "lock"
  },
  {
    name: "sha1",
    type: "sha1",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "lock"
  },

];
