export const OBSERVABLE_TYPES = [
  {
    name: "Generic observable",
    type: "generic",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false },
      { field: "created", type: "datetime", label: "Created", displayList: true }
    ]
  },
  {
    name: "IPv6",
    type: "ipv6",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false },
      { field: "created", type: "datetime", label: "Created", displayList: true }
    ],
    icon: "globe"
  },
  {
    name: "IPv4",
    type: "ipv4",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false },
      { field: "created", type: "datetime", label: "Created", displayList: true }
    ],
    icon: "globe"
  },
  {
    name: "Hostname",
    type: "hostname",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false },
      { field: "created", type: "datetime", label: "Created", displayList: true }
    ],
    icon: "globe"
  },
  {
    name: "Url",
    type: "url",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false },
      { field: "created", type: "datetime", label: "Created", displayList: true }
    ],
    icon: "globe"
  },
  {
    name: "File",
    type: "file",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false },
      { field: "created", type: "datetime", label: "Created", displayList: true }
    ],
    icon: "file"
  },
  {
    name: "SHA256",
    type: "sha256",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false },
      { field: "created", type: "datetime", label: "Created", displayList: true }
    ],
    icon: "lock"
  },
  {
    name: "MD5",
    type: "md5",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false },
      { field: "created", type: "datetime", label: "Created", displayList: true }
    ],
    icon: "lock"
  },
  {
    name: "SHA1",
    type: "sha1",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false },
      { field: "created", type: "datetime", label: "Created", displayList: true }
    ],
    icon: "lock"
  },
  {
    name: "ASN",
    type: "asn",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false },
      { field: "created", type: "datetime", label: "Created", displayList: true }
    ],
    icon: "sitemap"
  },
  {
    name: "Bitcoin Wallet",
    type: "bitcoin_wallet",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false },
      { field: "created", type: "datetime", label: "Created", displayList: true }
    ]
  },
  {
    name: "Certificate",
    type: "certificate",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false },
      { field: "created", type: "datetime", label: "Created", displayList: true }
    ]
  },
  {
    name: "CIDR",
    type: "cidr",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false },
      { field: "created", type: "datetime", label: "Created", displayList: true }
    ]
  },
  {
    name: "Mac Address",
    type: "mac_address",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false },
      { field: "created", type: "datetime", label: "Created", displayList: true }
    ]
  },
  {
    name: "Command Line",
    type: "command_line",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false },
      { field: "created", type: "datetime", label: "Created", displayList: true }
    ]
  },
  {
    name: "Registry Key",
    type: "registry_key",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false },
      { field: "created", type: "datetime", label: "Created", displayList: true }
    ]
  },
  {
    name: "Imphash",
    type: "imphash",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false },
      { field: "created", type: "datetime", label: "Created", displayList: true }
    ]
  },
  {
    name: "TSLH",
    type: "tlsh",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false },
      { field: "created", type: "datetime", label: "Created", displayList: true }
    ]
  },
  {
    name: "SSDEEP",
    type: "ssdeep",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false },
      { field: "created", type: "datetime", label: "Created", displayList: true }
    ]
  },
  {
    name: "Email",
    type: "email",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false },
      { field: "created", type: "datetime", label: "Created", displayList: true }
    ]
  },
  {
    name: "Filesystem path",
    type: "path",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false },
      { field: "created", type: "datetime", label: "Created", displayList: true }
    ]
  },
  {
    name: "Docker Image",
    type: "docker_image",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false },
      { field: "created", type: "datetime", label: "Created", displayList: true }
    ]
  },
  {
    name: "User-Agent",
    type: "user_agent",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false },
      { field: "created", type: "datetime", label: "Created", displayList: true }
    ]
  },
  {
    name: "User-Account",
    type: "user_account",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true },
      { field: "tags", type: "list", label: "tags", displayList: true },
      { field: "description", type: "longtext", label: "Description", displayList: false },
      { field: "created", type: "datetime", label: "Created", displayList: true },
      { field: "user_id", type: "text", label: "Uid", displayList: false },
      { field: "credential", type: "text", label: "Credential", displayList: false },
      { field: "account_login", type: "text", label: "Login", displayList: false },
      { field: "account_type", type: "text", label: "Type", displayList: false },
      { field: "display_name", type: "text", label: "Display name", displayList: false },
      { field: "is_service_account", type: "text", label: "Service account", displayList: false },
      { field: "is_privileged", type: "text", label: "Priviledged", displayList: false },
      { field: "can_escalate_privs", type: "text", label: "Can escalate priviledge", displayList: false },
      { field: "is_disabled", type: "text", label: "Disabled", displayList: false },
      { field: "account_created", type: "datetime", label: "Created on", displayList: false },
      { field: "account_expires", type: "datetime", label: "Expires on", displayList: false },
      { field: "credential_last_changed", type: "datetime", label: "Credential last changed", displayList: false },
      { field: "account_first_login", type: "datetime", label: "First login", displayList: false },
      { field: "account_last_login", type: "datetime", label: "Last login", displayList: false },
    ]
  }
];
