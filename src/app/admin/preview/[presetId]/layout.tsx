import { LiffProvider } from "@/components/line/LiffProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function PreviewLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ErrorBoundary>
      <LiffProvider>
        {children}
      </LiffProvider>
    </ErrorBoundary>
  );
}