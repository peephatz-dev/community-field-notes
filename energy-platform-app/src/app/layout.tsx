import type { Metadata } from 'next';
import '@fontsource-variable/manrope';
import '@fontsource/ibm-plex-sans-thai/400.css';
import '@fontsource/ibm-plex-sans-thai/500.css';
import '@fontsource/ibm-plex-sans-thai/600.css';
import './globals.css';
import '../styles/powerguard-tokens.css';
import '../styles/powerguard-vfx.css';
import '../styles/powerguard-app.css';
import PowerguardRuntime from '@/components/powerguard/Runtime';
import {BASE_PATH} from '@/lib/urls';

export const metadata: Metadata = {
  title: 'SALA HUM POWERGUARD · บ้านศาลาหุม',
  description: 'ดูไฟหลัก ไฟสำรอง และอุปกรณ์ของบ้านศาลาหุม พร้อมข้อมูลทดลองและโหมดวิศวกร',
  icons: {icon: BASE_PATH+'/powerguard/brand/favicon.ico',apple:BASE_PATH+'/powerguard/brand/app-icon-192.png'},
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body><PowerguardRuntime/>{children}</body></html>;
}
