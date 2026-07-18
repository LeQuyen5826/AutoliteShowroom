import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { sendSuccess, sendError } from '../../utils/response';

/**
 * POST /api/orders
 * Khách hàng tạo đơn đặt cọc hoặc mua xe
 */
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { car_id, type, notes } = req.body;
    const customer_id = req.user!.user_id;

    // Kiểm tra xe tồn tại và còn hàng
    const car = await prisma.car.findUnique({ where: { id: car_id } });
    if (!car) { sendError(res, 'Không tìm thấy xe', 404); return; }
    if (car.status !== 'available') { sendError(res, 'Xe này hiện không còn hàng', 400); return; }

    // Tạo đơn hàng
    const order = await prisma.order.create({
      data: {
        customer_id,
        car_id,
        branch_id: car.branch_id,
        type,
        status: 'pending',
        total_amount: car.price,
        notes,
      },
      include: {
        car: { include: { images: { where: { is_primary: true }, take: 1 } } },
        customer: { select: { id: true, full_name: true, email: true, phone: true } },
        branch: true,
      },
    });

    // Cập nhật trạng thái xe thành reserved
    await prisma.car.update({
      where: { id: car_id },
      data: { status: 'reserved' },
    });

    sendSuccess(res, order, 'Tạo đơn hàng thành công', 201);
  } catch (err) {
    console.error('[createOrder]', err);
    sendError(res);
  }
};

/**
 * GET /api/orders
 * Customer: đơn của mình | Staff/Admin: tất cả đơn
 */
export const listOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, user_id } = req.user!;
    const { status, type, page = '1', limit = '10' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, parseInt(limit as string));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};
    if (role === 'customer') where.customer_id = user_id;
    if (status) where.status = status;
    if (type) where.type = type;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { created_at: 'desc' },
        include: {
          car: { include: { images: { where: { is_primary: true }, take: 1 } } },
          customer: { select: { id: true, full_name: true, email: true, phone: true } },
          branch: { select: { id: true, name: true } },
          payments: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    sendSuccess(res, {
      orders,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error('[listOrders]', err);
    sendError(res);
  }
};

/**
 * GET /api/orders/:id
 */
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, user_id } = req.user!;

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        car: { include: { images: true, branch: true } },
        customer: { select: { id: true, full_name: true, email: true, phone: true } },
        staff: { select: { id: true, full_name: true, email: true } },
        branch: true,
        payments: true,
        contract: true,
      },
    });

    if (!order) { sendError(res, 'Không tìm thấy đơn hàng', 404); return; }

    // Customer chỉ xem được đơn của mình
    if (role === 'customer' && order.customer_id !== user_id) {
      sendError(res, 'Không có quyền xem đơn hàng này', 403);
      return;
    }

    sendSuccess(res, order);
  } catch (err) {
    console.error('[getOrderById]', err);
    sendError(res);
  }
};

/**
 * PATCH /api/orders/:id/status
 * Staff/Admin cập nhật trạng thái đơn
 */
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const staff_id = req.user!.user_id;

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { car: true },
    });
    if (!order) { sendError(res, 'Không tìm thấy đơn hàng', 404); return; }

    // Cập nhật trạng thái đơn
    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status, staff_id },
      include: {
        car: true,
        customer: { select: { id: true, full_name: true, email: true } },
        payments: true,
      },
    });

    // Cập nhật trạng thái xe tương ứng
    if (status === 'completed') {
      await prisma.car.update({ where: { id: order.car_id }, data: { status: 'sold' } });
    } else if (status === 'cancelled') {
      await prisma.car.update({ where: { id: order.car_id }, data: { status: 'available' } });
    }

    sendSuccess(res, updated, 'Cập nhật trạng thái thành công');
  } catch (err) {
    console.error('[updateOrderStatus]', err);
    sendError(res);
  }
};
