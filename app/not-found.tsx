import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center section-padding">
      <div className="text-center max-w-md">
        <p className="text-8xl font-bold gradient-text mb-4" aria-hidden="true">
          404
        </p>
        <h1 className="heading-md text-slate-900 dark:text-white mb-3">
          Page not found
        </h1>
        <p className="body-md mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            Go Home
          </Link>
          <Link
            href="/case-studies"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors hover:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Case Studies
          </Link>
        </div>
      </div>
    </div>
  );
}
