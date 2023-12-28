// Composables
import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/Login.vue")
  },
  {
    path: "/",
    redirect: { name: "ObservableMatch" },
    name: "Home"
  },
  {
    path: "/search",
    component: () => import("@/layouts/default/Default.vue"),
    children: [
      {
        path: "",
        name: "ObservableMatch",
        component: () => import("@/views/ObservableMatch.vue")
      }
    ]
  },
  {
    path: "/observables",
    component: () => import("@/layouts/default/Default.vue"),
    children: [
      {
        path: "",
        name: "ObservableSearch",
        component: () => import("@/views/ObservableSearch.vue")
      },
      {
        path: ":id([0-9]+)",
        name: "ObservableDetails",
        component: () => import("@/views/ObservableDetails.vue"),
        props: true
      }
    ]
  },
  {
    path: "/entities",
    component: () => import("@/layouts/default/Default.vue"),
    children: [
      {
        path: "",
        name: "Entities",
        component: () => import("@/views/EntitySearch.vue")
      },
      {
        path: ":id([0-9]+)",
        name: "EntityDetails",
        component: () => import("@/views/ObjectDetails.vue"),
        props: route => ({ id: String(route.params.id), objectType: "entity" })
      }
    ]
  },
  {
    path: "/indicators",
    component: () => import("@/layouts/default/Default.vue"),
    children: [
      {
        path: "",
        name: "Indicators",
        component: () => import("@/views/IndicatorSearch.vue")
      },
      {
        path: ":id([0-9]+)",
        name: "IndicatorDetails",
        component: () => import("@/views/ObjectDetails.vue"),
        props: route => ({ id: String(route.params.id), objectType: "indicator" })
      }
    ]
  },
  {
    path: "/feeds",
    component: () => import("@/layouts/default/Default.vue"),
    children: [
      {
        path: "",
        name: "Feeds",
        component: () => import("@/components/TaskList.vue"),
        props: { taskType: "feed" }
      }
    ]
  },
  {
    path: "/analytics",
    component: () => import("@/layouts/default/Default.vue"),
    children: [
      {
        path: "",
        name: "Analytics",
        component: () => import("@/views/AnalyticsList.vue"),
        props: true
      }
    ]
  },
  {
    path: "/exports",
    component: () => import("@/layouts/default/Default.vue"),
    children: [
      {
        path: "",
        name: "Exports",
        component: () => import("@/views/ExportList.vue"),
        props: true
      }
    ]
  },
  {
    path: "/exports/templates",
    component: () => import("@/layouts/default/Default.vue"),
    children: [
      {
        path: "",
        name: "ExportTemplates",
        component: () => import("@/views/ExportTemplates.vue"),
        props: true
      }
    ]
  },
  {
    path: "/profile",
    component: () => import("@/layouts/default/Default.vue"),
    children: [
      {
        path: "",
        name: "UserProfile",
        component: () => import("@/views/UserProfile.vue"),
        props: true
      },
      {
        path: ":id([0-9]+)",
        name: "UserProfileAdmin",
        component: () => import("@/views/UserProfile.vue"),
        props: true
      }
    ]
  },
  {
    path: "/admin",
    component: () => import("@/layouts/default/Default.vue"),
    children: [
      {
        path: "users",
        name: "UserAdmin",
        component: () => import("@/views/UserAdmin.vue"),
        props: true
      },
      {
        path: "tags",
        name: "TagsAdmin",
        component: () => import("@/views/TagsAdmin.vue"),
        props: true
      },
      {
        path: "system",
        name: "System",
        component: () => import("@/views/System.vue"),
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
