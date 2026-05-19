import { createContext, useContext, useState, type ReactNode } from "react";

export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface Session {
  user: User;
  access_token: string;
}

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user] = useState<User>({
    id: "local-dev-user",
    email: "student@edusim.com",
    user_metadata: {
      full_name: "Student",
      avatar_url: "",
    },
  });

  const [session] = useState<Session>({
    user,
    access_token: "dev-bypass-token",
  });

  return (
    <Ctx.Provider
      value={{
        user,
        session,
        loading: false,
        signOut: async () => {
          console.log("Mock signed out successfully.");
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
