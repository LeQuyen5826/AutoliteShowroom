import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { sendSuccess, sendError } from '../../utils/response';
import path from 'path';
import fs from 'fs';

const OUTPUT_DIR = path.join(process.cwd(), 'uploads', 'contracts');

// Đảm bảo thư mục tồn tại
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);

/**
 * POST /api/orders/:id/contract
 * Tạo hợp đồng cho đơn hàng
 */
export const createContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const order_id = req.params.id;

    const order = await prisma.order.findUnique({
      where: { id: order_id },
      include: {
        car: { include: { branch: true } },
        customer: true,
        branch: true,
        contract: true,
      },
    });

    if (!order) { sendError(res, 'Không tìm thấy đơn hàng', 404); return; }
    if (order.status === 'cancelled') { sendError(res, 'Không thể tạo hợp đồng cho đơn đã hủy', 400); return; }
    if (order.contract) { sendError(res, 'Hợp đồng đã tồn tại', 409); return; }

    // Tạo nội dung hợp đồng dạng HTML (lưu file, Sprint 3 sẽ convert PDF)
    const contractHtml = generateContractHtml(order);
    const filename = `contract_${order_id}_${Date.now()}.html`;
    const filepath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filepath, contractHtml, 'utf-8');

    const file_url = `/uploads/contracts/${filename}`;

    const contract = await prisma.contract.create({
      data: {
        order_id,
        file_url,
        signed_at: null,
      },
    });

    sendSuccess(res, contract, 'Tạo hợp đồng thành công', 201);
  } catch (err) {
    console.error('[createContract]', err);
    sendError(res);
  }
};

/**
 * GET /api/orders/:id/contract
 */
export const getContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const contract = await prisma.contract.findUnique({
      where: { order_id: req.params.id },
      include: { order: { include: { car: true, customer: true } } },
    });

    if (!contract) { sendError(res, 'Chưa có hợp đồng cho đơn này', 404); return; }

    sendSuccess(res, contract);
  } catch (err) {
    console.error('[getContract]', err);
    sendError(res);
  }
};

/**
 * PATCH /api/orders/:id/contract/sign
 * Xác nhận ký hợp đồng
 */
export const signContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const contract = await prisma.contract.findUnique({ where: { order_id: req.params.id } });
    if (!contract) { sendError(res, 'Không tìm thấy hợp đồng', 404); return; }

    const updated = await prisma.contract.update({
      where: { order_id: req.params.id },
      data: { signed_at: new Date() },
    });

    sendSuccess(res, updated, 'Ký hợp đồng thành công');
  } catch (err) {
    console.error('[signContract]', err);
    sendError(res);
  }
};

// ─── Sinh HTML hợp đồng ───────────────────────────────────────────────────────
function generateContractHtml(order: {
  id: string;
  type: string;
  total_amount: unknown;
  created_at: Date;
  notes?: string | null;
  car: { brand: string; model: string; year: number; fuel_type: string; transmission: string };
  customer: { full_name: string; email: string; phone?: string | null };
  branch: { name: string; address?: string | null; phone?: string | null };
}) {
  const typeLabel = order.type === 'deposit' ? 'ĐẶT CỌC XE' : 'MUA XE';
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Hợp đồng ${typeLabel}</title>
  <style>
    body { font-family: 'Times New Roman', serif; max-width: 800px; margin: 40px auto; color: #1a1a1a; line-height: 1.8; }
    h1 { text-align: center; font-size: 20px; text-transform: uppercase; margin-bottom: 4px; }
    .subtitle { text-align: center; font-size: 14px; color: #555; margin-bottom: 30px; }
    .section { margin-bottom: 24px; }
    .section h2 { font-size: 15px; border-bottom: 1px solid #333; padding-bottom: 4px; margin-bottom: 12px; }
    .row { display: flex; gap: 8px; margin-bottom: 6px; }
    .label { font-weight: bold; min-width: 200px; }
    .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
    .sig-box { text-align: center; width: 200px; }
    .sig-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 6px; font-size: 13px; }
  </style>
</head>
<body>
  <h1>Hợp đồng ${typeLabel}</h1>
  <div class="subtitle">Số hợp đồng: HD-${order.id.slice(0, 8).toUpperCase()} | Ngày: ${formatDate(order.created_at)}</div>

  <div class="section">
    <h2>I. Thông tin khách hàng</h2>
    <div class="row"><span class="label">Họ và tên:</span><span>${order.customer.full_name}</span></div>
    <div class="row"><span class="label">Email:</span><span>${order.customer.email}</span></div>
    <div class="row"><span class="label">Điện thoại:</span><span>${order.customer.phone || '—'}</span></div>
  </div>

  <div class="section">
    <h2>II. Thông tin xe</h2>
    <div class="row"><span class="label">Hãng xe:</span><span>${order.car.brand}</span></div>
    <div class="row"><span class="label">Model:</span><span>${order.car.model}</span></div>
    <div class="row"><span class="label">Năm sản xuất:</span><span>${order.car.year}</span></div>
    <div class="row"><span class="label">Nhiên liệu:</span><span>${order.car.fuel_type}</span></div>
    <div class="row"><span class="label">Hộp số:</span><span>${order.car.transmission}</span></div>
  </div>

  <div class="section">
    <h2>III. Điều khoản giao dịch</h2>
    <div class="row"><span class="label">Loại hợp đồng:</span><span>${typeLabel}</span></div>
    <div class="row"><span class="label">Giá trị hợp đồng:</span><span><strong>${formatCurrency(Number(order.total_amount))}</strong></span></div>
    <div class="row"><span class="label">Chi nhánh:</span><span>${order.branch.name} — ${order.branch.address || ''}</span></div>
    ${order.notes ? `<div class="row"><span class="label">Ghi chú:</span><span>${order.notes}</span></div>` : ''}
  </div>

  <div class="section">
    <h2>IV. Cam kết</h2>
    <p>Hai bên cam kết thực hiện đúng các điều khoản trong hợp đồng này. Mọi tranh chấp sẽ được giải quyết theo quy định của pháp luật Việt Nam.</p>
  </div>

  <div class="signatures">
    <div class="sig-box">
      <div class="sig-line">Đại diện Showroom</div>
    </div>
    <div class="sig-box">
      <div class="sig-line">Khách hàng</div>
    </div>
  </div>
</body>
</html>`;
}
