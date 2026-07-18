import rateLimit from 'express-rate-limit';

// ── REST rate limiters ──
// Separate, generous limiter for posting announcements (admin/teacher only,
// low volume by nature — but still capped to prevent accidental loops/bugs).
export const announcementLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 10,                   // 10 announcements per minute per IP+user
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many announcements posted. Please wait a moment before posting again.',
  },
  keyGenerator: (req: any) => req.user?.id || req.ip,
});

// Stricter limiter for doubt creation/replies — this is the most spam-prone
// surface since any student can hit it repeatedly.
export const doubtLimiter = rateLimit({
  windowMs: 10 * 1000,       // 10 second window
  max: 5,                    // 5 messages per 10 seconds per user
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'You are sending messages too quickly. Please slow down.',
  },
  keyGenerator: (req: any) => req.user?.id || req.ip,
});

// Looser daily cap to stop sustained abuse that slips under the burst limiter
export const doubtDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 100,                       // 100 doubt messages per day per user
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Daily message limit reached. Please try again tomorrow.',
  },
  keyGenerator: (req: any) => req.user?.id || req.ip,
});