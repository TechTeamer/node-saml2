"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVerify = exports.createSign = exports.createHash = exports.removeCertPEMHeaderAndFooter = exports.generateUniqueId = exports.certToPEM = exports.keyToPEM = void 0;
const crypto = require("crypto");
const utility_1 = require("./utility");
const keyToPEM = (key) => {
    (0, utility_1.assertRequired)(key, "key is required");
    if (typeof key !== "string")
        return key;
    if (key.split(/\r?\n/).length !== 1)
        return key;
    const matchedKey = key.match(/.{1,64}/g);
    if (matchedKey) {
        const wrappedKey = [
            "-----BEGIN PRIVATE KEY-----",
            ...matchedKey,
            "-----END PRIVATE KEY-----",
            "",
        ].join("\n");
        return wrappedKey;
    }
    throw new Error("Invalid key");
};
exports.keyToPEM = keyToPEM;
const certToPEM = (cert) => {
    const lines = cert.match(/.{1,64}/g);
    (0, utility_1.assertRequired)(lines, "cert is invalid");
    let pem = lines.join("\n");
    if (pem.indexOf("-BEGIN CERTIFICATE-") === -1)
        pem = "-----BEGIN CERTIFICATE-----\n" + pem;
    if (pem.indexOf("-END CERTIFICATE-") === -1)
        pem = pem + "\n-----END CERTIFICATE-----\n";
    return pem;
};
exports.certToPEM = certToPEM;
const generateUniqueId = () => {
    return "_" + crypto.randomBytes(20).toString("hex");
};
exports.generateUniqueId = generateUniqueId;
const removeCertPEMHeaderAndFooter = (certificate) => {
    // These headers and footers are standard: https://www.ssl.com/guide/pem-der-crt-and-cer-x-509-encodings-and-conversions/#ftoc-heading-1
    certificate = certificate.replace(/-----BEGIN CERTIFICATE-----\r?\n?/, "");
    certificate = certificate.replace(/-----END CERTIFICATE-----\r?\n?/, "");
    certificate = certificate.replace(/\r\n/g, "\n");
    return certificate;
};
exports.removeCertPEMHeaderAndFooter = removeCertPEMHeaderAndFooter;
const createHash = (algorithm) => {
    return crypto.createHash(algorithm);
};
exports.createHash = createHash;
const createSign = (algorithm) => {
    return crypto.createSign(algorithm);
};
exports.createSign = createSign;
const createVerify = (algorithm) => {
    return crypto.createVerify(algorithm);
};
exports.createVerify = createVerify;
//# sourceMappingURL=crypto.js.map