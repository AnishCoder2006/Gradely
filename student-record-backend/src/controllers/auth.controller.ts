import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import otplib, { authenticator as otpAuth } from 'otplib';
import QRCode from 'qrcode';
import User, { UserRole } from '../models/User';
import Student from '../models/Student';
import logger from '../config/logger';

const authenticator = otpAuth || (otplib && otplib.authenticator);

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (id: string, role: UserRole) => {
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);
};

export class AuthController {

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({
          success: false,
          message: 'Name, email and password are required',
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters',
        });
        return;
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'An account with this email already exists',
        });
        return;
      }

      const assignedRole: UserRole = (role as UserRole) || 'student';

      // Students start as inactive (pending admin approval later, once
      // they've completed and submitted their profile). Admins and
      // teachers are active by default.
      const isActive = assignedRole !== 'student';

      const user = await User.create({
        name,
        email,
        password,
        role: assignedRole,
        isActive,
      });

      // ── Auto-create a placeholder Student record so the profile-setup
      //    page has a record to attach real data to. Status starts as
      //    'draft' — NOT 'pending' — because the student hasn't completed
      //    or submitted their profile yet. Only submitForApproval() moves
      //    it to 'pending', which is what makes it visible to Admin. ──
      let student: any = null;
      if (assignedRole === 'student') {
        try {
          student = await Student.create({
            userId: user._id,
            name: user.name,
            email: user.email,
            phone: 'N/A',
            dateOfBirth: new Date('2000-01-01'),
            gender: 'other',
            address: 'Pending',
            status: 'draft',
          });
        } catch (err) {
          logger.warn({ err, userId: String(user._id) }, 'placeholder_student_record_create_failed');
        }
      }

      const token = generateToken(String(user._id), user.role);

      res.status(201).json({
        success: true,
        message: assignedRole === 'student'
          ? 'Account created. Please complete your profile to submit it for admin approval.'
          : 'Account created successfully',
        data: {
          token,
          user: {
            id: String(user._id),
            name: user.name,
            email: user.email,
            role: user.role,
            approvalStatus: student?.status ?? (assignedRole === 'student' ? 'draft' : 'active'),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
        return;
      }

      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      if (!user.isActive && user.role !== 'student') {
        res.status(403).json({
          success: false,
          message: 'Your account has been deactivated',
        });
        return;
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      const isPrivileged = user.role === 'admin' || user.role === 'teacher';
      if (isPrivileged && user.mfaEnabled) {
        res.status(200).json({
          success: true,
          mfaRequired: true,
          message: '2FA code required to complete login',
          data: {
            email: user.email,
          },
        });
        return;
      }

      const token = generateToken(String(user._id), user.role);
      const student = user.role === 'student'
        ? await Student.findOne({ userId: user._id }).select('status')
        : null;

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: String(user._id),
            name: user.name,
            email: user.email,
            role: user.role,
            mfaEnabled: user.mfaEnabled || false,
            approvalStatus: user.role === 'student' ? (student?.status ?? 'draft') : undefined,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyMfaLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        res.status(400).json({
          success: false,
          message: 'Email and 6-digit MFA code are required',
        });
        return;
      }

      const user = await User.findOne({ email }).select('+mfaSecret');
      if (!user || !user.mfaSecret || !user.mfaEnabled) {
        res.status(400).json({
          success: false,
          message: 'MFA is not configured for this user',
        });
        return;
      }

      const isValid = authenticator.check(code, user.mfaSecret);
      if (!isValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid or expired 6-digit MFA code',
        });
        return;
      }

      const token = generateToken(String(user._id), user.role);

      res.status(200).json({
        success: true,
        message: 'MFA verification successful',
        data: {
          token,
          user: {
            id: String(user._id),
            name: user.name,
            email: user.email,
            role: user.role,
            mfaEnabled: user.mfaEnabled,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async setupMfa(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = (req as any).user;
      const userId = authUser?.id || authUser?._id || authUser?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User ID not found in authentication token' });
        return;
      }

      const user = await User.findById(userId);

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      if (user.role === 'student') {
        res.status(403).json({
          success: false,
          message: 'MFA setup is restricted to Teachers and Admins',
        });
        return;
      }

      const secret = authenticator.generateSecret();
      user.mfaSecret = secret;
      await user.save();

      const otpauth = authenticator.keyuri(user.email, 'Student Records Suite', secret);
      const qrCodeUrl = await QRCode.toDataURL(otpauth);

      res.status(200).json({
        success: true,
        message: 'MFA QR code generated successfully',
        data: {
          qrCodeUrl,
          secret,
        },
      });
    } catch (error) {
      logger.error({ err: error, event: 'mfa_setup', userId: (req as any).user?.id }, 'mfa_setup_failed');
      next(error);
    }
  }

  async enableMfa(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.body;
      const authUser = (req as any).user;
      const userId = authUser?.id || authUser?._id || authUser?.userId;

      if (!code) {
        res.status(400).json({ success: false, message: '6-digit code is required' });
        return;
      }

      const user = await User.findById(userId).select('+mfaSecret');
      if (!user || !user.mfaSecret) {
        res.status(400).json({
          success: false,
          message: 'MFA setup has not been initiated for this account',
        });
        return;
      }

      const isValid = authenticator.check(code, user.mfaSecret);
      if (!isValid) {
        res.status(400).json({
          success: false,
          message: 'Invalid 6-digit verification code',
        });
        return;
      }

      user.mfaEnabled = true;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'MFA has been successfully enabled for your account',
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = (req as any).user;
      const userId = authUser?.id || authUser?._id || authUser?.userId;

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const student = user.role === 'student'
        ? await Student.findOne({ userId: user._id }).select('status')
        : null;

      res.status(200).json({
        success: true,
        data: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
          mfaEnabled: user.mfaEnabled || false,
          approvalStatus: user.role === 'student' ? (student?.status ?? 'draft') : undefined,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: Request, res: Response) {
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  }
}

export const authController = new AuthController();