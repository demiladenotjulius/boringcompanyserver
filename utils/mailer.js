import nodemailer from 'nodemailer';

export async function sendMailSafe(mailOptions) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    const result = await transporter.sendMail(mailOptions);
    return { ok: true, result };
  } catch (error) {
    return { ok: false, error };
  }
}