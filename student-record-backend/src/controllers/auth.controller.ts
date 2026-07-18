import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { UserRole } from '../models/User';

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

      const user = await User.create({
        name,
        email,
        password,
        role: role || 'student',
      });

      const token = generateToken(String(user._id), user.role);

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: {
          token,
          user: {
            id:    String(user._id),
            name:  user.name,
            email: user.email,
            role:  user.role,
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

      if (!user.isActive) {
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

      const token = generateToken(String(user._id), user.role);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id:    String(user._id),
            name:  user.name,
            email: user.email,
            role:  user.role,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await User.findById((req as any).user.id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      res.status(200).json({
        success: true,
        data: {
          id:    String(user._id),
          name:  user.name,
          email: user.email,
          role:  user.role,
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