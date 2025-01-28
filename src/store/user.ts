// Utilities
import { defineStore } from "pinia";
import axios from "axios";

export enum Role {
  WRITER = 3,
  OWNER = 7
}

export const useUserStore = defineStore("user", {
  state: () => ({
    user: null
  }),
  actions: {
    async OIDCBrowserRedirect() {
      window.location.href = "/api/v2/auth/oidc-login";
    },
    async OIDCAsyncRefresh() {
      return new Promise((resolve, reject) => {
        var popup = window.open("/api/v2/auth/oidc-login", "OIDC Login", "width=800,height=600");
        const store = this;
        var timer = setInterval(function () {
          store
            .userCheck()
            .then(() => {
              if (store.user !== null) {
                popup?.close();
                clearInterval(timer);
                resolve(store.user);
              }
            })
            .catch(error => {
              popup?.close();
              console.log(error);
              clearInterval(timer);
              reject(error);
            });
        }, 2000);
      });
    },
    async userCheck() {
      return new Promise((resolve, reject) => {
        axios
          .get("/api/v2/auth/me")
          .then(response => {
            console.log("User check success");
            this.user = response.data;
            resolve(response);
          })
          .catch(err => {
            console.log("User check fail");
            this.user = null;
            reject(err.response.data.detail);
          });
      });
    },
    async userLocalLogin(form) {
      return new Promise((resolve, reject) => {
        axios
          .post("/api/v2/auth/token", form)
          .then(response => {
            console.log("User login success");
            this.userCheck().then(() => resolve(response));
          })
          .catch(err => {
            console.log(err);
            console.log(`User login fail: ${err.response.data.detail}`);
            this.user = null;
            reject(err);
          });
      });
    },
    async userLocalLogout() {
      return new Promise((resolve, reject) => {
        axios
          .post("/api/v2/auth/logout")
          .then(response => {
            console.log("User logout success");
            this.user = null;
            resolve(response);
          })
          .catch(err => {
            console.log("User logout fail");
            reject(err);
          });
      });
    },
    hasEditPerms(object: Object): boolean {
      let role = object?.acls[this.user.username]?.role;
      return this.user.admin || (role & Role.WRITER) === Role.WRITER;
    },

    hasOwnerPerms(object: Object): boolean {
      let role = object?.acls[this.user.username]?.role;
      return this.user.admin || (role & Role.OWNER) === Role.OWNER;
    }
  }
});
