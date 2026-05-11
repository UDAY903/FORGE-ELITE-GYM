import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/send-invoice", async (req, res) => {
    try {
      const {
        customerName,
        customerEmail,
        planName,
        amountPaid,
        remainingAmount,
        nextDueDate,
        status,
        startDate,
        endDate,
        invoiceId
      } = req.body;

      if (!process.env.RESEND_API_KEY) {
        return res.status(500).json({ error: "Email service not configured (RESEND_API_KEY missing)" });
      }

      const isPartial = remainingAmount > 0;

      // Professional HTML Template
      const customerHtml = `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #000; color: #fff; padding: 40px; border-radius: 24px; border: 1px solid #333;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #ff6b00; text-transform: uppercase; font-style: italic; letter-spacing: -1px; margin: 0;">FORGE ELITE</h1>
            <p style="color: #666; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; margin-top: 5px;">Performance Architecture</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 20px; font-weight: 900; text-transform: uppercase; margin-bottom: 5px;">INVOICE RECEIVED</h2>
            <p style="color: #666; font-size: 12px; margin: 0;">System ID: ${invoiceId}</p>
          </div>

          <div style="background-color: #111; padding: 25px; border-radius: 16px; margin-bottom: 30px; border: 1px solid #222;">
            <p style="margin: 0 0 10px 0;"><strong style="color: #666; font-size: 10px; text-transform: uppercase;">Customer</strong><br/>${customerName}</p>
            <p style="margin: 0 0 10px 0;"><strong style="color: #666; font-size: 10px; text-transform: uppercase;">Access Tier</strong><br/>${planName}</p>
            <div style="display: flex; gap: 20px;">
              <p style="margin: 0 0 10px 0; flex: 1;"><strong style="color: #666; font-size: 10px; text-transform: uppercase;">Start Sync</strong><br/>${startDate}</p>
              <p style="margin: 0 0 10px 0; flex: 1;"><strong style="color: #666; font-size: 10px; text-transform: uppercase;">End Cycle</strong><br/>${endDate}</p>
            </div>
            <p style="margin: 0;"><strong style="color: #666; font-size: 10px; text-transform: uppercase;">Status</strong><br/><span style="color: ${status === 'Paid' ? '#00ffa3' : '#ffea00'}">${status}</span></p>
          </div>

          <div style="border-top: 1px solid #222; padding-top: 20px;">
             <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
               <span style="color: #666; font-size: 12px; text-transform: uppercase;">Amount Distributed</span>
               <span style="font-weight: 700;">₹${amountPaid}</span>
             </div>
             ${isPartial ? `
             <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
               <span style="color: #ff6b00; font-size: 12px; text-transform: uppercase;">Outstanding Balance</span>
               <span style="color: #ff6b00; font-weight: 700;">₹${remainingAmount}</span>
             </div>
             <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
               <span style="color: #666; font-size: 12px; text-transform: uppercase;">Next Sync Deadline</span>
               <span style="font-weight: 700;">${nextDueDate}</span>
             </div>
             ` : ''}
          </div>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #222; text-align: center;">
            <p style="color: #444; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Thank you for integrating with the elite. Welcome to the Forge.</p>
          </div>
        </div>
      `;

      const adminHtml = `
        <div style="font-family: sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: #fff; padding: 20px; border-radius: 8px;">
            <h2>New Subscription Enrollment</h2>
            <p>A new member has synchronized with a plan.</p>
            <ul>
              <li><strong>Name:</strong> ${customerName}</li>
              <li><strong>Email:</strong> ${customerEmail}</li>
              <li><strong>Plan:</strong> ${planName}</li>
              <li><strong>Paid:</strong> ₹${amountPaid}</li>
              <li><strong>Access Dates:</strong> ${startDate} to ${endDate}</li>
              <li><strong>Status:</strong> ${status}</li>
              <li><strong>Invoice:</strong> ${invoiceId}</li>
            </ul>
          </div>
        </div>
      `;

      // Send to Customer
      await resend.emails.send({
        from: "Forge Elite <onboarding@resend.dev>",
        to: customerEmail,
        subject: `Your Membership Invoice: ${planName}`,
        html: customerHtml,
      });

      // Send to Admin
      await resend.emails.send({
        from: "Forge Elite System <onboarding@resend.dev>",
        to: ADMIN_EMAIL,
        subject: `New Enrollment Alert: ${customerName}`,
        html: adminHtml,
      });

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Email API Error:", error);
      res.status(500).json({ error: "Failed to process enrollment notification" });
    }
  });

  app.post("/api/send-message-alert", async (req, res) => {
    try {
      const { name, email, message, subject } = req.body;

      if (!process.env.RESEND_API_KEY) {
        return res.status(500).json({ error: "Email service not configured" });
      }

      const adminHtml = `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #000; color: #fff; padding: 40px; border-radius: 24px; border: 1px solid #333;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #ff6b00; text-transform: uppercase; font-style: italic; letter-spacing: -1px; margin: 0;">MESSAGE RECEIVED</h1>
            <p style="color: #666; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; margin-top: 5px;">Elite Inquiry System</p>
          </div>
          
          <div style="background-color: #111; padding: 25px; border-radius: 16px; margin-bottom: 30px; border: 1px solid #222;">
            <p style="margin: 0 0 15px 0;"><strong style="color: #666; font-size: 10px; text-transform: uppercase;">From</strong><br/>${name} (${email})</p>
            <p style="margin: 0 0 15px 0;"><strong style="color: #666; font-size: 10px; text-transform: uppercase;">Subject</strong><br/>${subject || 'General Inquiry'}</p>
            <p style="margin: 0;"><strong style="color: #666; font-size: 10px; text-transform: uppercase;">Message Content</strong><br/>${message}</p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="mailto:${email}" style="background-color: #ff6b00; color: #000; padding: 15px 30px; border-radius: 12px; text-decoration: none; font-weight: 900; font-size: 12px; text-transform: uppercase; tracking: 1px;">Initiate Response</a>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: "Forge Elite Bot <onboarding@resend.dev>",
        to: ADMIN_EMAIL,
        subject: `Elite Inquiry: ${name}`,
        html: adminHtml,
      });

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Message Email Error:", error);
      res.status(500).json({ error: "Failed to send message notification" });
    }
  });

  app.post("/api/send-reply", async (req, res) => {
    try {
      const { toEmail, toName, replyMessage, originalMessage, subject } = req.body;

      if (!process.env.RESEND_API_KEY) {
        return res.status(500).json({ error: "Email service not configured" });
      }

      const replyHtml = `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #000; color: #fff; padding: 40px; border-radius: 24px; border: 1px solid #333;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #ff6b00; text-transform: uppercase; font-style: italic; letter-spacing: -1px; margin: 0;">FORGE ELITE</h1>
            <p style="color: #666; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; margin-top: 5px;">Response Protocol</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <p style="font-size: 16px; leading-relaxed: 1.6; color: #eee;">Hi ${toName},</p>
            <p style="font-size: 16px; leading-relaxed: 1.6; color: #eee;">${replyMessage.replace(/\n/g, '<br/>')}</p>
          </div>

          <div style="margin-top: 40px; padding: 25px; background-color: #111; border-radius: 16px; border: 1px solid #222;">
            <p style="color: #666; font-size: 10px; font-weight: 900; text-transform: uppercase; margin-bottom: 10px;">Previous Intelligence</p>
            <p style="color: #444; font-size: 12px; margin: 0; font-style: italic;">"${originalMessage}"</p>
          </div>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #222; text-align: center;">
            <p style="color: #444; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">The Architects have spoken. Welcome to the Forge.</p>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: "Forge Elite Support <onboarding@resend.dev>",
        to: toEmail,
        subject: subject || "Elite Program Response",
        html: replyHtml,
      });

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Reply Email Error:", error);
      res.status(500).json({ error: "Failed to send reply notification" });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
