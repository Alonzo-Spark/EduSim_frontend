export const lovable = {
  auth: {
    signInWithOAuth: async (provider: string, opts?: any) => {
      console.log("Mock social OAuth bypassed successfully for:", provider);
      return { redirected: false, tokens: null, error: null };
    },
  },
};
