// Utilities
import { defineStore } from "pinia";
import axios from "axios";

export const useUserStore = defineStore("user", {
  state: () => ({
    user: null
  }),
  actions: {
    async OIDCRefresh() {
      var popup = window.open("/api/v2/auth/oidc-login", "OIDC Login", "width=800,height=600");
      const store = this;
      var timer = setInterval(function() {
        store
          .userCheck()
          .then(() => {
            if (store.user !== null) {
              popup?.close();
              clearInterval(timer);
            }
          })
          .catch(error => {
            console.log(error);
          });
      }, 500);
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
            reject(err);
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
    }
  }
});
