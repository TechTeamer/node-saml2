import * as crypto from "crypto";

export function getSigningAlgorithm(shortName?: string): string {
  switch (shortName) {
    case "ecdsa-sha384":
      return "http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha384";
    case "sha256":
      return "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256";
    case "sha512":
      return "http://www.w3.org/2001/04/xmldsig-more#rsa-sha512";
    case "sha1":
    default:
      return "http://www.w3.org/2000/09/xmldsig#rsa-sha1";
  }
}

export function getDigestAlgorithm(shortName?: string): string {
  switch (shortName) {
    case "sha256":
      return "http://www.w3.org/2001/04/xmlenc#sha256";
    case "sha384":
      return "http://www.w3.org/2001/04/xmlenc#sha384";
    case "sha512":
      return "http://www.w3.org/2001/04/xmlenc#sha512";
    case "sha1":
    default:
      return "http://www.w3.org/2000/09/xmldsig#sha1";
  }
}

export function getSigner(shortName?: string): crypto.Signer {
  switch (shortName) {
    case "ecdsa-sha384":
      return crypto.createSign("sha384");
    case "sha256":
      return crypto.createSign("RSA-SHA256");
    case "sha512":
      return crypto.createSign("RSA-SHA512");
    case "sha1":
    default:
      return crypto.createSign("RSA-SHA1");
  }
}
