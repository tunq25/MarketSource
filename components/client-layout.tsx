"use client"

import React, { Suspense } from "react"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { Providers } from "@/components/providers"
import { CustomCursor } from "@/components/custom-cursor"
import { FinePointerOnly } from "@/components/fine-pointer-only"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { isStoreMobileNavPath } from "@/lib/mobile-store-nav"
import { cn } from "@/lib/utils"

const ChatWidget = dynamic(
  () => import("@/components/chat-widget").then(mod => ({ default: mod.ChatWidget })),
  {
    ssr: false,
    loading: () => <div className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-muted animate-pulse" />,
  },
)

const ServiceWorkerRegister = dynamic(
  () => import("@/components/service-worker-register").then(mod => ({ default: mod.ServiceWorkerRegister })),
  {
    ssr: false,
    loading: () => null,
  },
)

// Lazy load ErrorBoundary để tránh xung đột với @react-three/fiber trong quá trình module evaluation
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { runStorageMigration } from "@/lib/storage-migration"

function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const padForMobileNav = isStoreMobileNavPath(pathname)

  return (
    <div
      className={cn(
        "min-h-screen bg-background text-foreground antialiased",
        padForMobileNav &&
          "pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-0"
      )}
    >
      {children}
      <Suspense fallback={null}>
        <ChatWidget />
      </Suspense>
      <MobileBottomNav />
      <ServiceWorkerRegister />
      <FinePointerOnly>
        <CustomCursor />
      </FinePointerOnly>
    </div>
  )
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    runStorageMigration()
    import("@/lib/csrf-client")
      .then(({ getCsrfToken }) => getCsrfToken().catch(() => undefined))
      .catch(() => undefined)
  }, [])

  return (
    <Providers>
      <ErrorBoundary>
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
          <LayoutShell>{children}</LayoutShell>
        </Suspense>
      </ErrorBoundary>
    </Providers>
  )
}

