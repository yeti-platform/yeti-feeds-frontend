export const OBSERVABLE_TYPES = [
  {
    name: "Generic observable",
    type: "generic",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true, editable: true },
      { field: "tags", type: "list", label: "tags", displayList: true, editable: false },
      { field: "created", type: "datetime", label: "Created", displayList: true, editable: false }
    ],
    icon: "mdi-magnify"
  },
  {
    name: "IPv6",
    type: "ipv6",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true, editable: true },
      { field: "tags", type: "list", label: "tags", displayList: true, editable: false },
      { field: "created", type: "datetime", label: "Created", displayList: true, editable: false }
    ],
    icon: "mdi-ip-network"
  },
  {
    name: "IPv4",
    type: "ipv4",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true, editable: true },
      { field: "tags", type: "list", label: "tags", displayList: true, editable: false },
      { field: "created", type: "datetime", label: "Created", displayList: true, editable: false }
    ],
    icon: "mdi-ip-network"
  },
  {
    name: "Hostname",
    type: "hostname",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true, editable: true },
      { field: "tags", type: "list", label: "tags", displayList: true, editable: false },
      { field: "created", type: "datetime", label: "Created", displayList: true, editable: false }
    ],
    icon: "mdi-domain"
  },
  {
    name: "Url",
    type: "url",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true, editable: true },
      { field: "tags", type: "list", label: "tags", displayList: true, editable: false },
      { field: "created", type: "datetime", label: "Created", displayList: true, editable: false }
    ],
    icon: "mdi-web"
  },
  {
    name: "File",
    type: "file",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true, editable: true },
      { field: "tags", type: "list", label: "tags", displayList: true, editable: false },
      { field: "created", type: "datetime", label: "Created", displayList: true, editable: false }
    ],
    icon: "mdi-file"
  },
  {
    name: "SHA256",
    type: "sha256",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true, editable: true },
      { field: "tags", type: "list", label: "tags", displayList: true, editable: false },
      { field: "created", type: "datetime", label: "Created", displayList: true, editable: false }
    ],
    icon: "mdi-pound"
  },
  {
    name: "MD5",
    type: "md5",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true, editable: true },
      { field: "tags", type: "list", label: "tags", displayList: true, editable: false },
      { field: "created", type: "datetime", label: "Created", displayList: true, editable: false }
    ],
    icon: "mdi-pound"
  },
  {
    name: "SHA1",
    type: "sha1",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true, editable: true },
      { field: "tags", type: "list", label: "tags", displayList: true, editable: false },
      { field: "created", type: "datetime", label: "Created", displayList: true, editable: false }
    ],
    icon: "mdi-pound"
  },
  {
    name: "ASN",
    type: "asn",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true, editable: true },
      { field: "tags", type: "list", label: "tags", displayList: true, editable: false },
      { field: "created", type: "datetime", label: "Created", displayList: true, editable: false }
    ],
    icon: "sitemap"
  },
  {
    name: "Wallet",
    type: "wallet",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true, editable: true },
      { field: "coin", type: "text", label: "Coin", displayList: false, editable: true },
      { field: "address", type: "text", label: "Address", displayList: false, editable: true },
      { field: "tags", type: "list", label: "tags", displayList: true, editable: false },
      { field: "created", type: "datetime", label: "Created", displayList: true, editable: false }
    ],
    icon: "mdi-wallet-bifold"
  },
  {
    name: "Certificate",
    type: "certificate",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true, editable: true },
      { field: "tags", type: "list", label: "tags", displayList: true, editable: false },
      { field: "created", type: "datetime", label: "Created", displayList: true, editable: false }
    ],
    icon: "mdi-certificate"
  },
  {
    name: "CIDR",
    type: "cidr",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true, editable: true },
      { field: "tags", type: "list", label: "tags", displayList: true, editable: false },
      { field: "created", type: "datetime", label: "Created", displayList: true, editable: false }
    ],
    icon: "mdi-ip-network"
  },
  {
    name: "Mac Address",
    type: "mac_address",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true, editable: true },
      { field: "tags", type: "list", label: "tags", displayList: true, editable: false },
      { field: "created", type: "datetime", label: "Created", displayList: true, editable: false }
    ],
    icon: "mdi-eye-outline"
  },
  {
    name: "Command Line",
    type: "command_line",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true, editable: true },
      { field: "tags", type: "list", label: "tags", displayList: true, editable: false },
      { field: "created", type: "datetime", label: "Created", displayList: true, editable: false }
    ]
  },
  {
    name: "Registry Key",
    type: "registry_key",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true, editable: true },
      { field: "tags", type: "list", label: "tags", displayList: true, editable: false },
      { field: "created", type: "datetime", label: "Created", displayList: true, editable: false }
    ],
    icon: "mdi-key"
  },
  {
    name: "Imphash",
    type: "imphash",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true, editable: true },
      { field: "tags", type: "list", label: "tags", displayList: true, editable: false },
      { field: "created", type: "datetime", label: "Created", displayList: true, editable: false }
    ],
    icon: "mdi-hash"
  },
  {
    name: "TLSH",
    type: "tlsh",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true, editable: true },
      { field: "tags", type: "list", label: "tags", displayList: true, editable: false },
      { field: "created", type: "datetime", label: "Created", displayList: true, editable: false }
    ],
    icon: "mdi-hash"
  },
  {
    name: "SSDEEP",
    type: "ssdeep",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true, editable: true },
      { field: "tags", type: "list", label: "tags", displayList: true, editable: false },
      { field: "created", type: "datetime", label: "Created", displayList: true, editable: false }
    ],
    icon: "mdi-hash"
  },
  {
    name: "Email",
    type: "email",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true, editable: true },
      { field: "tags", type: "list", label: "tags", displayList: true, editable: false },
      { field: "created", type: "datetime", label: "Created", displayList: true, editable: false }
    ],
    icon: "mdi-at"
  },
  {
    name: "Filesystem path",
    type: "path",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true, editable: true },
      { field: "tags", type: "list", label: "tags", displayList: true, editable: false },
      { field: "created", type: "datetime", label: "Created", displayList: true, editable: false }
    ],
    icon: "mdi-slash-forward"
  },
  {
    name: "Docker Image",
    type: "docker_image",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true, editable: true },
      { field: "tags", type: "list", label: "tags", displayList: true, editable: false },
      { field: "created", type: "datetime", label: "Created", displayList: true, editable: false }
    ],
    icon: "mdi-docker"
  },
  {
    name: "User-Agent",
    type: "user_agent",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true, editable: true },
      { field: "tags", type: "list", label: "tags", displayList: true, editable: false },
      { field: "created", type: "datetime", label: "Created", displayList: true, editable: false }
    ],
    icon: "mdi-account-circle"
  },
  {
    name: "User Account",
    type: "user_account",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true, editable: true },
      { field: "tags", type: "list", label: "tags", displayList: true, editable: false },
      { field: "created", type: "datetime", label: "Created", displayList: true, editable: false },
      { field: "user_id", type: "text", label: "UID", displayList: false, editable: true },
      { field: "credential", type: "text", label: "Credential", displayList: false, editable: true },
      { field: "account_login", type: "text", label: "Login", displayList: false, editable: true },
      { field: "account_type", type: "text", label: "Type", displayList: false, editable: true },
      { field: "display_name", type: "text", label: "Display name", displayList: false, editable: true },
      { field: "is_service_account", type: "bool", label: "Service account", displayList: false, editable: true },
      { field: "is_privileged", type: "bool", label: "Privileged", displayList: false, editable: true },
      {
        field: "can_escalate_privs",
        type: "bool",
        label: "Can escalate privileges",
        displayList: false,
        editable: true
      },
      { field: "is_disabled", type: "bool", label: "Disabled", displayList: false, editable: true },
      { field: "account_created", type: "datetime", label: "Creation date", displayList: false, editable: true },
      { field: "account_expires", type: "datetime", label: "Exppiration date", displayList: false, editable: true },
      {
        field: "credential_last_changed",
        type: "datetime",
        label: "Credential last changed",
        displayList: false,
        editable: true
      },
      { field: "account_first_login", type: "datetime", label: "First login", displayList: false, editable: true },
      { field: "account_last_login", type: "datetime", label: "Last login", displayList: false, editable: true }
    ],
    icon: "mdi-account"
  },
  {
    name: "IBAN",
    type: "iban",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true, editable: true },
      { field: "tags", type: "list", label: "tags", displayList: true, editable: false },
      { field: "created", type: "datetime", label: "Created", displayList: true, editable: false }
    ],
    icon: "mdi-bank"
  },
  {
    name: "BIC",
    type: "bic",
    fields: [
      { field: "value", type: "text", label: "Value", displayList: true, editable: true },
      { field: "tags", type: "list", label: "tags", displayList: true, editable: false },
      { field: "created", type: "datetime", label: "Created", displayList: true, editable: false }
    ],
    icon: "mdi-bank"
  }
];
