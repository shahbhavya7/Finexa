"use server";

import { Resend } from "resend";

export async function sendEmail({ to, subject, react }) {
  const resend = new Resend(process.env.RESEND_API_KEY || ""); // Ensure the API key is set

  try {
    const data = await resend.emails.send({ // Use the Resend API to send an email
      from: "Finexa <onboarding@resend.dev>", // Replace with your sender email
      to, // The recipient's email address
      subject, // The subject of the email
      react, // The React component to render as the email body
    });

    return { success: true, data }; // Return success status and response data
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}
