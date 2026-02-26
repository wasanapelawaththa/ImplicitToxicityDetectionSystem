import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import process from 'process';

dotenv.config();

const TOXICITY_SERVICE_URL = process.env.TOXICITY_SERVICE_URL || "http://127.0.0.1:8000/predict";

type ModerationResult = {
  is_toxic: boolean;
  label: string;
  score: number;
};

async function moderateText(text: string): Promise<ModerationResult> {
  const fetchAny: any = (globalThis as any).fetch;
  if (!fetchAny) {
    throw new Error("global fetch not found. Use Node 18+.");
  }

  const resp = await fetchAny(TOXICITY_SERVICE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  if (!resp.ok) {
    const raw = await resp.text();
    throw new Error(`Toxicity service error: ${resp.status} ${raw}`);
  }

  return resp.json();
}

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || "http://localhost:3000";

app.use(cors() as any);
app.use(express.json() as any);

const dbConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "hughub_db",
  port: Number(process.env.DB_PORT) || 3306,
};

let transporter: nodemailer.Transporter;

function buildVerificationUrl(token: string) {
  return `http://localhost:${PORT}/api/auth/verify/${token}`;
}

function buildPasswordResetUrl(token: string) {
  return `${FRONTEND_BASE_URL}/?resetToken=${token}`;
}

function toMysqlDatetime(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function createShortId() {
  // Match existing schema that stores varchar(15) ids.
  return crypto.randomBytes(12).toString('hex').slice(0, 15);
}

function validatePassword(pw: string) {
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return re.test(pw);
}

function validateProfileInput(name: string, gender: string, location: string, agreeTerms: boolean) {
  const nameOk = typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 100;
  const genderOk = ['Male', 'Female', 'Other'].includes(gender);
  const locationOk = typeof location === 'string' && location.trim().length >= 2 && location.trim().length <= 100;
  const termsOk = agreeTerms === true;
  return nameOk && genderOk && locationOk && termsOk;
}

async function sendVerificationEmail(email: string, name: string, token: string) {
  const verificationUrl = buildVerificationUrl(token);
  const info = await transporter.sendMail({
    from: '"Hug Hub Team" <noreply@hughub.com>',
    to: email,
    subject: 'Activate Your Hug Hub Account',
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 2px solid #5ce1e6; border-radius: 15px; max-width: 500px; margin: auto;">
        <h2 style="color: #5ce1e6; text-align: center;">Welcome to the Hub, ${name}!</h2>
        <p>We're excited to have you. Please verify your email to start sharing positive vibes.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #5ce1e6; color: black; padding: 12px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px;">Verify My Account</a>
        </div>
        <p style="font-size: 12px; color: #999; text-align: center;">If the button doesn't work, copy this: <br/> ${verificationUrl}</p>
      </div>
    `
  });

  console.log(`\n--------------------------------------------`);
  console.log(`📧 VERIFICATION: ${email}`);
  console.log(`🔗 VERIFICATION LINK: ${verificationUrl}`);
  const testUrl = nodemailer.getTestMessageUrl(info);
  if (testUrl) console.log(`👀 VIEW EMAIL PREVIEW: ${testUrl}`);
  console.log(`--------------------------------------------\n`);
}

async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const resetUrl = buildPasswordResetUrl(token);
  const info = await transporter.sendMail({
    from: '"Hug Hub Team" <noreply@hughub.com>',
    to: email,
    subject: 'Reset Your Hug Hub Password',
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 2px solid #5ce1e6; border-radius: 15px; max-width: 500px; margin: auto;">
        <h2 style="color: #5ce1e6; text-align: center;">Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>Click the button below to reset your password. This link will expire in 5 minutes.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #5ce1e6; color: black; padding: 12px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px;">Reset My Password</a>
        </div>
        <p style="font-size: 12px; color: #999; text-align: center;">If the button doesn't work, copy this: <br/> ${resetUrl}</p>
      </div>
    `
  });

  console.log(`\n--------------------------------------------`);
  console.log(`📧 PASSWORD RESET: ${email}`);
  console.log(`🔗 RESET LINK: ${resetUrl}`);
  const testUrl = nodemailer.getTestMessageUrl(info);
  if (testUrl) console.log(`👀 VIEW EMAIL PREVIEW: ${testUrl}`);
  console.log(`--------------------------------------------\n`);
}

async function setupTransporter() {
  try {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT) || 465,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
    } else {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      console.log("ℹ️ Mail Config: No credentials found. Using Ethereal Mock Service.");
      console.log("ℹ️ Mock Account:", testAccount.user);
    }
  } catch (err) {
    console.error("❌ Email Setup Failed:", err);
  }
}

async function startServer() {
  await setupTransporter();

  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log(`✅ Connected to MySQL Database: ${dbConfig.database}`);

    // ✅ LOG BLOCKED CONTENT (ADD HERE)
    async function logModeration(
      content_type: "post" | "comment",
      user_id: string,
      content: string,
      label: string,
      score: number
    ) {
      const id = createShortId();
      const createdTime = new Date().toISOString().slice(0, 19).replace("T", " ");
      await connection.execute(
        "INSERT INTO moderation_log (id, content_type, user_id, content, predicted_label, predicted_score, created_time) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [id, content_type, user_id, content, label, score, createdTime]
      );
    }

    // --- BASE ROUTE ---
    app.get('/', (req, res) => {
      res.send(`
        <div style="font-family: sans-serif; text-align: center; padding-top: 50px;">
          <h1 style="color: #5ce1e6;">Hug Hub Backend is Live! 🚀</h1>
          <p>The API is running correctly on port ${PORT}.</p>
          <p>Database: <strong>${dbConfig.database}</strong></p>
          <hr style="width: 200px; margin: 20px auto; border: 1px solid #eee;" />
          <p style="color: #666; font-size: 14px;">Try registering a user from the frontend to see the email logs.</p>
        </div>
      `);
    });

    // --- AUTH ROUTES ---

    app.post('/api/auth/signup', async (req, res) => {
      const { email, name, mobile, password } = req.body;
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();
        const token = crypto.randomBytes(32).toString('hex');

        await connection.execute(
          `INSERT INTO user 
          (user_id, user_email, name, user_mobile, user_password, is_verified, verification_token) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [userId, email, name, mobile, hashedPassword, 0, token]
        );

        await sendVerificationEmail(email, name, token);

        res.status(201).json({ message: 'Signup successful. Please check your email (and server logs).' });
      } catch (err: any) {
        console.error('❌ Signup error:', err.message);
        if (err.code === 'ER_BAD_FIELD_ERROR') {
          return res.status(500).json({ error: "Database Mismatch: Table 'user' is missing 'is_verified' or 'verification_token' columns. Run the SQL fix in PHPMyAdmin." });
        }
        res.status(500).json({ error: err.message || 'Signup failed' });
      }
    });

    app.post('/api/auth/resend-verification', async (req, res) => {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email is required.' });

      try {
        const [rows] = await connection.execute('SELECT name, is_verified FROM user WHERE user_email = ?', [email]);
        const users = rows as any[];

        if (users.length === 0) return res.status(404).json({ error: 'No account found with that email.' });
        if (users[0].is_verified) return res.status(400).json({ error: 'This account is already verified.' });

        const token = crypto.randomBytes(32).toString('hex');
        await connection.execute('UPDATE user SET verification_token = ? WHERE user_email = ?', [token, email]);

        await sendVerificationEmail(email, users[0].name, token);
        res.json({ message: 'Verification email resent. Please check your inbox.' });
      } catch (err: any) {
        console.error('❌ Resend verification error:', err.message);
        if (err.code === 'ER_BAD_FIELD_ERROR') {
          return res.status(500).json({ error: "Database Mismatch: Table 'user' is missing 'is_verified' or 'verification_token' columns." });
        }
        res.status(500).json({ error: 'Failed to resend verification email.' });
      }
    });

    app.post('/api/auth/forgot-password', async (req, res) => {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email is required.' });

      try {
        const [rows] = await connection.execute('SELECT name FROM user WHERE user_email = ?', [email]);
        const users = rows as any[];

        if (users.length === 0) return res.status(404).json({ error: 'Email/username not found.' });

        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await connection.execute(
          'UPDATE user SET reset_token = ?, reset_token_expires = ? WHERE user_email = ?',
          [resetToken, toMysqlDatetime(expiresAt), email]
        );

        await sendPasswordResetEmail(email, users[0].name, resetToken);
        res.json({ message: 'Reset link sent to your email.' });
      } catch (err: any) {
        console.error('❌ Forgot password error:', err.message);
        if (err.code === 'ER_BAD_FIELD_ERROR') {
          return res.status(500).json({ error: "Database Mismatch: Table 'user' is missing 'reset_token' or 'reset_token_expires' columns." });
        }
        res.status(500).json({ error: 'Failed to send reset link.' });
      }
    });

    app.get('/api/auth/reset/validate/:token', async (req, res) => {
      const { token } = req.params;
      try {
        const [rows] = await connection.execute(
          'SELECT reset_token_expires FROM user WHERE reset_token = ?',
          [token]
        );
        const users = rows as any[];
        if (users.length === 0) return res.status(400).json({ error: 'Reset link is invalid or expired.' });

        const expiresAt = users[0].reset_token_expires;
        if (!expiresAt || new Date(expiresAt).getTime() < Date.now()) {
          return res.status(400).json({ error: 'Reset link is invalid or expired.' });
        }

        res.json({ valid: true });
      } catch (err) {
        res.status(500).json({ error: 'Failed to validate reset link.' });
      }
    });

    app.post('/api/auth/reset-password', async (req, res) => {
      const { token, password } = req.body;
      if (!token || !password) return res.status(400).json({ error: 'Token and password are required.' });

      try {
        const [rows] = await connection.execute(
          'SELECT reset_token_expires FROM user WHERE reset_token = ?',
          [token]
        );
        const users = rows as any[];
        if (users.length === 0) return res.status(400).json({ error: 'Reset link is invalid or expired.' });

        const expiresAt = users[0].reset_token_expires;
        if (!expiresAt || new Date(expiresAt).getTime() < Date.now()) {
          return res.status(400).json({ error: 'Reset link is invalid or expired.' });
        }

        if (!validatePassword(password)) {
          return res.status(400).json({ error: 'Weak password' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await connection.execute(
          'UPDATE user SET user_password = ?, reset_token = NULL, reset_token_expires = NULL WHERE reset_token = ?',
          [hashedPassword, token]
        );

        res.json({ message: 'Password updated successfully' });
      } catch (err) {
        res.status(500).json({ error: 'Failed to reset password.' });
      }
    });

    app.get('/api/auth/verify/:token', async (req, res) => {
      const { token } = req.params;
      try {
        const [rows] = await connection.execute('SELECT * FROM user WHERE verification_token = ?', [token]);
        const users = rows as any[];
        if (users.length === 0) return res.status(400).send('<h1 style="text-align:center; margin-top:50px; font-family:sans-serif; color:red;">Invalid or Expired Link</h1>');

        await connection.execute('UPDATE user SET is_verified = 1, verification_token = NULL WHERE verification_token = ?', [token]);
        res.send(`
          <div style="text-align:center; padding:50px; font-family:sans-serif; background-color:#d0ffff; min-height:100vh;">
            <div style="background:white; display:inline-block; padding:50px; border-radius:30px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
              <h1 style="color:#5ce1e6; font-size:40px;">Account Verified! 🎉</h1>
              <p style="font-size:18px; color:#555;">You can now close this tab and log in to Hug Hub.</p>
              <a href="http://localhost:3000" style="display:inline-block; margin-top:20px; background:#5ce1e6; color:black; padding:12px 25px; border-radius:50px; text-decoration:none; font-weight:bold;">Back to Hug Hub</a>
            </div>
          </div>
        `);
      } catch (err) {
        res.status(500).send("Verification failed.");
      }
    });

    app.post('/api/auth/login', async (req, res) => {
      const { email, password } = req.body;
      try {
        const [rows] = await connection.execute('SELECT * FROM user WHERE user_email = ?', [email]);
        const users = rows as any[];

        if (users.length === 0) return res.status(401).json({ error: 'No account found with that email.' });

        const user = users[0];
        const match = await bcrypt.compare(password, user.user_password);

        if (!match) return res.status(401).json({ error: 'Incorrect password.' });
        if (!user.is_verified) return res.status(403).json({ error: 'Please verify your email address before logging in.' });

        res.json({
          user_id: user.user_id,
          user_email: user.user_email,
          name: user.name,
          user_mobile: user.user_mobile
        });
      } catch (err) {
        res.status(500).json({ error: 'Login failed due to a server error.' });
      }
    });

    // --- USER SETTINGS ROUTES ---
    app.post('/api/user/change-password', async (req, res) => {
      const { userId, oldPassword, newPassword } = req.body;
      if (!userId || !oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Please fill all fields.' });
      }
      if (!validatePassword(newPassword)) {
        return res.status(400).json({ error: 'Re try' });
      }

      try {
        const [rows] = await connection.execute('SELECT user_password FROM user WHERE user_id = ?', [userId]);
        const users = rows as any[];

        if (users.length === 0) return res.status(404).json({ error: 'Account not found.' });

        const match = await bcrypt.compare(oldPassword, users[0].user_password);
        if (!match) return res.status(400).json({ error: 'Invalid old password' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await connection.execute('UPDATE user SET user_password = ? WHERE user_id = ?', [hashedPassword, userId]);

        res.json({ message: 'New password updated' });
      } catch (err) {
        res.status(500).json({ error: 'Failed to update password.' });
      }
    });

    app.delete('/api/user/:id', async (req, res) => {
      const userId = req.params.id;
      if (!userId) return res.status(400).json({ error: 'User id is required.' });

      try {
        await connection.beginTransaction();

        await connection.execute(
          'DELETE FROM comment_toxicity_score WHERE comment_id IN (SELECT comment_id FROM comment WHERE c_user_id = ?)',
          [userId]
        );
        await connection.execute(
          'DELETE FROM `comment toxicity status` WHERE comment_id IN (SELECT comment_id FROM comment WHERE c_user_id = ?)',
          [userId]
        );

        await connection.execute(
          'DELETE FROM comment_toxicity_score WHERE comment_id IN (SELECT comment_id FROM comment WHERE post_id IN (SELECT post_id FROM post WHERE p_user_id = ?))',
          [userId]
        );
        await connection.execute(
          'DELETE FROM `comment toxicity status` WHERE comment_id IN (SELECT comment_id FROM comment WHERE post_id IN (SELECT post_id FROM post WHERE p_user_id = ?))',
          [userId]
        );
        await connection.execute(
          'DELETE FROM comment WHERE c_user_id = ? OR post_id IN (SELECT post_id FROM post WHERE p_user_id = ?)',
          [userId, userId]
        );

        await connection.execute(
          'DELETE FROM post_toxicity_score WHERE post_id IN (SELECT post_id FROM post WHERE p_user_id = ?)',
          [userId]
        );
        await connection.execute(
          'DELETE FROM ` post_toxicity_status` WHERE post_id IN (SELECT post_id FROM post WHERE p_user_id = ?)',
          [userId]
        );
        await connection.execute('DELETE FROM post WHERE p_user_id = ?', [userId]);

        await connection.execute('DELETE FROM follows WHERE follower_id = ? OR followee_id = ?', [userId, userId]);
        await connection.execute('DELETE FROM user_profile WHERE user_id = ?', [userId]);
        const [result] = await connection.execute('DELETE FROM user WHERE user_id = ?', [userId]);

        await connection.commit();
        res.json({ message: 'Account deleted', result });
      } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: 'Failed to delete account.' });
      }
    });

    // --- PROFILE ROUTES ---
    app.get('/api/profile/:userId', async (req, res) => {
      const { userId } = req.params;
      try {
        const [rows] = await connection.execute(
          `SELECT u.user_id, COALESCE(p.name, u.name) AS name, p.gender, p.location
           FROM user u
           LEFT JOIN user_profile p ON p.user_id = u.user_id
           WHERE u.user_id = ?`,
          [userId]
        );
        const profiles = rows as any[];
        if (profiles.length === 0) return res.status(404).json({ error: 'Profile not found.' });

        const profile = profiles[0];
        res.json({
          user_id: profile.user_id,
          name: profile.name,
          gender: profile.gender || '',
          location: profile.location || ''
        });
      } catch (err) {
        res.status(500).json({ error: 'Failed to fetch profile.' });
      }
    });

    app.put('/api/profile/:userId', async (req, res) => {
      const { userId } = req.params;
      const { name, gender, location, agreeTerms } = req.body;

      if (!validateProfileInput(name, gender, location, agreeTerms === true)) {
        return res.status(400).json({ error: 'Fill the fields with valid data' });
      }

      try {
        const [userRows] = await connection.execute('SELECT user_id FROM user WHERE user_id = ?', [userId]);
        const users = userRows as any[];
        if (users.length === 0) return res.status(404).json({ error: 'Profile not found.' });

        await connection.execute('UPDATE user SET name = ? WHERE user_id = ?', [name.trim(), userId]);
        await connection.execute(
          `INSERT INTO user_profile (user_id, name, gender, location)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name = VALUES(name), gender = VALUES(gender), location = VALUES(location)`,
          [userId, name.trim(), gender, location.trim()]
        );

        res.json({ user_id: userId, name: name.trim(), gender, location: location.trim() });
      } catch (err) {
        res.status(500).json({ error: 'Failed to update profile.' });
      }
    });

    // --- USERS + FOLLOWS ROUTES ---
    app.get('/api/users', async (req, res) => {
      const excludeUserId = req.query.excludeUserId as string | undefined;
      try {
        const query = excludeUserId
          ? 'SELECT user_id, user_email, name, user_mobile FROM user WHERE user_id != ? ORDER BY name ASC'
          : 'SELECT user_id, user_email, name, user_mobile FROM user ORDER BY name ASC';
        const params = excludeUserId ? [excludeUserId] : [];
        const [rows] = await connection.execute(query, params);
        res.json(rows);
      } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users.' });
      }
    });

    app.get('/api/users/:id', async (req, res) => {
      try {
        const [rows] = await connection.execute(
          'SELECT user_id, user_email, name, user_mobile FROM user WHERE user_id = ?',
          [req.params.id]
        );
        const users = rows as any[];
        if (users.length === 0) return res.status(404).json({ error: 'User not found.' });
        res.json(users[0]);
      } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user.' });
      }
    });

    app.get('/api/follows/following/:userId', async (req, res) => {
      try {
        const [rows] = await connection.execute(
          `SELECT u.user_id, u.user_email, u.name, u.user_mobile, f.following_started_time
           FROM follows f
           JOIN user u ON u.user_id = f.followee_id
           WHERE f.follower_id = ?
           ORDER BY f.following_started_time DESC`,
          [req.params.userId]
        );
        res.json(rows);
      } catch (err) {
        res.status(500).json({ error: 'Failed to fetch following.' });
      }
    });

    app.get('/api/follows/followers/:userId', async (req, res) => {
      try {
        const [rows] = await connection.execute(
          `SELECT u.user_id, u.user_email, u.name, u.user_mobile, f.following_started_time
           FROM follows f
           JOIN user u ON u.user_id = f.follower_id
           WHERE f.followee_id = ?
           ORDER BY f.following_started_time DESC`,
          [req.params.userId]
        );
        res.json(rows);
      } catch (err) {
        res.status(500).json({ error: 'Failed to fetch followers.' });
      }
    });

    app.post('/api/follows', async (req, res) => {
      const { follower_id, followee_id } = req.body;
      if (!follower_id || !followee_id) {
        return res.status(400).json({ error: 'Follower and followee are required.' });
      }
      if (follower_id === followee_id) {
        return res.status(400).json({ error: 'You cannot follow yourself.' });
      }

      try {
        const createdTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const [result] = await connection.execute(
          'INSERT IGNORE INTO follows (follower_id, followee_id, following_started_time) VALUES (?, ?, ?)',
          [follower_id, followee_id, createdTime]
        );
        const info = result as mysql.ResultSetHeader;
        if (info.affectedRows === 0) {
          return res.status(200).json({ message: 'Already following.' });
        }
        res.status(201).json({ message: 'Followed successfully.' });
      } catch (err) {
        res.status(500).json({ error: 'Failed to follow user.' });
      }
    });

    app.delete('/api/follows', async (req, res) => {
      const { follower_id, followee_id } = req.body;
      if (!follower_id || !followee_id) {
        return res.status(400).json({ error: 'Follower and followee are required.' });
      }

      try {
        const [result] = await connection.execute(
          'DELETE FROM follows WHERE follower_id = ? AND followee_id = ?',
          [follower_id, followee_id]
        );
        const info = result as mysql.ResultSetHeader;
        if (info.affectedRows === 0) {
          return res.status(404).json({ error: 'Follow relation not found.' });
        }
        res.json({ message: 'Unfollowed successfully.' });
      } catch (err) {
        res.status(500).json({ error: 'Failed to unfollow user.' });
      }
    });

    // --- POSTS ROUTES ---
    app.get('/api/posts', async (req, res) => {
      try {
        const [rows] = await connection.execute(
          `SELECT 
            p.post_id,
            p.p_user_id,
            p.post_desc,
            p.p_content_created_time AS p_content_created_time,
            u.name AS author_name
          FROM post p
          LEFT JOIN user u ON p.p_user_id = u.user_id
          ORDER BY p.p_content_created_time DESC`
        );

        res.json(rows);
      } catch (err) {
        res.status(500).json({ error: 'Failed to fetch posts' });
      }
    });      

    // ✅ CREATE POST: MODERATION FIRST
    app.post('/api/posts', async (req, res) => {
      const { p_user_id, post_desc } = req.body;

      try {
        const moderation = await moderateText(String(post_desc || ""));
        if (moderation.is_toxic) {
          await logModeration("post", String(p_user_id || ""), String(post_desc || ""), moderation.label, moderation.score);
          return res.status(403).json({
            blocked: true,
            isToxic: true,
            label: moderation.label,
            score: moderation.score,
            message: "Post blocked due to toxic content."
          });
        }

        const postId = createShortId();
        const createdTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await connection.execute(
          'INSERT INTO post (post_id, p_user_id, post_desc, p_content_created_time) VALUES (?, ?, ?, ?)',
          [postId, p_user_id, post_desc, createdTime]
        );

        const [userRows] = await connection.execute('SELECT name FROM user WHERE user_id = ?', [p_user_id]);
        const users = userRows as any[];
        res.status(201).json({
          post_id: postId,
          p_user_id,
          post_desc,
          p_content_created_time: createdTime,
          author_name: users[0]?.name || 'User'
        });
      } catch (err: any) {
        res.status(500).json({ error: err.message || 'Failed to create post' });
      }
    });

    // ✅ EDIT POST: MODERATION FIRST
    app.put('/api/posts/:id', async (req, res) => {
      const { post_desc } = req.body;
      if (!post_desc || !post_desc.trim()) {
        return res.status(400).json({ error: 'Post content is required.' });
      }

      try {
        const moderation = await moderateText(String(post_desc || ""));
        if (moderation.is_toxic) {
          // We don't know p_user_id here easily; store as empty
          await logModeration("post", "", String(post_desc || ""), moderation.label, moderation.score);

          return res.status(403).json({
            blocked: true,
            isToxic: true,
            label: moderation.label,
            score: moderation.score,
            message: "Post update blocked due to toxic content."
          });
        }

        const [result] = await connection.execute(
          'UPDATE post SET post_desc = ? WHERE post_id = ?',
          [post_desc, req.params.id]
        );
        const info = result as mysql.ResultSetHeader;
        if (info.affectedRows === 0) {
          return res.status(404).json({ error: 'Post not found.' });
        }
        res.json({ message: 'Post updated' });
      } catch (err: any) {
        res.status(500).json({ error: err.message || 'Failed to update post' });
      }
    });

    app.delete('/api/posts/:id', async (req, res) => {
      try {
        await connection.beginTransaction();
        await connection.execute(
          'DELETE FROM comment_toxicity_score WHERE comment_id IN (SELECT comment_id FROM comment WHERE post_id = ?)',
          [req.params.id]
        );
        await connection.execute(
          'DELETE FROM `comment toxicity status` WHERE comment_id IN (SELECT comment_id FROM comment WHERE post_id = ?)',
          [req.params.id]
        );
        await connection.execute('DELETE FROM comment WHERE post_id = ?', [req.params.id]);
        await connection.execute('DELETE FROM post_toxicity_score WHERE post_id = ?', [req.params.id]);
        await connection.execute('DELETE FROM ` post_toxicity_status` WHERE post_id = ?', [req.params.id]);
        const [result] = await connection.execute('DELETE FROM post WHERE post_id = ?', [req.params.id]);
        const info = result as mysql.ResultSetHeader;
        if (info.affectedRows === 0) {
          await connection.rollback();
          return res.status(404).json({ error: 'Post not found.' });
        }
        await connection.commit();
        res.json({ message: 'Post deleted' });
      } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: 'Delete failed' });
      }
    });

    app.get('/api/posts/:id/comments', async (req, res) => {
      try {
        const [rows] = await connection.execute(
          `SELECT c.comment_id, c.post_id, c.c_user_id, c.comment_text, c.c_content_created_time, u.name AS author_name
           FROM comment c
           LEFT JOIN user u ON c.c_user_id = u.user_id
           WHERE c.post_id = ?
           ORDER BY c.c_content_created_time ASC`,
          [req.params.id]
        );
        res.json(rows);
      } catch (err) {
        res.status(500).json({ error: 'Failed to fetch comments' });
      }
    });

    // --- COMMENTS ROUTES ---

    // ✅ CREATE COMMENT: MODERATION FIRST
    app.post('/api/comments', async (req, res) => {
      const { post_id, c_user_id, comment_text } = req.body;

      try {
        const moderation = await moderateText(String(comment_text || ""));
        if (moderation.is_toxic) {
          await logModeration("comment", String(c_user_id || ""), String(comment_text || ""), moderation.label, moderation.score);
          return res.status(403).json({
            blocked: true,
            isToxic: true,
            label: moderation.label,
            score: moderation.score,
            message: "Comment blocked due to toxic content."
          });
        }

        const commentId = createShortId();
        const createdTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await connection.execute(
          'INSERT INTO comment (comment_id, post_id, c_user_id, comment_text, c_content_created_time) VALUES (?, ?, ?, ?, ?)',
          [commentId, post_id, c_user_id, comment_text, createdTime]
        );
        const [userRows] = await connection.execute('SELECT name FROM user WHERE user_id = ?', [c_user_id]);
        const users = userRows as any[];
        res.status(201).json({
          comment_id: commentId,
          post_id,
          c_user_id,
          comment_text,
          c_content_created_time: createdTime,
          author_name: users[0]?.name || 'User'
        });
      } catch (err: any) {
        res.status(500).json({ error: err.message || 'Failed to add comment' });
      }
    });

    // ✅ EDIT COMMENT: MODERATION FIRST
    app.put('/api/comments/:id', async (req, res) => {
      const { comment_text } = req.body;
      if (!comment_text || !comment_text.trim()) {
        return res.status(400).json({ error: 'Comment text is required.' });
      }

      try {
        const moderation = await moderateText(String(comment_text || ""));
        if (moderation.is_toxic) {
          await logModeration("comment", "", String(comment_text || ""), moderation.label, moderation.score);
          return res.status(403).json({
            blocked: true,
            isToxic: true,
            label: moderation.label,
            score: moderation.score,
            message: "Comment update blocked due to toxic content."
          });
        }

        const [result] = await connection.execute(
          'UPDATE comment SET comment_text = ? WHERE comment_id = ?',
          [comment_text, req.params.id]
        );
        const info = result as mysql.ResultSetHeader;
        if (info.affectedRows === 0) {
          return res.status(404).json({ error: 'Comment not found.' });
        }
        res.json({ message: 'Comment updated' });
      } catch (err: any) {
        res.status(500).json({ error: err.message || 'Failed to update comment' });
      }
    });

    app.delete('/api/comments/:id', async (req, res) => {
      try {
        await connection.execute('DELETE FROM comment_toxicity_score WHERE comment_id = ?', [req.params.id]);
        await connection.execute('DELETE FROM `comment toxicity status` WHERE comment_id = ?', [req.params.id]);
        const [result] = await connection.execute('DELETE FROM comment WHERE comment_id = ?', [req.params.id]);
        const info = result as mysql.ResultSetHeader;
        if (info.affectedRows === 0) {
          return res.status(404).json({ error: 'Comment not found.' });
        }
        res.json({ message: 'Comment deleted' });
      } catch (err) {
        res.status(500).json({ error: 'Failed to delete comment' });
      }
    });

    app.listen(PORT, () => {
      console.log(`🚀 Backend server ready at http://localhost:${PORT}`);
    }).on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Error: Port ${PORT} is already in use.`);
        process.exit(1);
      }
    });

  } catch (err) {
    console.error('❌ Critical: Database connection failed. Is XAMPP/MySQL running?', err);
  }
}

startServer();
