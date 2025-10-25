import { patch } from "../../delay-fetch"

if (process.env.DELAY_FETCH === "true" || process.env.DELAY_FETCH === true) {
  patch()
}

const proxy = process.env.HTTP_PROXY_CURL

export const baseUrl = `${proxy ? `${proxy}?url=` : ""}${process.env.TARGET_URL || "https://cuutruyen.net"}`
export const requestInit: RequestInit = {
  headers: {
    accept: "application/json",
    "accept-language": "vi,en;q=0.9,en-GB;q=0.8,en-US;q=0.7",
    "cache-control": "no-cache",
    pragma: "no-cache",
    priority: "u=1, i",
    // referer: "https://cuutruyen5c844.site/mangas/3150",
    "sec-ch-ua":
      '"Microsoft Edge";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
    "sec-ch-ua-arch": '"x86"',
    "sec-ch-ua-bitness": '"64"',
    "sec-ch-ua-full-version": '"141.0.3537.71"',
    "sec-ch-ua-full-version-list":
      '"Microsoft Edge";v="141.0.3537.71", "Not?A_Brand";v="8.0.0.0", "Chromium";v="141.0.7390.66"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-model": '""',
    "sec-ch-ua-platform": '"Windows"',
    "sec-ch-ua-platform-version": '"19.0.0"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0"
  }
}
