import Link from 'next/link';
import { Heart } from 'lucide-react';

export function Footer() {
    return (
        <footer className="w-full border-t bg-white py-6">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row md:py-0">
                <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
                    <p className="text-center text-sm leading-loose text-slate-600 md:text-left">
                        Built by{' '}
                        <Link
                            href="#"
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium underline underline-offset-4"
                        >
                            Botbari
                        </Link>
                        . This website Make Botbari.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span>Made with</span>
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    <span>for better workflow</span>
                </div>
            </div>
        </footer>
    );
}
