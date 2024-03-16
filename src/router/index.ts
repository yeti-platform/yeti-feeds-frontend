// Composables
import { createRouter, createWebHistory } from "vue-router";

import Default from "@/layouts/default/Default.vue";
import Login from "@/views/Login.vue";

import ObservableMatch from "@/views/ObservableMatch.vue";
import ObservableSearch from "@/views/ObservableSearch.vue";
import ObservableDetails from "@/views/ObservableDetails.vue";
import ObjectDetails from "@/views/ObjectDetails.vue";
import EntitySearch from "@/views/EntitySearch.vue";
import IndicatorSearch from "@/views/IndicatorSearch.vue";
import DFIQSearch from "@/views/DFIQSearch.vue";
import FeedList from "@/views/FeedList.vue";
import AnalyticsList from "@/views/AnalyticsList.vue";
import ExportList from "@/views/ExportList.vue";
import ExportTemplates from "@/views/ExportTemplates.vue";
import TaskList from "@/components/TaskList.vue";
import UserProfile from "@/views/UserProfile.vue";
import UserAdmin from "@/views/UserAdmin.vue";
import TagsAdmin from "@/views/TagsAdmin.vue";
import System from "@/views/System.vue";

const routes = [
  {
    path: "/login",
    name: "Login",
    component: Login
  },
  {
    path: "/",
    redirect: { name: "ObservableMatch" },
    name: "Home"
  },
  {
    path: "/search",
    component: Default,
    children: [
      {
        path: "",
        name: "ObservableMatch",
        component: ObservableMatch
      }
    ]
  },
  {
    path: "/observables",
    component: Default,
    children: [
      {
        path: "",
        name: "ObservableSearch",
        component: ObservableSearch
      },
      {
        path: ":id([0-9]+)",
        name: "ObservableDetails",
        component: ObservableDetails,
        props: true
      }
    ]
  },
  {
    path: "/entities",
    component: Default,
    children: [
      {
        path: "",
        name: "Entities",
        component: EntitySearch
      },
      {
        path: ":id([0-9]+)",
        name: "EntityDetails",
        component: ObjectDetails,
        props: route => ({ id: String(route.params.id), objectType: "entity" })
      }
    ]
  },
  {
    path: "/indicators",
    component: Default,
    children: [
      {
        path: "",
        name: "Indicators",
        component: IndicatorSearch
      },
      {
        path: ":id([0-9]+)",
        name: "IndicatorDetails",
        component: ObjectDetails,
        props: route => ({ id: String(route.params.id), objectType: "indicator" })
      }
    ]
  },
  {
    path: "/dfiq",
    component: Default,
    children: [
      {
        path: "",
        name: "DFIQ",
        component: DFIQSearch
      },
      {
        path: ":id([0-9]+)",
        name: "DFIQDetails",
        component: ObjectDetails,
        props: route => ({ id: String(route.params.id), objectType: "dfiq" })
      }
    ]
  },
  {
    path: "/feeds",
    component: Default,
    children: [
      {
        path: "",
        name: "Feeds",
        component: FeedList,
        props: true
      }
    ]
  },
  {
    path: "/analytics",
    component: Default,
    children: [
      {
        path: "",
        name: "Analytics",
        component: AnalyticsList,
        props: true
      }
    ]
  },
  {
    path: "/exports",
    component: Default,
    children: [
      {
        path: "",
        name: "Exports",
        component: ExportList,
        props: true
      }
    ]
  },
  {
    path: "/exports/templates",
    component: Default,
    children: [
      {
        path: "",
        name: "ExportTemplates",
        component: ExportTemplates,
        props: true
      }
    ]
  },
  {
    path: "/profile",
    component: Default,
    children: [
      {
        path: "",
        name: "UserProfile",
        component: UserProfile,
        props: true
      },
      {
        path: ":id([0-9]+)",
        name: "UserProfileAdmin",
        component: UserProfile,
        props: true
      }
    ]
  },
  {
    path: "/admin",
    component: Default,
    children: [
      {
        path: "users",
        name: "UserAdmin",
        component: UserAdmin,
        props: true
      },
      {
        path: "tags",
        name: "TagsAdmin",
        component: TagsAdmin,
        props: true
      },
      {
        path: "system",
        name: "System",
        component: System,
        props: true
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

import { useUserStore } from "../store/user";

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore();
  if (to.name === "Login") {
    next();
  } else if (userStore.user === null) {
    userStore
      .userCheck()
      .then(() => {
        if (userStore.user === null) {
          console.log("Pinia: user null, redirecting to login");
          next({ name: "Login" });
        } else {
          console.log("Pinia: got user, continuing");
          next();
        }
      })
      .catch(error => {
        console.log(error);
        console.log("Pinia: Not authed; redirecting to Login");
        next({ name: "Login" });
      });
  } else {
    next();
  }
});

export default router;
