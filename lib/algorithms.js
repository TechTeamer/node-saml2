"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSigner = exports.getDigestAlgorithm = exports.getSigningAlgorithm = void 0;
const crypto = require("crypto");
function getSigningAlgorithm(shortName) {
    switch (shortName) {
        case "ecdsa-sha384":
            return "http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha384";
        case "ecdsa-sha256":
            return "http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256";
        case "sha384":
            return "http://www.w3.org/2001/04/xmldsig-more#rsa-sha384";
        case "sha256":
            return "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256";
        case "sha512":
            return "http://www.w3.org/2001/04/xmldsig-more#rsa-sha512";
        case "sha1":
        default:
            return "http://www.w3.org/2000/09/xmldsig#rsa-sha1";
    }
}
exports.getSigningAlgorithm = getSigningAlgorithm;
function getDigestAlgorithm(shortName) {
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
exports.getDigestAlgorithm = getDigestAlgorithm;
function getSigner(shortName) {
    switch (shortName) {
        case "ecdsa-sha384":
            return crypto.createSign("sha384");
        case "ecdsa-sha256":
            return crypto.createSign("sha256");
        case "sha384":
            return crypto.createSign("RSA-SHA384");
        case "sha256":
            return crypto.createSign("RSA-SHA256");
        case "sha512":
            return crypto.createSign("RSA-SHA512");
        case "sha1":
        default:
            return crypto.createSign("RSA-SHA1");
    }
}
exports.getSigner = getSigner;
//# sourceMappingURL=algorithms.js.map