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
import colors from 'vuetify/util/colors'

// Composables
import { createVuetify , type ThemeDefinition} from "vuetify";
import { convertCompilerOptionsFromJson } from "typescript";

const yetiDarkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    // primary: "#1867C0",
    // secondary: "#5CBBF6",
    background: "#111111",
    surface: "#21212121",
    // "primary-darken-1": "#3700B3",
    // "secondary-darken-1": "#018786",
    // error: "#B00020",
    // info: "#2196F3",
    success: colors.green.lighten3,
    error: colors.red.lighten3,
    warning: colors.orange.lighten3,
    // custom
    "app-bar-color": '#212121'
  },
};

const yetiLightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    // background: '#FFFFFF',
    surface: colors.grey.lighten5,
    primary: colors.blue.darken1,
    'primary-darken-1': colors.blue.darken2,
    // secondary: '#03DAC6',
    // 'secondary-darken-1': '#018786',
    // error: '#B00020',
    // info: '#2196F3',
    // success: '#4CAF50',
    // warning: '#FB8C00',
    // custom
    cancel: colors.red.darken1,
    "app-bar-color": '#212121'
  },
};

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  defaults: {
    global: {
      ripple: false,
    },
    VDataTableServer: {
      class: 'fixed-layout',
    },
    VDataTable: {
      class: 'fixed-layout',
    },
    VApp: {
     style: 'font-family: "system-ui", sans-serif;'
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
      yetiDarkTheme, yetiLightTheme
    }
  }
});
