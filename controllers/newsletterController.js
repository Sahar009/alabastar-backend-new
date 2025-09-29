import newsletterService from '../services/newsletterService.js';
import { validationResult, body, query } from 'express-validator';

export const validateSubscribe = [
  body('email').isEmail().withMessage('Valid email is required')
];

export const validateUnsubscribe = [
  query('email').optional().isEmail().withMessage('Email must be valid'),
  body('email').optional().isEmail().withMessage('Email must be valid'),
  query('token').optional().isString(),
  body('token').optional().isString()
];

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
};

export const subscribe = async (req, res, next) => {
  try {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    const { email } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || null;

    const result = await newsletterService.subscribe(email, ipAddress);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const unsubscribe = async (req, res, next) => {
  try {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    const email = req.body.email || req.query.email;
    const token = req.body.token || req.query.token;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const result = await newsletterService.unsubscribe(email, token);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const isSubscribed = async (req, res, next) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email query param is required' });
    }
    const result = await newsletterService.isSubscribed(email);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const listSubscribers = async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const result = await newsletterService.getSubscribers(page, limit);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export default {
  subscribe,
  unsubscribe,
  isSubscribed,
  listSubscribers,
  validateSubscribe,
  validateUnsubscribe
};
















