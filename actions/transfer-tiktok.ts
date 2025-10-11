export interface TikTokUploadResponse {
  msg: string
  code: number
  data: {
    image_info: {
      hash: string
      name: string
      src_h: number
      src_w: number
      width: number
      height: number
      format: string
      mode: number
      size: number
      d: number
      src_uri: string
      web_uri: string
      web_uri_v2: string
    }
    url: string
    uri: string
  }
  extra: Record<string, unknown>
}

export class TransferTiktokError extends Error {
  public readonly msg: string

  constructor(message: string) {
    super(message)
    this.msg = message
    this.name = "TransferTiktokError"
  }
}
export interface Cookie {
  cookies: { name: string; value: string }[]
}

export async function transferTiktok(
  url: string | Uint8Array,
  selectedCookie: Cookie,
  contentType?: null | string,
  urlBg?: string
) {
  const csrftoken = selectedCookie.cookies.find(
    item => item.name === "csrftoken"
  )?.value
  if (!csrftoken) {
    throw new TransferTiktokError("⚠️ No csrftoken found, retrying...")
  }

  const res =
    typeof url === "string"
      ? await fetch(url)
      : new Response(url, { status: 200 })
  if (!res.ok) throw new Error(await res.text())
  const buffer = await res.arrayBuffer()

  contentType ??= res.headers.get("content-type") ?? "image/jpg"
  const blob = new Blob([buffer], { type: contentType })

  const form = new FormData()
  form.append(
    "Filedata",
    new File([blob], `unnamed.${contentType.split("/")[1]}`)
  )

  const response = await fetch(
    "https://ads.tiktok.com/api/v2/i18n/material/image/upload/",
    {
      headers: {
        accept: "*/*",
        "accept-language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7,ja;q=0.6",
        "cache-control": "no-cache",
        pragma: "no-cache",
        "sec-ch-ua":
          '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "sec-gpc": "1",
        // csrftoken
        "x-csrftoken": csrftoken,
        cookie: selectedCookie.cookies
          .map(item => `${item.name}=${item.value}`)
          .join("; "),
        Referer: "https://ads.tiktok.com",
        // "https://ads.tiktok.com/i18n/creation/1nn/create/creative?aadvid=7377814567805894657&creation_type=create_new&campaign_snap_id=1802463382250529&campaign_draft_id=1802463382250545&temp_campaign_id=1802464010641441&adgroup_draft_id=1802463474179105",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      body: form,
      method: "POST"
    }
  )

  const text = await response.text()

  if (!response.ok) {
    throw new TransferTiktokError(await response.text())
  }

  const payload = JSON.parse(text)
  if (payload.code !== 0) {
    if (payload.msg.includes("is not a valid image file")) console.log(urlBg)
    throw new TransferTiktokError(payload.msg)
  }

  return payload as TikTokUploadResponse
}
