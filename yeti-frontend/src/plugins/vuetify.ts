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

// Composables
import { createVuetify } from "vuetify";

const yetiDarkTheme = {
  dark: true,
  colors: {
    // primary: "#1867C0",
    // secondary: "#5CBBF6",
    background: "#111111",
    surface: "#21212121"
    // "primary-darken-1": "#3700B3",
    // "secondary-darken-1": "#018786",
    // error: "#B00020",
    // info: "#2196F3",
    // success: "#4CAF50",
    // warning: "#FB8C00"
  }
};

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  defaults: {
    global: {
      ripple: false
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
    VTextArea: {
      variant: "outlined"
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
      yetiDarkTheme
    }
  }
});
