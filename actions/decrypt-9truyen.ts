import { RowBlock, unscramble_image_rows_sync } from "../wasm/pkg/wasm"

const encryptedKey = "MzE0MTU5MjY1MzU4OTc5Mw++"

function decodeXor(data: Uint8Array, key: string): Uint8Array {
  const keyBytes = new TextEncoder().encode(key)
  const result = new Uint8Array(data.length)
  for (let i = 0; i < data.length; i++) {
    // biome-ignore lint/style/noNonNullAssertion: <false>
    result[i] = data[i]! ^ keyBytes[i % keyBytes.length]!
  }
  return result
}

function decodeDrm(drmBase64: string, decryptionKey: string): RowBlock[] {
  // Remove line breaks and decode base64
  const cleaned = drmBase64.replace(/\n/g, "")
  const drmBytes = Buffer.from(cleaned, "base64")
  const decrypted = decodeXor(drmBytes, decryptionKey)
  const decodedStr = new TextDecoder().decode(decrypted)

  if (!decodedStr.startsWith("#v4|")) {
    throw new Error("Invalid DRM format")
  }

  const parts = decodedStr.split("|").slice(1)
  const blocks: RowBlock[] = []

  for (const part of parts) {
    const [dyStr, heightStr] = part.split("-")
    if (!dyStr || !heightStr) continue
    blocks.push(new RowBlock(parseInt(dyStr, 10), parseInt(heightStr, 10)))
  }

  return blocks
}

async function decodeAndBuildImage(
  buffer: Uint8Array,
  drmData: string
): Promise<Uint8Array> {
  // Base64 decode the key (similar logic as Dart)
  const trimmed = `${encryptedKey.substring(0, encryptedKey.length - 2)}==`
  const key = Buffer.from(trimmed, "base64").toString("utf-8")

  const blocks = decodeDrm(drmData.trim(), key)
  const output = unscramble_image_rows_sync(buffer, blocks)
  return output
}

export async function decrypt9truyen(
  url: string,
  drmData: string
) {
  const res = await fetch(url)
  const contentType = res.headers.get("content-type")
  if (!res.ok) throw new Error(await res.text())
  const buffer = await res.arrayBuffer()

  return { buffer: await decodeAndBuildImage(new Uint8Array(buffer), drmData), contentType }
}
