import { ReactNode } from "react";

export default function PageContainer({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {children}
    </div>
  );
}
