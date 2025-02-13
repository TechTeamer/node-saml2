"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNameIdAsync = exports.promiseWithNameId = exports.buildXmlBuilderObject = exports.buildXml2JsObject = exports.parseXml2JsFromString = exports.parseDomFromString = exports.signXml = exports.validateXmlSignatureForCert = exports.validateSignature = exports.decryptXml = exports.xpath = void 0;
const util = require("util");
const xmlCrypto = require("xml-crypto");
const xmlenc = require("xml-encryption");
const xmldom = require("@xmldom/xmldom");
const xml2js = require("xml2js");
const xmlbuilder = require("xmlbuilder");
const types_1 = require("./types");
const algorithms = require("./algorithms");
const utility_1 = require("./utility");
const crypto_1 = require("./crypto");
const SHA384 = function () {
    this.getHash = function (xml) {
        const shasum = (0, crypto_1.createHash)('sha384');
        shasum.update(xml, 'utf8');
        const res = shasum.digest('base64');
        return res;
    };
    this.getAlgorithmName = function () {
        return "http://www.w3.org/2001/04/xmlenc#sha384";
    };
};
const ECDSASHA384 = function () {
    /*sign the given SignedInfo using the key. return base64 signature value*/
    this.getSignature = function (signedInfo, signingKey, callback) {
        const signer = (0, crypto_1.createSign)("sha384");
        signer.update(signedInfo);
        const res = signer.sign(signingKey, 'base64');
        if (callback)
            callback(null, res);
        return res;
    };
    /**
    * Verify the given signature of the given string using key
    *
    */
    this.verifySignature = function (str, key, signatureValue, callback) {
        const hasher = (0, crypto_1.createVerify)("sha384");
        const res = hasher.update(str).verify(key, signatureValue, 'base64');
        if (callback)
            callback(null, res);
        return res;
    };
    this.getAlgorithmName = function () {
        return 'http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha384';
    };
};
const ECDSASHA256 = function () {
    /*sign the given SignedInfo using the key. return base64 signature value*/
    this.getSignature = function (signedInfo, signingKey, callback) {
        const signer = (0, crypto_1.createSign)("sha256");
        signer.update(signedInfo);
        const res = signer.sign(signingKey, 'base64');
        if (callback)
            callback(null, res);
        return res;
    };
    /**
     * Verify the given signature of the given string using key
     *
     */
    this.verifySignature = function (str, key, signatureValue, callback) {
        const hasher = (0, crypto_1.createVerify)("sha256");
        const res = hasher.update(str).verify(key, signatureValue, 'base64');
        if (callback)
            callback(null, res);
        return res;
    };
    this.getAlgorithmName = function () {
        return 'http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256';
    };
};
const RSASHA384 = function () {
    /*sign the given SignedInfo using the key. return base64 signature value*/
    this.getSignature = function (signedInfo, signingKey, callback) {
        const signer = (0, crypto_1.createSign)("RSA-SHA384");
        signer.update(signedInfo);
        const res = signer.sign(signingKey, 'base64');
        if (callback)
            callback(null, res);
        return res;
    };
    /**
     * Verify the given signature of the given string using key
     *
     */
    this.verifySignature = function (str, key, signatureValue, callback) {
        const hasher = (0, crypto_1.createVerify)("RSA-SHA384");
        const res = hasher.update(str).verify(key, signatureValue, 'base64');
        if (callback)
            callback(null, res);
        return res;
    };
    this.getAlgorithmName = function () {
        return 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha384';
    };
};
// @ts-ignore
xmlCrypto.SignedXml.SignatureAlgorithms["http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha384"] = ECDSASHA384;
// @ts-ignore
xmlCrypto.SignedXml.SignatureAlgorithms["http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256"] = ECDSASHA256;
// @ts-ignore
xmlCrypto.SignedXml.SignatureAlgorithms["http://www.w3.org/2001/04/xmldsig-more#rsa-sha384"] = RSASHA384;
// @ts-ignore
xmlCrypto.SignedXml.HashAlgorithms['http://www.w3.org/2001/04/xmlenc#sha384'] = SHA384;
const selectXPath = (guard, node, xpath) => {
    const result = xmlCrypto.xpath(node, xpath);
    if (!guard(result)) {
        throw new Error("invalid xpath return type");
    }
    return result;
};
const attributesXPathTypeGuard = (values) => {
    return values.every((value) => {
        if (typeof value != "object") {
            return false;
        }
        return typeof value.nodeType === "number" && value.nodeType === value.ATTRIBUTE_NODE;
    });
};
const elementsXPathTypeGuard = (values) => {
    return values.every((value) => {
        if (typeof value != "object") {
            return false;
        }
        return typeof value.nodeType === "number" && value.nodeType === value.ELEMENT_NODE;
    });
};
exports.xpath = {
    selectAttributes: (node, xpath) => selectXPath(attributesXPathTypeGuard, node, xpath),
    selectElements: (node, xpath) => selectXPath(elementsXPathTypeGuard, node, xpath),
};
const decryptXml = async (xml, decryptionKey) => util.promisify(xmlenc.decrypt).bind(xmlenc)(xml, { key: decryptionKey });
exports.decryptXml = decryptXml;
/**
 * we can use this utility before passing XML to `xml-crypto`
 * we are considered the XML processor and are responsible for newline normalization
 * https://github.com/node-saml/passport-saml/issues/431#issuecomment-718132752
 */
const normalizeNewlines = (xml) => {
    return xml.replace(/\r\n?/g, "\n");
};
/**
 * This function checks that the |currentNode| in the |fullXml| document contains exactly 1 valid
 *   signature of the |currentNode|.
 *
 * See https://github.com/bergie/passport-saml/issues/19 for references to some of the attack
 *   vectors against SAML signature verification.
 */
const validateSignature = (fullXml, currentNode, certs) => {
    const xpathSigQuery = ".//*[" +
        "local-name(.)='Signature' and " +
        "namespace-uri(.)='http://www.w3.org/2000/09/xmldsig#' and " +
        "descendant::*[local-name(.)='Reference' and @URI='#" +
        currentNode.getAttribute("ID") +
        "']" +
        "]";
    const signatures = exports.xpath.selectElements(currentNode, xpathSigQuery);
    // This function is expecting to validate exactly one signature, so if we find more or fewer
    //   than that, reject.
    if (signatures.length !== 1) {
        return false;
    }
    const xpathTransformQuery = ".//*[" +
        "local-name(.)='Transform' and " +
        "namespace-uri(.)='http://www.w3.org/2000/09/xmldsig#' and " +
        "ancestor::*[local-name(.)='Reference' and @URI='#" +
        currentNode.getAttribute("ID") +
        "']" +
        "]";
    const transforms = exports.xpath.selectElements(currentNode, xpathTransformQuery);
    // Reject also XMLDSIG with more than 2 Transform
    if (transforms.length > 2) {
        // do not return false, throw an error so that it can be caught by tests differently
        throw new Error("Invalid signature, too many transforms");
    }
    const signature = signatures[0];
    return certs.some((certToCheck) => {
        return (0, exports.validateXmlSignatureForCert)(signature, (0, crypto_1.certToPEM)(certToCheck), fullXml, currentNode);
    });
};
exports.validateSignature = validateSignature;
/**
 * This function checks that the |signature| is signed with a given |cert|.
 */
const validateXmlSignatureForCert = (signature, certPem, fullXml, currentNode) => {
    const sig = new xmlCrypto.SignedXml();
    sig.keyInfoProvider = {
        // @ts-ignore
        file: "",
        getKeyInfo: () => "<X509Data></X509Data>",
        getKey: () => Buffer.from(certPem),
    };
    sig.loadSignature(signature);
    // We expect each signature to contain exactly one reference to the top level of the xml we
    //   are validating, so if we see anything else, reject.
    if (sig.references.length != 1)
        return false;
    const refUri = sig.references[0].uri;
    (0, utility_1.assertRequired)(refUri, "signature reference uri not found");
    const refId = refUri[0] === "#" ? refUri.substring(1) : refUri;
    // If we can't find the reference at the top level, reject
    const idAttribute = currentNode.getAttribute("ID") ? "ID" : "Id";
    if (currentNode.getAttribute(idAttribute) != refId)
        return false;
    // If we find any extra referenced nodes, reject.  (xml-crypto only verifies one digest, so
    //   multiple candidate references is bad news)
    const totalReferencedNodes = exports.xpath.selectElements(currentNode.ownerDocument, "//*[@" + idAttribute + "='" + refId + "']");
    if (totalReferencedNodes.length > 1) {
        return false;
    }
    fullXml = normalizeNewlines(fullXml);
    return sig.checkSignature(fullXml);
};
exports.validateXmlSignatureForCert = validateXmlSignatureForCert;
const signXml = (xml, xpath, location, options) => {
    var _a;
    const defaultTransforms = [
        "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
        "http://www.w3.org/2001/10/xml-exc-c14n#",
    ];
    if (!xml)
        throw new Error("samlMessage is required");
    if (!location)
        throw new Error("location is required");
    if (!options)
        throw new Error("options is required");
    if (!(0, types_1.isValidSamlSigningOptions)(options))
        throw new Error("options.privateKey is required");
    const transforms = (_a = options.xmlSignatureTransforms) !== null && _a !== void 0 ? _a : defaultTransforms;
    const sig = new xmlCrypto.SignedXml();
    if (options.signatureAlgorithm != null) {
        sig.signatureAlgorithm = algorithms.getSigningAlgorithm(options.signatureAlgorithm);
    }
    sig.addReference(xpath, transforms, algorithms.getDigestAlgorithm(options.digestAlgorithm));
    sig.signingKey = options.privateKey;
    sig.computeSignature(xml, {
        location,
    });
    return sig.getSignedXml();
};
exports.signXml = signXml;
const parseDomFromString = (xml) => {
    return new Promise(function (resolve, reject) {
        function errHandler(msg) {
            return reject(new Error(msg));
        }
        const dom = new xmldom.DOMParser({
            /**
             * locator is always need for error position info
             */
            locator: {},
            /**
             * you can override the errorHandler for xml parser
             * @link http://www.saxproject.org/apidoc/org/xml/sax/ErrorHandler.html
             */
            errorHandler: {
                error: errHandler,
                fatalError: errHandler,
            },
        }).parseFromString(xml, "text/xml");
        if (!Object.prototype.hasOwnProperty.call(dom, "documentElement")) {
            return reject(new Error("Not a valid XML document"));
        }
        return resolve(dom);
    });
};
exports.parseDomFromString = parseDomFromString;
const parseXml2JsFromString = async (xml) => {
    const parserConfig = {
        explicitRoot: true,
        explicitCharkey: true,
        tagNameProcessors: [xml2js.processors.stripPrefix],
    };
    const parser = new xml2js.Parser(parserConfig);
    return parser.parseStringPromise(xml);
};
exports.parseXml2JsFromString = parseXml2JsFromString;
const buildXml2JsObject = (rootName, xml) => {
    const builderOpts = {
        rootName,
        headless: true,
    };
    return new xml2js.Builder(builderOpts).buildObject(xml);
};
exports.buildXml2JsObject = buildXml2JsObject;
const buildXmlBuilderObject = (xml, pretty) => {
    const options = pretty ? { pretty: true, indent: "  ", newline: "\n" } : {};
    return xmlbuilder.create(xml).end(options);
};
exports.buildXmlBuilderObject = buildXmlBuilderObject;
const promiseWithNameId = async (nameid) => {
    const format = exports.xpath.selectAttributes(nameid, "@Format");
    return {
        value: nameid.textContent,
        format: format && format[0] && format[0].nodeValue,
    };
};
exports.promiseWithNameId = promiseWithNameId;
const getNameIdAsync = async (doc, decryptionPvk) => {
    const nameIds = exports.xpath.selectElements(doc, "/*[local-name()='LogoutRequest']/*[local-name()='NameID']");
    const encryptedIds = exports.xpath.selectElements(doc, "/*[local-name()='LogoutRequest']/*[local-name()='EncryptedID']");
    if (nameIds.length + encryptedIds.length > 1) {
        throw new Error("Invalid LogoutRequest");
    }
    if (nameIds.length === 1) {
        return (0, exports.promiseWithNameId)(nameIds[0]);
    }
    if (encryptedIds.length === 1) {
        (0, utility_1.assertRequired)(decryptionPvk, "No decryption key found getting name ID for encrypted SAML response");
        const encryptedDatas = exports.xpath.selectElements(encryptedIds[0], "./*[local-name()='EncryptedData']");
        if (encryptedDatas.length !== 1) {
            throw new Error("Invalid LogoutRequest");
        }
        const encryptedDataXml = encryptedDatas[0].toString();
        const decryptedXml = await (0, exports.decryptXml)(encryptedDataXml, decryptionPvk);
        const decryptedDoc = await (0, exports.parseDomFromString)(decryptedXml);
        const decryptedIds = exports.xpath.selectElements(decryptedDoc, "/*[local-name()='NameID']");
        if (decryptedIds.length !== 1) {
            throw new Error("Invalid EncryptedAssertion content");
        }
        return await (0, exports.promiseWithNameId)(decryptedIds[0]);
    }
    throw new Error("Missing SAML NameID");
};
exports.getNameIdAsync = getNameIdAsync;
//# sourceMappingURL=xml.js.map