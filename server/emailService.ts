import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

// Initialize email transporter
export function initializeEmailService() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn("⚠️ Email credentials not configured. Email sending will be disabled.");
    return;
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  console.log("✅ Email service initialized");
}

// Send invite email to collaborator
export async function sendInviteEmail(
  to: string,
  firstName: string,
  inviteLink: string,
  adminName: string
): Promise<boolean> {
  if (!transporter) {
    console.error("Email service not initialized");
    return false;
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: `${adminName} convidou você para o FinControl`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f7;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f7; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, hsl(220 100% 40%) 0%, hsl(220 80% 50%) 100%); padding: 40px 40px 48px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 600; letter-spacing: -0.5px;">
                        FinControl
                      </h1>
                      <p style="margin: 12px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                        Sistema Financeiro
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 48px 40px;">
                      <h2 style="margin: 0 0 24px; color: #1d1d1f; font-size: 24px; font-weight: 600;">
                        Olá, ${firstName}! 👋
                      </h2>
                      
                      <p style="margin: 0 0 16px; color: #424245; font-size: 16px; line-height: 1.6;">
                        <strong>${adminName}</strong> convidou você para colaborar no sistema financeiro <strong>FinControl</strong>.
                      </p>
                      
                      <p style="margin: 0 0 32px; color: #424245; font-size: 16px; line-height: 1.6;">
                        Para começar a usar o sistema, clique no botão abaixo e defina sua senha de acesso:
                      </p>
                      
                      <!-- Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 0 0 32px;">
                            <a href="${inviteLink}" 
                               style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, hsl(220 100% 40%) 0%, hsl(220 80% 50%) 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 16px rgba(37, 99, 235, 0.24);">
                              Aceitar Convite e Definir Senha
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 0 0 8px; color: #6e6e73; font-size: 14px; line-height: 1.5;">
                        Ou copie e cole este link no seu navegador:
                      </p>
                      <p style="margin: 0 0 24px; color: #424245; font-size: 14px; word-break: break-all; background-color: #f5f5f7; padding: 12px; border-radius: 8px;">
                        ${inviteLink}
                      </p>
                      
                      <div style="margin-top: 32px; padding-top: 32px; border-top: 1px solid #e5e5e7;">
                        <p style="margin: 0; color: #6e6e73; font-size: 13px; line-height: 1.5;">
                          <strong>⏰ Importante:</strong> Este convite expira em 7 dias.
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f5f5f7; padding: 32px 40px; text-align: center;">
                      <p style="margin: 0 0 8px; color: #6e6e73; font-size: 13px;">
                        Este é um email automático do sistema FinControl
                      </p>
                      <p style="margin: 0; color: #86868b; font-size: 12px;">
                        Se você não esperava este convite, pode ignorar este email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Invite email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending invite email:", error);
    return false;
  }
}
