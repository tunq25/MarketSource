"use client"

import { useEffect, useState } from "react"
import { Shield, AlertTriangle, CheckCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SecurityStatus {
  isSecure: boolean
  protocol: string
  userAgent: string
  timestamp: string
}

export function Security() {
  const [status, setStatus] = useState<SecurityStatus | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setStatus({
        isSecure: window.location.protocol === "https:",
        protocol: window.location.protocol,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      })
    }
  }, [])

  if (!status) return null

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          {status.isSecure ? (
            <CheckCircle className="w-8 h-8 text-green-500" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          )}
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          <Shield className="w-5 h-5" />
          Security Status
        </CardTitle>
        <CardDescription>Connection and device information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Connection:</span>
          <Badge variant={status.isSecure ? "default" : "secondary"}>
            {status.isSecure ? "Secure (HTTPS)" : "Insecure (HTTP)"}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Protocol:</span>
          <Badge variant="outline">{status.protocol}</Badge>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium">Device Info:</span>
          <p className="text-xs text-muted-foreground break-all">{status.userAgent}</p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Checked:</span>
          <span className="text-xs text-muted-foreground">{new Date(status.timestamp).toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}
