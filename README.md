# Xổ số Tết - Next.js (Vercel)

Ứng dụng nhập và hiển thị kết quả quay số cho các nhóm giải:
- 45 giải khuyến khích (3 số)
- 5 giải ba (4 số, số đầu 0-2)
- 3 giải nhì (4 số, số đầu 0-2)
- 1 giải nhất (4 số, số đầu 0-2)
- 1 giải đặc biệt (4 số, số đầu 0-2)

## Luật nhập liệu
- Nhập theo thứ tự: khuyến khích → ba → nhì → nhất → đặc biệt.
- Giải khuyến khích: `xxx` (0-9).
- Các giải còn lại: `yxxx` với `y` từ 0-2.
- 3 số cuối của giải ba/nhì/nhất/đặc biệt **không được trùng** với bất kỳ số nào của giải khuyến khích.

## Chạy local
```bash
npm install
npm run dev
```

## Deploy Vercel
Có thể deploy trực tiếp repo này lên Vercel (framework preset: Next.js).

> Lưu ý: API hiện đang ghi vào `data/results.json` bằng filesystem server. Trên Vercel, filesystem không bền vững giữa các lần cold start/deploy.
> Để lưu lâu dài trên production Vercel, nên thay API lưu trữ sang Vercel KV / Blob / Postgres.
