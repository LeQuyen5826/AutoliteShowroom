import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../../config/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { sendSuccess, sendError } from '../../utils/response';

const SALT_ROUNDS = 12;

/**
 * POST /api/auth/register
 * Đăng ký tài khoản khách hàng
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { full_name, email, password, phone } = req.body;

    // Kiểm tra email đã tồn tại chưa
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      sendError(res, 'Email đã được sử dụng', 409);
      return;
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: { full_name, email, password_hash, phone, role: 'customer' },
      select: { id: true, full_name: true, email: true, phone: true, role: true, created_at: true },
    });

    sendSuccess(res, user, 'Đăng ký thành công', 201);
  } catch (err) {
    console.error('[register]', err);
    sendError(res, 'Đăng ký thất bại');
  }
};

/**
 * POST /api/auth/login
 * Đăng nhập, trả về access token + refresh token
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      sendError(res, 'Email hoặc mật khẩu không đúng', 401);
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      sendError(res, 'Email hoặc mật khẩu không đúng', 401);
      return;
    }

    const payload = { user_id: user.id, role: user.role };
    const access_token = signAccessToken(payload);
    const refresh_token = signRefreshToken(payload);

    sendSuccess(res, {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    }, 'Đăng nhập thành công');
  } catch (err) {
    console.error('[login]', err);
    sendError(res, 'Đăng nhập thất bại');
  }
};

/**
 * POST /api/auth/refresh
 * Làm mới access token bằng refresh token
 */
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      sendError(res, 'Thiếu refresh token', 400);
      return;
    }

    const decoded = verifyRefreshToken(refresh_token);

    // Kiểm tra user vẫn tồn tại trong DB
    const user = await prisma.user.findUnique({ where: { id: decoded.user_id } });
    if (!user) {
      sendError(res, 'Người dùng không tồn tại', 401);
      return;
    }

    const access_token = signAccessToken({ user_id: user.id, role: user.role });

    sendSuccess(res, { access_token }, 'Làm mới token thành công');
  } catch {
    sendError(res, 'Refresh token không hợp lệ hoặc đã hết hạn', 401);
  }
};
