import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

export const checkUser = async () => { // Function to check if the user exists in the database
  const user = await currentUser(); // Get the current user from Clerk

  if (!user) { // If no user is logged in, return null
    return null;
  }

  try {
    const loggedInUser = await db.user.findUnique({ // Check if the user already exists in the database
      where: {
        clerkUserId: user.id, // clerkUserId field is in database and if it matches the current user's ID, it means the user exists
      },
    });

    if (loggedInUser) { // If the user exists, return the logged-in user
      return loggedInUser;
    }

    const name = `${user.firstName} ${user.lastName}`; // else create a new user in the database

    const newUser = await db.user.create({ // Create a new user with the current user's details
      // Use the user object from Clerk to populate the fields
      // clerkUserId is the ID of the user in Clerk, name is the full name
      // imageUrl is the URL of the user's profile picture, email is the primary email address
      // Note: user.emailAddresses[0].emailAddress is used to get the primary email
      data: {
        clerkUserId: user.id,
        name,
        imageUrl: user.imageUrl,
        email: user.emailAddresses[0].emailAddress,
      },
    });

    return newUser; // Return the newly created user
  } catch (error) {
    console.log(error.message);
  }
};
