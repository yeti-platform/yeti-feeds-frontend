import { defineStore } from "pinia";

import * as authApi from "@/services/auth";
import type { LooseYetiObject, User } from "@/services/types";

/**
 * The backend's `Permission` IntFlag: READ=1, WRITE=2, OWNER=4. The roles stored
 * on an ACL are combinations of those.
 */
export enum Role {
  WRITER = 3,
  OWNER = 7
}

interface UserState {
  user: User | null;
}

export const useUserStore = defineStore("user", {
  state: (): UserState => ({
    user: null
  }),
  actions: {
    OIDCBrowserRedirect() {
      window.location.href = authApi.OIDC_LOGIN_URL;
    },

    /** Resolves with the logged-in user; rejects (and clears it) if there is none. */
    async userCheck(): Promise<User> {
      try {
        this.user = await authApi.me();
        return this.user;
      } catch (error) {
        this.user = null;
        throw error;
      }
    },

    async userLocalLogin(username: string, password: string): Promise<User> {
      try {
        await authApi.login(username, password);
      } catch (error) {
        this.user = null;
        throw error;
      }
      return this.userCheck();
    },

    async userLocalLogout(): Promise<void> {
      await authApi.logout();
      this.user = null;
    },

    /** True if the current user may edit `object` — admins always may. */
    hasEditPerms(object: LooseYetiObject): boolean {
      return this.hasRole(object, Role.WRITER);
    },

    hasOwnerPerms(object: LooseYetiObject): boolean {
      return this.hasRole(object, Role.OWNER);
    },

    hasRole(object: LooseYetiObject, role: Role): boolean {
      if (!this.user) {
        return false;
      }
      if (this.user.admin) {
        return true;
      }
      // Objects outside RBAC (and DFIQ) carry no acls at all.
      const granted = object?.acls?.[this.user.username]?.role ?? 0;
      return (granted & role) === role;
    }
  }
});
