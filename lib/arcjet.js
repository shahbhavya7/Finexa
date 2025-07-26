import arcjet, { tokenBucket } from "@arcjet/next";

const aj = arcjet({
  key: process.env.ARCJET_KEY, // Your Arcjet API key
  characteristics: ["userId"], // Track based on Clerk userId
  rules: [
    // Rate limiting specifically for collection creation
    tokenBucket({
      mode: "LIVE", // Use LIVE mode for real-time rate limiting
      refillRate: 10, // refill 10 tokens per interval i.e, 10 requests per hour
      interval: 3600, // 1 hour in seconds
      capacity: 10, // maximum of 10 requests can be made in an hour
    }),
  ],
});

export default aj;
