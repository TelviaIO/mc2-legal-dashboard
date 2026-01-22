import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

// Email recipients
// In Resend Test Mode, you can only send to the email address you signed up with.
// If you want to send to others, you MUST verify your domain in Resend.
const RECIPIENTS = ['info@telvia.io', 'arodriguez@mc2legal.es'];
const APP_URL = 'https://mc2-legal-dashboard.vercel.app/';

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;

    if (!RESEND_API_KEY) {
        console.error('RESEND_API_KEY is not set');
        return res.status(500).json({ error: 'Server configuration error: API key not found' });
    }

    const { type, data } = req.body;

    if (!type) {
        return res.status(400).json({ error: 'Notification type is required' });
    }

    try {
        const resend = new Resend(RESEND_API_KEY);

        let subject = '';
        let html = '';

        switch (type) {
            case 'task_created':
                subject = '✨ Nueva Tarea Pendiente - IA Prejudicial';
                html = getTaskCreatedEmail(data);
                break;

            case 'task_completed':
                subject = '✅ Tarea Completada - IA Prejudicial';
                html = getTaskCompletedEmail(data);
                break;

            case 'feedback_created':
                subject = '💬 Nuevo Feedback del Equipo - IA Prejudicial';
                html = getFeedbackCreatedEmail(data);
                break;

            default:
                return res.status(400).json({ error: 'Invalid notification type' });
        }

        // Send from verified domain panel.ia-al-telefono.com
        const emailResponse = await resend.emails.send({
            from: 'IA Prejudicial <info@panel.ia-al-telefono.com>',
            to: RECIPIENTS,
            subject: subject,
            html: html,
        });

        console.log('Email sent successfully:', emailResponse);
        return res.status(200).json({ success: true, emailId: emailResponse.data?.id });

    } catch (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({
            error: 'Failed to send notification',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

// Email template functions
function getEmailWrapper(content: string): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notificación - IA Prejudicial</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                                🤖 IA Prejudicial
                            </h1>
                            <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                                Sistema de Gestión Legal MC2
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            ${content}
                        </td>
                    </tr>

                    <!-- CTA Button -->
                    <tr>
                        <td style="padding: 0 30px 40px 30px; text-align: center;">
                            <a href="${APP_URL}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                                Ir al Dashboard
                            </a>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #6b7280; font-size: 13px;">
                                Este es un mensaje automático de la IA Prejudicial<br>
                                <a href="${APP_URL}" style="color: #667eea; text-decoration: none;">MC2 Legal Dashboard</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

function getTaskCreatedEmail(data: any): string {
    const { text, category } = data;
    const categoryLabel = category === 'mc2' ? 'MC2' : 'Telvia';
    const categoryColor = category === 'mc2' ? '#10b981' : '#3b82f6';

    const content = `
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background-color: #f0fdf4; padding: 16px; border-radius: 50%; margin-bottom: 20px;">
                <span style="font-size: 48px;">📋</span>
            </div>
            <h2 style="margin: 0 0 10px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                Nueva Tarea Pendiente
            </h2>
            <p style="margin: 0; color: #6b7280; font-size: 16px;">
                Se ha creado una nueva tarea que requiere atención
            </p>
        </div>

        <div style="background-color: #f9fafb; border-left: 4px solid ${categoryColor}; padding: 20px; margin: 20px 0; border-radius: 6px;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                Categoría: <span style="color: ${categoryColor};">${categoryLabel}</span>
            </p>
            <p style="margin: 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                ${text}
            </p>
        </div>

        <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
            Accede al dashboard para gestionar esta tarea
        </p>
    `;

    return getEmailWrapper(content);
}

function getTaskCompletedEmail(data: any): string {
    const { text, category } = data;
    const categoryLabel = category === 'mc2' ? 'MC2' : 'Telvia';
    const categoryColor = category === 'mc2' ? '#10b981' : '#3b82f6';

    const content = `
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background-color: #f0fdf4; padding: 16px; border-radius: 50%; margin-bottom: 20px;">
                <span style="font-size: 48px;">✅</span>
            </div>
            <h2 style="margin: 0 0 10px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                Tarea Completada
            </h2>
            <p style="margin: 0; color: #6b7280; font-size: 16px;">
                Una tarea ha sido marcada como completada
            </p>
        </div>

        <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 6px;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                Categoría: <span style="color: ${categoryColor};">${categoryLabel}</span>
            </p>
            <p style="margin: 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                ${text}
            </p>
        </div>

        <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
            ¡Excelente trabajo! Esta tarea ha sido finalizada.
        </p>
    `;

    return getEmailWrapper(content);
}

function getFeedbackCreatedEmail(data: any): string {
    const { text, author_name } = data;

    const content = `
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background-color: #eff6ff; padding: 16px; border-radius: 50%; margin-bottom: 20px;">
                <span style="font-size: 48px;">💬</span>
            </div>
            <h2 style="margin: 0 0 10px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                Nuevo Feedback del Equipo
            </h2>
            <p style="margin: 0; color: #6b7280; font-size: 16px;">
                ${author_name || 'Un miembro del equipo'} ha dejado un nuevo mensaje
            </p>
        </div>

        <div style="background-color: #f9fafb; border-left: 4px solid #6366f1; padding: 20px; margin: 20px 0; border-radius: 6px;">
            ${author_name ? `
            <p style="margin: 0 0 12px 0; color: #6366f1; font-size: 14px; font-weight: 600;">
                ${author_name}
            </p>
            ` : ''}
            <p style="margin: 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                ${text}
            </p>
        </div>

        <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
            Accede al dashboard para ver todos los mensajes y responder
        </p>
    `;

    return getEmailWrapper(content);
}
