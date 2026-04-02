import type { ReactNode } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <div className="animate-in fade-in duration-150">
      {children}
    </div>
  );
}
