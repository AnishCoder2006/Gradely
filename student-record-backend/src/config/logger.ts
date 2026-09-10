import dotenv from 'dotenv';
import pino from 'pino';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const level = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

export const logger = pino({
    level,
    redact: {
        paths: [
            'password',
            '*.password',
            'passwordConfirmation',
            '*.passwordConfirmation',
            'token',
            '*.token',
            'accessToken',
            '*.accessToken',
            'refreshToken',
            '*.refreshToken',
            'jwt',
            '*.jwt',
            'authorization',
            '*.authorization',
            'req.headers.authorization',
            'req.headers.cookie',
            'totpSecret',
            '*.totpSecret',
            'secret',
            '*.secret',
            'razorpay_signature',
            '*.razorpay_signature',
            'razorpaySignature',
            '*.razorpaySignature',
            'key_secret',
            '*.key_secret',
            'RAZORPAY_KEY_SECRET',
        ],
        censor: '[REDACTED]',
    },
    ...(isProduction ? {} : {
        transport: {
            target: 'pino-pretty',
            options: { colorize: true, singleLine: true },
        },
    }),
});

export default logger;