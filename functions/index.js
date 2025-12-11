const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const { Resend } = require("resend");

admin.initializeApp();

// Set global options
setGlobalOptions({ maxInstances: 10, region: "us-central1" });

// Define the secret
const resendApiKey = defineSecret("RESEND_API_KEY");

// Branding constants
const LOGO_URL = "https://spillstack.com/logo.png";
const BRAND_COLOR = "#22C55E";
const BRAND_BLUE = "#4F7DFF";

// Reusable email template wrapper
const emailTemplate = (content, showUnsubscribe = false) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #050811;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #050811; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 520px;" cellpadding="0" cellspacing="0">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <img src="${LOGO_URL}" alt="SpillStack" width="180" style="filter: invert(1);" />
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background-color: #0C1220; border-radius: 16px; padding: 32px; border: 1px solid #222B3D;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 24px;">
              <p style="color: #818BA3; font-size: 13px; margin: 0;">
                SpillStack - Capture ideas, accomplish more
              </p>
              ${showUnsubscribe ? `
              <p style="color: #818BA3; font-size: 12px; margin: 8px 0 0 0;">
                <a href="https://spillstack.com/unsubscribe" style="color: #4F7DFF; text-decoration: none;">Unsubscribe</a> from marketing emails
              </p>
              ` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Welcome email when a new user signs up
exports.sendWelcomeEmail = onDocumentCreated(
  {
    document: "users/{userId}",
    secrets: [resendApiKey],
  },
  async (event) => {
    const resend = new Resend(resendApiKey.value());

    const snapshot = event.data;
    if (!snapshot) return;

    const userData = snapshot.data();
    const email = userData?.email;
    const displayName = userData?.displayName;

    if (!email) {
      console.log("No email found for user");
      return;
    }

    const greeting = displayName ? `Hey ${displayName.split(' ')[0]}!` : "Welcome!";

    const content = `
      <h1 style="color: ${BRAND_COLOR}; font-size: 28px; margin: 0 0 16px 0; font-weight: 700;">
        ${greeting}
      </h1>
      <p style="color: #F4F6FF; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Your SpillStack account is ready. Start capturing your ideas, tasks, and thoughts - they'll sync across all your devices.
      </p>

      <div style="background-color: #050811; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="color: #B7C0D8; font-size: 15px; margin: 0 0 12px 0; font-weight: 600;">Quick tips to get started:</p>
        <table cellpadding="0" cellspacing="0" style="width: 100%;">
          <tr>
            <td style="padding: 8px 0; color: #B7C0D8; font-size: 14px;">
              <span style="color: ${BRAND_COLOR}; margin-right: 8px;">🎙</span> Tap the mic to capture ideas with your voice
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #B7C0D8; font-size: 14px;">
              <span style="color: ${BRAND_COLOR}; margin-right: 8px;">⌨️</span> Use the keyboard for quick text input
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #B7C0D8; font-size: 14px;">
              <span style="color: ${BRAND_COLOR}; margin-right: 8px;">✨</span> Ideas are automatically categorized by AI
            </td>
          </tr>
        </table>
      </div>

      <a href="https://apps.apple.com/app/spillstack" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px;">
        Open SpillStack
      </a>

      <p style="color: #818BA3; font-size: 14px; margin: 24px 0 0 0;">
        Questions? Just reply to this email - we'd love to hear from you.
      </p>
    `;

    try {
      await resend.emails.send({
        from: "SpillStack <hello@spillstack.com>",
        to: email,
        subject: "Welcome to SpillStack! 🚀",
        html: emailTemplate(content),
      });
      console.log("Welcome email sent to:", email);
    } catch (error) {
      console.error("Failed to send welcome email:", error);
    }
  }
);

// Generate a 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification code email (for email verification on signup)
exports.sendVerificationCode = onCall(
  {
    secrets: [resendApiKey],
  },
  async (request) => {
    const resend = new Resend(resendApiKey.value());
    const db = admin.firestore();

    // User must be authenticated
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const userId = request.auth.uid;
    const email = request.auth.token.email;

    if (!email) {
      throw new HttpsError("invalid-argument", "No email associated with account");
    }

    // Generate code and store it
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.collection("verificationCodes").doc(userId).set({
      code,
      email,
      expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const content = `
      <h1 style="color: #F4F6FF; font-size: 24px; margin: 0 0 16px 0; font-weight: 700;">
        Verify your email
      </h1>
      <p style="color: #B7C0D8; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Enter this code in the app to verify your email address:
      </p>

      <div style="background-color: #050811; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 36px; font-weight: 700; color: ${BRAND_COLOR}; letter-spacing: 8px; font-family: monospace;">
          ${code}
        </span>
      </div>

      <p style="color: #818BA3; font-size: 14px; margin: 0;">
        This code expires in 10 minutes. If you didn't create a SpillStack account, you can safely ignore this email.
      </p>
    `;

    try {
      await resend.emails.send({
        from: "SpillStack <verify@spillstack.com>",
        to: email,
        subject: `${code} is your SpillStack verification code`,
        html: emailTemplate(content),
      });
      console.log("Verification code sent to:", email);
      return { success: true };
    } catch (error) {
      console.error("Failed to send verification email:", error);
      throw new HttpsError("internal", "Failed to send verification email");
    }
  }
);

// Verify the code entered by user
exports.verifyEmailCode = onCall(
  {
    secrets: [resendApiKey],
  },
  async (request) => {
    const db = admin.firestore();

    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const userId = request.auth.uid;
    const { code } = request.data;

    if (!code) {
      throw new HttpsError("invalid-argument", "Code is required");
    }

    // Get stored verification code
    const codeDoc = await db.collection("verificationCodes").doc(userId).get();

    if (!codeDoc.exists) {
      throw new HttpsError("not-found", "No verification code found. Please request a new one.");
    }

    const codeData = codeDoc.data();

    // Check if expired
    if (codeData.expiresAt.toDate() < new Date()) {
      await db.collection("verificationCodes").doc(userId).delete();
      throw new HttpsError("deadline-exceeded", "Code has expired. Please request a new one.");
    }

    // Check if code matches
    if (codeData.code !== code) {
      throw new HttpsError("invalid-argument", "Invalid code. Please try again.");
    }

    // Code is valid - mark user as verified in their user document
    await db.collection("users").doc(userId).set(
      { emailVerified: true, verifiedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );

    // Delete the used code
    await db.collection("verificationCodes").doc(userId).delete();

    console.log("Email verified for user:", userId);
    return { success: true, verified: true };
  }
);

// Send OTP/2FA code email (legacy - keeping for backwards compatibility)
exports.sendOTPEmail = onCall(
  {
    secrets: [resendApiKey],
  },
  async (request) => {
    const resend = new Resend(resendApiKey.value());

    const { email, code } = request.data;

    if (!email || !code) {
      throw new HttpsError("invalid-argument", "Email and code are required");
    }

    const content = `
      <h1 style="color: #F4F6FF; font-size: 24px; margin: 0 0 16px 0; font-weight: 700;">
        Your verification code
      </h1>
      <p style="color: #B7C0D8; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Enter this code to verify your identity:
      </p>

      <div style="background-color: #050811; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 36px; font-weight: 700; color: ${BRAND_COLOR}; letter-spacing: 8px; font-family: monospace;">
          ${code}
        </span>
      </div>

      <p style="color: #818BA3; font-size: 14px; margin: 0;">
        This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.
      </p>
    `;

    try {
      const result = await resend.emails.send({
        from: "SpillStack <security@spillstack.com>",
        to: email,
        subject: `${code} is your SpillStack verification code`,
        html: emailTemplate(content),
      });
      return { success: true, id: result.id };
    } catch (error) {
      console.error("Failed to send OTP email:", error);
      throw new HttpsError("internal", "Failed to send verification email");
    }
  }
);

// Send marketing email (only to users who opted in)
exports.sendMarketingEmail = onCall(
  {
    secrets: [resendApiKey],
  },
  async (request) => {
    const resend = new Resend(resendApiKey.value());

    // This should be called by an admin - add your own auth check here
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const { subject, content: emailContent, testEmail } = request.data;

    if (!subject || !emailContent) {
      throw new HttpsError("invalid-argument", "Subject and content are required");
    }

    // If testEmail provided, only send to that address
    if (testEmail) {
      const content = `
        <div style="background-color: #F59E0B20; border: 1px solid #F59E0B; border-radius: 8px; padding: 12px; margin-bottom: 20px;">
          <p style="color: #F59E0B; font-size: 13px; margin: 0; font-weight: 600;">⚠️ TEST EMAIL</p>
        </div>
        ${emailContent}
      `;

      try {
        const result = await resend.emails.send({
          from: "SpillStack <hello@spillstack.com>",
          to: testEmail,
          subject: `[TEST] ${subject}`,
          html: emailTemplate(content, true),
        });
        return { success: true, sent: 1, id: result.id };
      } catch (error) {
        console.error("Failed to send test email:", error);
        throw new HttpsError("internal", "Failed to send test email");
      }
    }

    // Get all users who opted in to marketing
    const db = admin.firestore();
    const usersSnapshot = await db
      .collection("users")
      .where("marketingOptIn", "==", true)
      .get();

    if (usersSnapshot.empty) {
      return { success: true, sent: 0, message: "No users opted in to marketing" };
    }

    const emails = usersSnapshot.docs
      .map(doc => doc.data().email)
      .filter(email => email);

    // Send in batches (Resend supports up to 100 recipients per call with batch)
    let sent = 0;
    const batchSize = 50;

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);

      try {
        // Send individually for personalization (or use Resend's batch API)
        for (const email of batch) {
          await resend.emails.send({
            from: "SpillStack <hello@spillstack.com>",
            to: email,
            subject,
            html: emailTemplate(emailContent, true),
          });
          sent++;
        }
      } catch (error) {
        console.error("Failed to send marketing email batch:", error);
      }
    }

    return { success: true, sent, total: emails.length };
  }
);

// Manual email sending (callable function)
exports.sendEmail = onCall(
  {
    secrets: [resendApiKey],
  },
  async (request) => {
    const resend = new Resend(resendApiKey.value());

    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const { to, subject, html } = request.data;

    if (!to || !subject || !html) {
      throw new HttpsError("invalid-argument", "Missing required fields");
    }

    try {
      const result = await resend.emails.send({
        from: "SpillStack <hello@spillstack.com>",
        to,
        subject,
        html: emailTemplate(html),
      });
      return { success: true, id: result.id };
    } catch (error) {
      console.error("Failed to send email:", error);
      throw new HttpsError("internal", "Failed to send email");
    }
  }
);
