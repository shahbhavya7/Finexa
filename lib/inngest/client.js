import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "Finexa", // Unique app ID
  name: "Finexa",
  retryFunction: async (attempt) => ({ // if the function fails, retry it with exponential backoff i.e. wait for 1 second, then 2 seconds, then 4 seconds
    delay: Math.pow(2, attempt) * 1000, // Exponential backoff
    maxAttempts: 2,
  }),
});
