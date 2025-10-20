const proxy = process.env.HTTP_PROXY

export const baseUrl = `${proxy ? `${proxy}?url=` : ""}${process.env.TARGET_URL ?? "https://cuutruyen.net"}`
