"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

const MeteorShowerBackdrop = dynamic(
    () => import("@/components/meteor-shower-3d").then(mod => mod.MeteorShower3D),
    { ssr: false, loading: () => <div className="absolute inset-0 bg-[#0B0C10]" /> }
)

const CloudSkyBackdrop = dynamic(
    () => import("@/components/cloud-sky-3d").then(mod => mod.CloudSky3D),
    { ssr: false, loading: () => <div className="absolute inset-0 bg-blue-50" /> }
)

export function ThemeAwareBackground() {
    const { theme, systemTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // Đảm bảo chỉ render sau khi đã biết theme trên client để tránh hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        // Trạng thái chờ load ban đầu: nền xám nhẹ/đậm trung tính
        return <div className="absolute inset-0 bg-gray-50 dark:bg-[#0B0C10]" />
    }

    const currentTheme = theme === 'system' ? systemTheme : theme

    return currentTheme === 'dark' ? <MeteorShowerBackdrop /> : <CloudSkyBackdrop />
}
