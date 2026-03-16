import React from "react";

interface LoadableProps {
  isLoading?: boolean;
  isError?: boolean;
  fallback: React.ReactNode;
  errorFallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Generic wrapper for handling loading & error UI.
 * So we don't have to repeat this logic in every component.
 */
export function Loadable({
  isLoading,
  isError,
  fallback,
  errorFallback,
  children,
}: LoadableProps) {
  if (isError) return <>{errorFallback ?? null}</>;
  if (isLoading) return <>{fallback}</>;

  // if Suspense is used, this still works because React will suspend children automatically
  return <>{children}</>;
}
