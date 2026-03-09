import { NextResponse } from "next/server"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const encoder = new TextEncoder()
  let intervalId: NodeJS.Timeout | undefined

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(":ok\n\n"))
      controller.enqueue(encoder.encode("event: ready\ndata: {}\n\n"))

      intervalId = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: {"type":"heartbeat"}\n\n`))
        } catch {
          if (intervalId) clearInterval(intervalId)
        }
      }, 20000)
    },
    cancel() {
      if (intervalId) clearInterval(intervalId)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache, no-transform",
    },
  })
}

