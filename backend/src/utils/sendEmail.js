import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

export async function sendEmail({ to, subject, html }) {
    if (!to) throw new Error("Missing recipient email");
    const info = await transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to,
        subject,
        html
    });
    console.log("Email sent:", info.messageId);
}