// index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const qs = require('qs');
const crypto = require('crypto');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.set('trust proxy', true);

/* ===== ENV ===== */
const ENV = {
  PORT: Number(process.env.PORT) || 3001,
  VNP_TMN_CODE: (process.env.VNP_TMN_CODE || '').trim(),
  VNP_HASH_SECRET: (process.env.VNP_HASH_SECRET || '').trim(),
  VNP_URL: (process.env.VNP_URL || '').trim(),
  VNP_RETURN_URL: (process.env.VNP_RETURN_URL || '').trim(),
};

/* ===== Helpers ===== */
const getClientIp = (req) => {
  const raw =
    req.headers['x-forwarded-for'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    (req.connection && req.connection.socket && req.connection.socket.remoteAddress) ||
    '';
  return String(raw).split(',')[0].trim().replace('::ffff:', '') || '127.0.0.1';
};

const yyyymmddHHmmss = (date = new Date(), timeZone = 'Asia/Ho_Chi_Minh') => {
  const f = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const p = f.formatToParts(date).reduce((a, x) => ((a[x.type] = x.value), a), {});
  return `${p.year}${p.month}${p.day}${p.hour}${p.minute}${p.second}`;
};

/* ===== sortObject kiểu VNPay (encode + space -> +) ===== */
function sortObject(obj) {
  const sorted = {};
  const keys = [];
  for (const k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== '' && obj[k] != null) {
      keys.push(encodeURIComponent(k));
    }
  }
  keys.sort();
  for (let i = 0; i < keys.length; i++) {
    const encKey = keys[i];
    const originalKey = decodeURIComponent(encKey);
    const val = String(obj[originalKey]);
    sorted[encKey] = encodeURIComponent(val).replace(/%20/g, '+');
  }
  return sorted;
}

/* =========================================================
 * POST /create_payment_url  → trả JSON { paymentUrl }
 * Body FE gửi: { amount, orderId?, bankCode? }
 * ========================================================= */
app.post('/create_payment_url', (req, res) => {
  try {
    const now = new Date();
    const clientIp = getClientIp(req);

    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount)) {
      return res.status(400).json({ error: 'amount phải là số (VND)' });
    }

    // vnp_TxnRef: chỉ chữ/số/_/-, tối đa 34 ký tự
    const rawOrderId = String(req.body.orderId || '').trim();
    const fallback = yyyymmddHHmmss(now).slice(-8);
    const orderId = (rawOrderId || fallback).replace(/[^0-9a-zA-Z_-]/g, '').slice(0, 34);

    // Tham số bắt buộc
    const params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: ENV.VNP_TMN_CODE,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_OrderType: 'other',
      vnp_Amount: String(Math.round(amount * 100)), // ×100 và ép chuỗi
      vnp_ReturnUrl: ENV.VNP_RETURN_URL,
      vnp_IpAddr: clientIp,
      vnp_CreateDate: yyyymmddHHmmss(now),
      vnp_ExpireDate: yyyymmddHHmmss(new Date(now.getTime() + 15 * 60 * 1000)),
    };
    if (req.body.bankCode) params.vnp_BankCode = req.body.bankCode;

    // sort + encode kiểu VNPay
    const sortedEncoded = sortObject(params);

    // Ký: KHÔNG encode thêm nữa, dùng qs.encode=false
    const signData = qs.stringify(sortedEncoded, { encode: false });
    const vnp_SecureHash = crypto
      .createHmac('sha512', ENV.VNP_HASH_SECRET)
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex'); // (chuẩn demo: hex thường; nếu sandbox kén, đổi .toUpperCase())

    // Build URL theo demo (encode=false để giữ dấu +)
    const paymentUrl =
      ENV.VNP_URL +
      '?' +
      qs.stringify(
        {
          ...sortedEncoded,
          // chuẩn demo VNPay thường không bắt buộc tham số này:
          // vnp_SecureHashType: 'SHA512',
          vnp_SecureHash,
        },
        { encode: false }
      );

    return res.json({
      paymentUrl,
      ...(process.env.NODE_ENV !== 'production' && { debug: { signData } }),
    });
    // Nếu muốn giống DEMO redirect thẳng:
    // return res.redirect(paymentUrl);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

/* ==========================================
 * GET /ipn  (nếu bạn cấu hình IPN trong portal)
 * Verify theo đúng sortObject mẫu
 * ========================================== */
app.get('/ipn', (req, res) => {
  try {
    const vnpParams = { ...req.query };
    const receivedSecureHash = String(vnpParams.vnp_SecureHash || '');
    delete vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHashType;

    const sortedEncoded = sortObject(vnpParams);
    const signData = qs.stringify(sortedEncoded, { encode: false });
    const expected = crypto
      .createHmac('sha512', ENV.VNP_HASH_SECRET)
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    if (receivedSecureHash !== expected) {
      return res.json({ RspCode: '97', Message: 'Invalid signature' });
    }

    // TODO: kiểm tra vnp_TxnRef, vnp_Amount, vnp_ResponseCode === "00"
    // -> cập nhật trạng thái đơn hàng trong DB

    return res.json({ RspCode: '00', Message: 'Confirm Success' });
  } catch (err) {
    console.error(err);
    return res.json({ RspCode: '99', Message: 'Unknown error' });
  }
});

/* (tuỳ chọn) nếu muốn VNPay trả về server rồi chuyển tiếp sang FE:
   - Cấu hình returnUrl của merchant = http://localhost:3001/return
   - ENV.VNP_RETURN_URL = http://localhost:5173/checkout/result
*/
app.get('/return', (req, res) => {
  try {
    const query = qs.stringify(req.query, { encode: true });
    const redirectTo = `${ENV.VNP_RETURN_URL}?${query}`;
    return res.redirect(redirectTo);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Internal error');
  }
});

app.listen(ENV.PORT, () =>
  console.log(`VNPay server running at http://localhost:${ENV.PORT}`)
);
