import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { signOut } from '@/auth';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'Superexpert AI - Open source AI for everyone',
    description: 'Build powerful AI agents in minutes',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <nav className="flex items-center justify-between p-4 bg-gray-50">
                    <div className="flex items-center gap-4">
                        <a href="/">
                            <div className="text-lg font-semibold">Superexpert AI</div>
                        </a>
                    </div>
                    <div>
                        <form
                            action={async () => {
                                'use server';
                                await signOut({ redirectTo: '/login' });
                            }}>
                            <button className="flex h-[48px] w-full grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3">
                                <div className="hidden md:block">Sign Out</div>
                            </button>
                        </form>
                    </div>
                </nav>
                {children}
            </body>
        </html>
    );
}
