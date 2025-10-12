const proxy = process.env.HTTP_PROXY

export const baseUrl = `${proxy ? `${proxy}?url=` : ""}https://cuutruyen5c844.site`
