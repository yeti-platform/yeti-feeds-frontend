export const LINK_SUGGESTIONS = {
  "attack-pattern": [
    { verb: "delivers", targets: ["malware"] },
    { verb: "targets", targets: ["identity", "location", "vulnerability"] },
    { verb: "uses", targets: ["malware", "tool"] }
  ],
  campaign: [
    { verb: "attributed-to", targets: ["intrusion-set", "threat-actor"] },
    { verb: "compromises", targets: ["infrastructure"] },
    { verb: "originates-from", targets: ["location"] },
    { verb: "targets", targets: ["identity", "location", "vulnerability"] },
    {
      verb: "uses",
      targets: ["attack-pattern", "infrastructure", "malware", "tool"]
    }
  ],
  "course-of-action": [
    { verb: "investigates", targets: ["indicator"] },
    {
      verb: "mitigates",
      targets: ["attack-pattern", "indicator", "malware", "tool", "vulnerability"]
    },
    { verb: "remediates", targets: ["malware", "vulnerability"] }
  ],
  identity: [{ verb: "logated-at", targets: ["location"] }],
  indicator: [
    {
      verb: "indicates",
      targets: ["attack-pattern", "campaign", "infrastructure", "intrusion-set", "malware", "threat-actor", "tool"]
    },
    { verb: "based-on", targets: ["observable"] }
  ],
  infrastructure: [
    { verb: "communicates-with", targets: ["infrastructure"] },
    { verb: "consists-of", targets: ["infrastructure", "observable"] },
    { verb: "controls", targets: ["infrastructure", "malware"] },
    { verb: "delivers", targets: ["malware"] },
    { verb: "has", targets: ["vulnerability"] },
    { verb: "hosts", targets: ["tool", "malware"] },
    { verb: "located-at", targets: ["location"] },
    { verb: "infrastructure", targets: ["infrastructure"] }
  ],
  investigation: [{ verb: "linked-to", targets: [] }],
  "intrusion-set": [
    { verb: "attributed-to", targets: ["threat-actor"] },
    { verb: "compromises", targets: ["infrastructure"] },
    { verb: "hosts", targets: ["infrastructure"] },
    { verb: "owns", targets: ["infrastructure"] },
    { verb: "originates-from", targets: ["location"] },
    { verb: "targets", targets: ["identity", "location", "vulnerability"] },
    {
      verb: "uses",
      targets: ["attack-pattern", "infrastructure", "malware", "tool"]
    }
  ],
  location: [],
  malware: [
    { verb: "authored-by", targets: ["threat-actor", "intrusion-set"] },
    { verb: "beacons-to", targets: ["infrastructure"] },
    { verb: "exfiltrates-to", targets: ["infrastructure"] },
    {
      verb: "communicates-with",
      targets: ["ipv4", "ipv6", "cidr", "hostname", "url"]
    },
    { verb: "controls", targets: ["malware"] },
    { verb: "downloads", targets: ["malware", "tool", "file"] },
    { verb: "drops", targets: ["malware", "tool", "file"] },
    { verb: "exploits", targets: ["vulnerability"] },
    { verb: "originates-from", targets: ["location"] },
    {
      verb: "targets",
      targets: ["identity", "infrastructure", "location", "vulnerability"]
    },
    {
      verb: "uses",
      targets: ["attack-pattern", "infrastructure", "malware", "tool"]
    },
    { verb: "variant-of", targets: ["malware"] }
  ],
  "threat-actor": [
    { verb: "attributed-to", targets: ["identity"] },
    { verb: "compromises", targets: ["infrastructure"] },
    { verb: "hosts", targets: ["infrastructure"] },
    { verb: "owns", targets: ["infrastructure"] },
    { verb: "impersonates", targets: ["identity"] },
    { verb: "located-at", targets: ["location"] },
    { verb: "targets", targets: ["identity", "location", "vulnerability"] },
    {
      verb: "uses",
      targets: ["attack-pattern", "infrastructure", "malware", "tool"]
    }
  ],
  tool: [
    { verb: "delivers", targets: ["malware"] },
    { verb: "drops", targets: ["malware"] },
    { verb: "has", targets: ["vulnerability"] },
    {
      verb: "targets",
      targets: ["identity", "infrastructure", "location", "vulnerability"]
    },
    { verb: "uses", targets: ["infrastructure"] }
  ],
  vulnerability: [],
  // DFIQ
  scenario: [{ verb: "Uses DFIQ facet", targets: ["facet"] }],
  facet: [{ verb: "Uses DFIQ question", targets: ["question"] }],
  question: [{ verb: "Uses DFIQ approach", targets: ["approach"] }],
  approach: [{ verb: "Uses indicator", targets: ["indicator"] }]
};
