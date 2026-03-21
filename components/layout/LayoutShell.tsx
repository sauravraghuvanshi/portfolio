"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface LayoutShellProps {
  children: ReactNode;
  navigation: ReactNode;
  footer: ReactNode;
}

export default function LayoutShell({ children, navigation, footer }: LayoutShellProps) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <>
      {!isAdmin && navigation}
      <main id="main-content" className={isAdmin ? "" : "flex-1 pt-16"}>
        {children}
      </main>
      {!isAdmin && footer}
    </>
  );
}
