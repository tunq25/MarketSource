import speakeasy from "speakeasy"
import QRCode from "qrcode"

export function generateTwoFactorSecret(email: string) {
  const secret = speakeasy.generateSecret({
    name: `QtusDev (${email})`,
    length: 20,
  })

  return {
    ascii: secret.ascii,
    hex: secret.hex,
    base32: secret.base32,
    otpauthUrl: secret.otpauth_url!,
  }
}

export async function generateQRCodeData(url: string) {
  return QRCode.toDataURL(url)
}

export function verifyTwoFactorToken(secret: string, token: string) {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 1,
  })
}

export function generateBackupCodes(count = 5) {
  return Array.from({ length: count }).map(() =>
    Math.random().toString(36).slice(-10).toUpperCase()
  )
}

