import { Zap } from "lucide-react"

export function Logo() {
  return (
    <div className="flex items-center space-x-2">
      <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
        <Zap className="w-6 h-6 text-white" />
      </div>
      <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        QtusDev Market
      </span>
    </div>
  )
}
