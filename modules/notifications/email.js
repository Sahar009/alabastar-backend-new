// Minimal email sender stub to avoid runtime errors.
// Replace with real Nodemailer or provider integration when ready.

export async function sendEmail(to, subject, text = '', template = 'plain', context = {}) {
  try {
    const payload = { to, subject, text, template, context };
    console.log('[EmailStub] Sending email:', JSON.stringify(payload));
    // Simulate async delay
    await new Promise(resolve => setTimeout(resolve, 10));
    return { success: true, messageId: `stub-${Date.now()}` };
  } catch (error) {
    console.error('[EmailStub] Failed to send email:', error.message);
    throw error;
  }
}

export default sendEmail;


