import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Xổ số Tết',
  description: 'Lưu và hiển thị kết quả quay số Tết'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
