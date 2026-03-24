import { NotificationBase } from "./notification.base";
import { transporter } from "../email";

interface EmailNotificationOptions {
    subject?: string;
    rawHtmlBody?: string;
    formTitle?: string;
    formUrl?: string;
    qrCodeDataUrl?: string;
}

export class EmailNotification extends NotificationBase {
    private readonly customSubject: string | undefined;
    private readonly rawHtmlBody: string | undefined;
    private readonly formTitle: string | undefined;
    private readonly formUrl: string | undefined;
    private readonly qrCodeDataUrl: string | undefined;

    constructor(recepient: string, message: string, options: EmailNotificationOptions = {}) {
        super(recepient, message);
        this.customSubject = options.subject;
        this.rawHtmlBody = options.rawHtmlBody;
        this.formTitle = options.formTitle;
        this.formUrl = options.formUrl;
        this.qrCodeDataUrl = options.qrCodeDataUrl;
    }

    private escapeHtml(value: string): string {
        return value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    private parseBusinessMessage(): { isBusiness: boolean; formName: string; submitter: string; summary: string } {
        const source = (this.message || "").trim();
        const lines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        const formLine = lines.find((line) => /^form\s*:/i.test(line));
        const submitterLine = lines.find((line) => /^submitted\s+by\s*:/i.test(line));

        if (!formLine || !submitterLine) {
            return { isBusiness: false, formName: "", submitter: "", summary: source };
        }

        const formName = formLine.replace(/^form\s*:\s*/i, "").trim();
        const submitter = submitterLine.replace(/^submitted\s+by\s*:\s*/i, "").trim();
        const summary = lines[0] || "New form submission received.";

        return {
            isBusiness: true,
            formName: formName || "Untitled Form",
            submitter: submitter || "Anonymous",
            summary,
        };
    }

    private resolveCampaignTemplate(): { html: string; attachments?: Array<{ filename: string; content: Buffer; cid: string; contentType: string }> } {
        const source = this.rawHtmlBody || "";
        const safeTitle = this.escapeHtml(this.formTitle || "Selected form");
        const safeLink = this.escapeHtml(this.formUrl || "#");
        const qrCid = "feedback-form-qr";
        let html = source
            .replace(/\{\{\s*FORM_TITLE\s*\}\}/g, safeTitle)
            .replace(/\{\{\s*FORM_LINK\s*\}\}/g, safeLink)
            .replace(/\{\{\s*FORM_URL\s*\}\}/g, safeLink);

        let attachments: Array<{ filename: string; content: Buffer; cid: string; contentType: string }> | undefined;
        if (/\{\{\s*FORM_QR_IMAGE\s*\}\}/.test(html)) {
            if (this.qrCodeDataUrl) {
                html = html.replace(
                    /\{\{\s*FORM_QR_IMAGE\s*\}\}/g,
                    `<img src="cid:${qrCid}" alt="QR for ${safeTitle}" style="display:block;width:160px;height:160px;border-radius:18px;border:1px solid #d6d3d1;background:#ffffff;" />`,
                );

                const matches = this.qrCodeDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
                if (matches && matches[2]) {
                    attachments = [{
                        filename: "feedback-form-qr.png",
                        content: Buffer.from(matches[2], "base64"),
                        cid: qrCid,
                        contentType: matches[1] || "image/png",
                    }];
                }
            } else {
                html = html.replace(
                    /\{\{\s*FORM_QR_IMAGE\s*\}\}/g,
                    `<div style="width:160px;height:160px;border-radius:18px;border:1px dashed #a8a29e;background:#f5f5f4;color:#78716c;font-size:13px;display:flex;align-items:center;justify-content:center;text-align:center;padding:12px;box-sizing:border-box;">QR unavailable</div>`,
                );
            }
        }

        return attachments ? { html, attachments } : { html };
    }

    private buildUserHtmlBody(): string {
        const safeMessage = this.escapeHtml(this.message || "Thank you for your feedback.")
            .replace(/\r?\n/g, "<br />");
        const htmlMessage = `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#374151;">${safeMessage}</p>`;

        return `
<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Feedback Confirmation</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f5f7fb;font-family:Segoe UI,Arial,sans-serif;color:#1f2937;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f7fb;padding:24px 12px;">
            <tr>
                <td align="center">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
                        <tr>
                            <td style="background:linear-gradient(120deg,#0f766e,#0ea5e9);padding:22px 24px;">
                                <h1 style="margin:0;font-size:20px;line-height:1.3;color:#ffffff;font-weight:700;">Thanks for your feedback</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:24px;">
                                <p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;">Hi there,</p>
                                ${htmlMessage}
                                <div style="margin-top:18px;padding:12px 14px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;color:#0f766e;font-size:13px;line-height:1.5;">
                                    Your response helps us improve our service quality.
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;line-height:1.5;">
                                This is an automated confirmation email. Please do not reply.
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>`;
    }

    private buildBusinessHtmlBody(formName: string, submitter: string, summary: string): string {
        const safeFormName = this.escapeHtml(formName);
        const safeSubmitter = this.escapeHtml(submitter);
        const safeSummary = this.escapeHtml(summary || "New form submission received.");

        return `
<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>New Form Submission</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f4f7ff;font-family:Segoe UI,Arial,sans-serif;color:#111827;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f7ff;padding:28px 12px;">
            <tr>
                <td align="center">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #dbe3f0;border-radius:14px;overflow:hidden;">
                        <tr>
                            <td style="background:linear-gradient(120deg,#1d4ed8,#2563eb);padding:20px 24px;">
                                <p style="margin:0 0 4px 0;font-size:12px;letter-spacing:0.6px;text-transform:uppercase;color:#bfdbfe;">Business Alert</p>
                                <h1 style="margin:0;font-size:22px;line-height:1.3;color:#ffffff;font-weight:700;">New feedback form submission</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:24px;">
                                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#1f2937;">${safeSummary}</p>
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 10px;">
                                    <tr>
                                        <td style="width:150px;padding:12px 14px;background:#eef2ff;color:#3730a3;font-weight:600;border-radius:8px 0 0 8px;">Form Name</td>
                                        <td style="padding:12px 14px;background:#f8fafc;color:#0f172a;border-radius:0 8px 8px 0;">${safeFormName}</td>
                                    </tr>
                                    <tr>
                                        <td style="width:150px;padding:12px 14px;background:#eef2ff;color:#3730a3;font-weight:600;border-radius:8px 0 0 8px;">Submitted By</td>
                                        <td style="padding:12px 14px;background:#f8fafc;color:#0f172a;border-radius:0 8px 8px 0;">${safeSubmitter}</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:16px 24px;border-top:1px solid #e2e8f0;background:#f8fafc;color:#64748b;font-size:12px;line-height:1.5;">
                                This is an automated notification from your feedback form.
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>`;
    }

    async send(): Promise<void> {
        if (this.rawHtmlBody && this.customSubject) {
            const resolvedCampaign = this.resolveCampaignTemplate();
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: this.recepient,
                subject: this.customSubject,
                html: resolvedCampaign.html,
                attachments: resolvedCampaign.attachments,
            });
            return;
        }

        const businessData = this.parseBusinessMessage();
        const subject = businessData.isBusiness
            ? "New Feedback Form Submission"
            : "Feedback Submission Confirmation";
        const html = businessData.isBusiness
            ? this.buildBusinessHtmlBody(businessData.formName, businessData.submitter, businessData.summary)
            : this.buildUserHtmlBody();

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: this.recepient,
            subject,
            html,
        });
    }
}
