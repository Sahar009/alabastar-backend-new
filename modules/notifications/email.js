// Production-ready email sender using Nodemailer + EJS templates
import nodemailer from 'nodemailer';
import ejs from 'ejs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatesDir = path.resolve(__dirname, '../../views/emails');

function getFromAddress() {
  return process.env.SMTP_FROM || 'Alabastar <no-reply@alabastar.app>';
}

async function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
  if (SMTP_HOST && SMTP_PORT) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: SMTP_SECURE === 'true',
      auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined
    });
  }
  // Dev fallback - does not actually send, prints JSON output
  return nodemailer.createTransport({ jsonTransport: true });
}

async function renderTemplate(template, context) {
  try {
    const filePath = path.join(templatesDir, `${template}.ejs`);
    const file = await fs.readFile(filePath, 'utf8');
    return await ejs.render(file, context, { async: true });
  } catch (err) {
    // If template not found, fall back to minimal HTML
    console.warn(`[Email] Template "${template}" not found or failed to render:`, err.message);
    return `<html><body><pre style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji'; white-space: pre-wrap;">${
      context?.text || 'Hello from Alabastar'
    }</pre></body></html>`;
  }
}

export async function sendEmail(to, subject, text = '', template = 'plain', context = {}) {
  try {
    const transporter = await getTransporter();
    const html = await renderTemplate(template, { ...context, text });

    const info = await transporter.sendMail({
      from: getFromAddress(),
      to,
      subject,
      text: text || undefined,
      html
    });

    if (transporter.options?.jsonTransport) {
      console.log('[EmailDev] Outgoing email (jsonTransport):', JSON.stringify({ to, subject, template, context }));
    }

    return { success: true, messageId: info?.messageId || `email-${Date.now()}` };
  } catch (error) {
    console.error('[Email] Failed to send email:', error.message);
    throw error;
  }
}

export default sendEmail;

