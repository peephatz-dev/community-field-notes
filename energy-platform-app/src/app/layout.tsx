import type { Metadata } from 'next';
import '@fontsource-variable/manrope';
import '@fontsource/ibm-plex-sans-thai/400.css';
import '@fontsource/ibm-plex-sans-thai/500.css';
import '@fontsource/ibm-plex-sans-thai/600.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Community Energy Resilience Platform · บ้านศาลาหุม',
  description: 'ระบบสาธิตจำลองดิจิทัลทวินพลังงานและการเพาะเลี้ยงสัตว์น้ำสำหรับบ้านศาลาหุม ระบุสถานะจำลองและข้อจำกัดอย่างชัดเจน',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
