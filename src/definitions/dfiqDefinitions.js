export const DFIQ_TYPES = [
  {
    name: "Scenario",
    type: "scenario",
    fields: [
      { field: "dfiq_id", type: "text", label: "DFIQ ID", displayList: true, editable: true, width: "120px" },
      { field: "name", type: "text", label: "Name", displayList: true, editable: true },
      { field: "internal", type: "bool", label: "Internal", displayList: false, editable: false },
      { field: "dfiq_version", type: "text", label: "DFIQ Version", displayList: false, editable: true },
      { field: "dfiq_tags", type: "list", label: "DFIQ tags", displayList: true, editable: true },
      { field: "contributors", type: "list", label: "Contributors", displayList: false, editable: true },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true },
      { field: "modified", type: "date", label: "Modified on", displayList: false, editable: false },
      { field: "created", type: "date", label: "Created on", displayList: true, editable: false, width: "200px" }
    ],
    icon: "mdi-script"
  },
  {
    name: "Facet",
    type: "facet",
    fields: [
      { field: "dfiq_id", type: "text", label: "DFIQ ID", displayList: true, editable: true, width: "120px" },
      { field: "name", type: "text", label: "Name", displayList: true, editable: true },
      { field: "internal", type: "bool", label: "Internal", displayList: false, editable: false },
      { field: "dfiq_version", type: "text", label: "DFIQ Version", displayList: false, editable: true },
      { field: "dfiq_tags", type: "list", label: "DFIQ tags", displayList: true, editable: true },
      { field: "parent_ids", type: "list", label: "Parent IDs", displayList: true, editable: true },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true },
      { field: "contributors", type: "list", label: "Contributors", displayList: false, editable: true },
      { field: "modified", type: "date", label: "Modified on", displayList: false, editable: false },
      { field: "created", type: "date", label: "Created on", displayList: true, editable: false, width: "200px" }
    ],
    icon: "mdi-magnify-scan"
  },
  {
    name: "Question",
    type: "question",
    fields: [
      { field: "dfiq_id", type: "text", label: "DFIQ ID", displayList: true, editable: true, width: "120px" },
      { field: "name", type: "text", label: "Name", displayList: true, editable: true },
      { field: "internal", type: "bool", label: "Internal", displayList: false, editable: false },
      { field: "dfiq_version", type: "text", label: "DFIQ Version", displayList: false, editable: true },
      { field: "dfiq_tags", type: "list", label: "DFIQ tags", displayList: true, editable: true },
      { field: "parent_ids", type: "list", label: "Parent IDs", displayList: true, editable: true },
      { field: "contributors", type: "list", label: "Contributors", displayList: false, editable: true },
      { field: "description", type: "longtext", label: "Description", displayList: false, editable: true },
      { field: "modified", type: "date", label: "Modified on", displayList: false, editable: false },
      { field: "created", type: "date", label: "Created on", displayList: true, editable: false, width: "200px" }
    ],
    icon: "mdi-help"
  },
  {
    name: "Approach",
    type: "approach",
    fields: [
      { field: "dfiq_id", type: "text", label: "DFIQ ID", displayList: true, editable: true, width: "120px" },
      { field: "name", type: "text", label: "Name", displayList: true, editable: true },
      { field: "internal", type: "bool", label: "Internal", displayList: false, editable: false },
      { field: "dfiq_version", type: "text", label: "DFIQ Version", displayList: false, editable: true },
      { field: "dfiq_tags", type: "list", label: "DFIQ tags", displayList: true, editable: true },
      { field: "contributors", type: "list", label: "Contributors", displayList: false, editable: true },
      { field: "modified", type: "date", label: "Modified on", displayList: false, editable: false },
      { field: "created", type: "date", label: "Created on", displayList: true, editable: false, width: "200px" }
    ],
    icon: "mdi-tools"
  }
];
