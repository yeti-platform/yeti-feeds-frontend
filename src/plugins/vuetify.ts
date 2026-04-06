/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";
import { md3 } from "vuetify/blueprints";
import { aliases, mdi } from "vuetify/iconsets/mdi";
import colors from "vuetify/util/colors";
import { VTreeview, VTreeviewItem } from "vuetify/labs/VTreeview";

// Composables
import { createVuetify, type ThemeDefinition } from "vuetify";
import { convertCompilerOptionsFromJson } from "typescript";

const yetiDarkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    // primary: "#1867C0",
    // secondary: "#5CBBF6",
    background: "#111111",
    // surface: "#21212121",
    surface: "#212121",
    "surface-alt": "#313131",
    // "primary-darken-1": "#3700B3",
    // "secondary-darken-1": "#018786",
    // error: "#B00020",
    // info: "#2196F3",
    success: colors.green.lighten3,
    error: colors.red.lighten3,
    warning: colors.orange.lighten3,
    // agent chat custom colors
    "agent-bubble": "#333333",
    "agent-thought": "#3d351b",
    "agent-thought-border": "#8c5a45",
    "agent-thought-text": "#f2a685",
    "agent-tool-call": "#1a2a3a",
    "agent-tool-call-border": "#455a64",
    "agent-tool-response": "#1b2e1b",
    "agent-tool-response-border": "#2e4d2e",
    "agent-transfer": "#2e1a2e",
    "agent-transfer-border": "#4a2a4a",
    "agent-transfer-text": "#d199d1",
    // custom
    "app-bar-color": "#212121"
  }
};

const yetiLightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    // background: '#FFFFFF',
    surface: colors.grey.lighten5,
    "surface-alt": colors.grey.lighten4,
    primary: colors.blue.darken1,
    "primary-darken-1": colors.blue.darken2,
    // secondary: '#03DAC6',
    // 'secondary-darken-1': '#018786',
    // error: '#B00020',
    // info: '#2196F3',
    // success: '#4CAF50',
    error: colors.red.lighten3,
    // warning: '#FB8C00',
    // custom
    // agent chat custom colors
    "agent-bubble": "#f5f5f5",
    "agent-thought": "#fff3bc",
    "agent-thought-border": "#d68261",
    "agent-thought-text": "#bf6744",
    "agent-tool-call": "#e3f2fd",
    "agent-tool-call-border": "#90caf9",
    "agent-tool-response": "#e8f5e9",
    "agent-tool-response-border": "#a5d6a7",
    "agent-transfer": "#f3e5f5",
    "agent-transfer-border": "#ce93d8",
    "agent-transfer-text": "#6a1b9a",
    // custom
    cancel: colors.red.darken1,
    "app-bar-color": "#212121"
  }
};

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  defaults: {
    global: {
      ripple: false
    },
    components: {
      VTreeview,
      VTreeviewItem
    },
    VApp: {
      style: 'font-family: "Roboto", sans-serif;'
    },
    VCombobox: {
      variant: "outlined"
    },
    VTextField: {
      variant: "outlined"
    },
    VAutocomplete: {
      variant: "outlined"
    },
    VTextarea: {
      variant: "outlined"
    },
    VBtn: {
      rounded: 1
    },
    VTab: {
      VChip: {
        rounded: 1
      }
    },
    VCard: {
      elevation: 0
    }
  },
  icons: {
    defaultSet: "mdi",
    aliases,
    sets: {
      mdi
    }
  },
  blueprint: md3,
  theme: {
    defaultTheme: "yetiDarkTheme",
    themes: {
      yetiDarkTheme,
      yetiLightTheme
    }
  }
});
