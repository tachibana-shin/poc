const proxy = process.env.HTTP_PROXY_CURL

export const baseUrl = `${proxy ? `${proxy}?url=` : ""}${process.env.TARGET_URL || "https://cuutruyen.net"}`
