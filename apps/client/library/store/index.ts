import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: { id: string; email: string } | null;
  actions: {
    setToken: (token: string) => void;
    clearAuth: () => void;
    setUser: (user: { id: string; email: string }) => void;
  };
}

const createAuthSlice = (set: any): AuthState => ({
  token: null,
  isAuthenticated: false,
  user: null,
  actions: {
    setToken: (token: string) => {
      set({ token, isAuthenticated: true }, false, "auth/setToken");
    },
    clearAuth: () => {
      set({ token: null, isAuthenticated: false, user: null }, false, "auth/clearAuth");
    },
    setUser: (user: { id: string; email: string }) => {
      set({ user }, false, "auth/setUser");
    },
  },
});

type StateFromFunctions<T extends [...any]> = T extends [infer F, ...infer R]
  ? F extends (...args: any) => object
    ? StateFromFunctions<R> & ReturnType<F>
    : unknown
  : unknown;

type State = StateFromFunctions<[typeof createAuthSlice]>;

const useStore = create<State>()(
  devtools(
    (set, get, store) => ({
      ...createAuthSlice(set),
    }),
    { name: "Agentix" }
  )
);

export default useStore;
