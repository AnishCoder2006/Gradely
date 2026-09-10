import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Authentication Routes
router.post('/register',       authController.register);
router.post('/login',          authController.login);
router.post('/logout',         authController.logout);
router.get('/me',              protect, authController.me);

// Multi-Factor Authentication (MFA) Routes
router.get('/mfa/setup',       protect, authController.setupMfa);
router.post('/mfa/enable',     protect, authController.enableMfa);
router.post('/mfa/verify-login', authController.verifyMfaLogin);

export default router;