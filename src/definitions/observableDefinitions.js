export const OBSERVABLE_TYPES = [
  {
    name: "IPv6",
    type: "ipv6",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "globe"
  },
  {
    name: "IPv4",
    type: "ipv4",
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
    name: "File",
    type: "file",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "file"
  },
  {
    name: "SHA256",
    type: "sha256",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "lock"
  },
  {
    name: "MD5",
    type: "md5",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "lock"
  },
  {
    name: "SHA1",
    type: "sha1",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "lock"
  },
  {
    name: "ASN",
    type: "asn",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ],
    icon: "sitemap"
  },
  {
    name: "Bitcoin Wallet",
    type: "bitcoin_wallet",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ]
  },
  {
    name: "Certificate",
    type: "certificate",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: false },
      { field: "tags", type: "list", label: "tags", displayList: false },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ]
  },
  {
    name: "CIDR",
    type: "cidr",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: false },
      { field: "tags", type: "list", label: "tags", displayList: false },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ]
  },
  {
    name: "Mac Address",
    type: "mac_address",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: false },
      { field: "tags", type: "list", label: "tags", displayList: false },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ]
  },
  {
    name: "Command Line",
    type: "command_line",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: false },
      { field: "tags", type: "list", label: "tags", displayList: false },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ]
  },
  {
    name: "Registry Key",
    type: "registry_key",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: false },
      { field: "tags", type: "list", label: "tags", displayList: false },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ]
  },
  {
    name: "Imphash",
    type: "imphash",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: false },
      { field: "tags", type: "list", label: "tags", displayList: false },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ]
  },
  {
    name: "TSLH",
    type: "tlsh",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: false },
      { field: "tags", type: "list", label: "tags", displayList: false },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ]
  },
  {
    name: "SSDEEP",
    type: "ssdeep",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: false },
      { field: "tags", type: "list", label: "tags", displayList: false },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ]
  },
  {
    name: "Email",
    type: "email",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: false },
      { field: "tags", type: "list", label: "tags", displayList: false },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ]
  },
  {
    name: "Filesystem path",
    type: "path",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: false },
      { field: "tags", type: "list", label: "tags", displayList: false },
      { field: "description", type: "longtext", label: "Description", displayList: false }
    ]
  }
];
