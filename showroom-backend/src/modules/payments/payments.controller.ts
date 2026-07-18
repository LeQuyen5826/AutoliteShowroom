import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { sendSuccess, sendError } from '../../utils/response';

/**
 * POST /api/orders/:id/payments
 * Staff/Admin ghi nhận thanh toán
 */
export const createPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, method, note } = req.body;
    const order_id = req.params.id;

    const order = await prisma.order.findUnique({ where: { id: order_id } });
    if (!order) { sendError(res, 'Không tìm thấy đơn hàng', 404); return; }
    if (order.status === 'cancelled') { sendError(res, 'Đơn hàng đã bị hủy', 400); return; }

    const payment = await prisma.payment.create({
      data: { order_id, amount, method, note },
    });

    sendSuccess(res, payment, 'Ghi nhận thanh toán thành công', 201);
  } catch (err) {
    console.error('[createPayment]', err);
    sendError(res);
  }
};

/**
 * GET /api/orders/:id/payments
 * Lịch sử thanh toán của đơn hàng
 */
export const listPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const order_id = req.params.id;

    const order = await prisma.order.findUnique({ where: { id: order_id } });
    if (!order) { sendError(res, 'Không tìm thấy đơn hàng', 404); return; }

    // Customer chỉ xem được đơn của mình
    if (req.user!.role === 'customer' && order.customer_id !== req.user!.user_id) {
      sendError(res, 'Không có quyền', 403); return;
    }

    const payments = await prisma.payment.findMany({
      where: { order_id },
      orderBy: { paid_at: 'desc' },
    });

    // Tính tổng đã thanh toán
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Number(order.total_amount) - totalPaid;

    sendSuccess(res, { payments, totalPaid, remaining, total: order.total_amount });
  } catch (err) {
    console.error('[listPayments]', err);
    sendError(res);
  }
};
