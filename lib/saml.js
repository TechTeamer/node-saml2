"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SAML = void 0;
const debug_1 = require("debug");
const debug = (0, debug_1.default)("node-saml");
const zlib = require("zlib");
const crypto = require("crypto");
const url_1 = require("url");
const querystring = require("querystring");
const util = require("util");
const inmemory_cache_provider_1 = require("./inmemory-cache-provider");
const algorithms = require("./algorithms");
const types_1 = require("./types");
const utility_1 = require("./utility");
const xml_1 = require("./xml");
const crypto_1 = require("./crypto");
const datetime_1 = require("./datetime");
const saml_post_signing_1 = require("./saml-post-signing");
const metadata_1 = require("./metadata");
const inflateRawAsync = util.promisify(zlib.inflateRaw);
const deflateRawAsync = util.promisify(zlib.deflateRaw);
class SAML {
    constructor(ctorOptions) {
        this.options = this.initialize(ctorOptions);
        this.cacheProvider = this.options.cacheProvider;
    }
    initialize(ctorOptions) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3;
        if (!ctorOptions) {
            throw new TypeError("SamlOptions required on construction");
        }
        (0, utility_1.assertRequired)(ctorOptions.issuer, "issuer is required");
        (0, utility_1.assertRequired)(ctorOptions.cert, "cert is required");
        // Prevent a JS user from passing in "false", which is truthy, and doing the wrong thing
        (0, utility_1.assertBooleanIfPresent)(ctorOptions.passive);
        (0, utility_1.assertBooleanIfPresent)(ctorOptions.disableRequestedAuthnContext);
        (0, utility_1.assertBooleanIfPresent)(ctorOptions.forceAuthn);
        (0, utility_1.assertBooleanIfPresent)(ctorOptions.skipRequestCompression);
        (0, utility_1.assertBooleanIfPresent)(ctorOptions.disableRequestAcsUrl);
        (0, utility_1.assertBooleanIfPresent)(ctorOptions.allowCreate);
        (0, utility_1.assertBooleanIfPresent)(ctorOptions.wantAssertionsSigned);
        (0, utility_1.assertBooleanIfPresent)(ctorOptions.wantAuthnResponseSigned);
        (0, utility_1.assertBooleanIfPresent)(ctorOptions.signMetadata);
        const options = {
            ...ctorOptions,
            passive: (_a = ctorOptions.passive) !== null && _a !== void 0 ? _a : false,
            disableRequestedAuthnContext: (_b = ctorOptions.disableRequestedAuthnContext) !== null && _b !== void 0 ? _b : false,
            additionalParams: (_c = ctorOptions.additionalParams) !== null && _c !== void 0 ? _c : {},
            additionalAuthorizeParams: (_d = ctorOptions.additionalAuthorizeParams) !== null && _d !== void 0 ? _d : {},
            additionalLogoutParams: (_e = ctorOptions.additionalLogoutParams) !== null && _e !== void 0 ? _e : {},
            forceAuthn: (_f = ctorOptions.forceAuthn) !== null && _f !== void 0 ? _f : false,
            skipRequestCompression: (_g = ctorOptions.skipRequestCompression) !== null && _g !== void 0 ? _g : false,
            disableRequestAcsUrl: (_h = ctorOptions.disableRequestAcsUrl) !== null && _h !== void 0 ? _h : false,
            acceptedClockSkewMs: (_j = ctorOptions.acceptedClockSkewMs) !== null && _j !== void 0 ? _j : 0,
            maxAssertionAgeMs: (_k = ctorOptions.maxAssertionAgeMs) !== null && _k !== void 0 ? _k : 0,
            path: (_l = ctorOptions.path) !== null && _l !== void 0 ? _l : "/saml/consume",
            host: (_m = ctorOptions.host) !== null && _m !== void 0 ? _m : "localhost",
            issuer: ctorOptions.issuer,
            audience: (_p = (_o = ctorOptions.audience) !== null && _o !== void 0 ? _o : ctorOptions.issuer) !== null && _p !== void 0 ? _p : "unknown_audience",
            identifierFormat: ctorOptions.identifierFormat === undefined
                ? "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
                : ctorOptions.identifierFormat,
            allowCreate: (_q = ctorOptions.allowCreate) !== null && _q !== void 0 ? _q : true,
            spNameQualifier: ctorOptions.spNameQualifier,
            wantAssertionsSigned: (_r = ctorOptions.wantAssertionsSigned) !== null && _r !== void 0 ? _r : true,
            wantAuthnResponseSigned: (_s = ctorOptions.wantAuthnResponseSigned) !== null && _s !== void 0 ? _s : true,
            authnContext: (_t = ctorOptions.authnContext) !== null && _t !== void 0 ? _t : [
                "urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport",
            ],
            validateInResponseTo: (_u = ctorOptions.validateInResponseTo) !== null && _u !== void 0 ? _u : types_1.ValidateInResponseTo.never,
            cert: ctorOptions.cert,
            requestIdExpirationPeriodMs: (_v = ctorOptions.requestIdExpirationPeriodMs) !== null && _v !== void 0 ? _v : 28800000,
            cacheProvider: (_w = ctorOptions.cacheProvider) !== null && _w !== void 0 ? _w : new inmemory_cache_provider_1.InMemoryCacheProvider({
                keyExpirationPeriodMs: ctorOptions.requestIdExpirationPeriodMs,
            }),
            logoutUrl: (_y = (_x = ctorOptions.logoutUrl) !== null && _x !== void 0 ? _x : ctorOptions.entryPoint) !== null && _y !== void 0 ? _y : "",
            signatureAlgorithm: (_z = ctorOptions.signatureAlgorithm) !== null && _z !== void 0 ? _z : "sha1",
            authnRequestBinding: (_0 = ctorOptions.authnRequestBinding) !== null && _0 !== void 0 ? _0 : "HTTP-Redirect",
            generateUniqueId: (_1 = ctorOptions.generateUniqueId) !== null && _1 !== void 0 ? _1 : crypto_1.generateUniqueId,
            signMetadata: (_2 = ctorOptions.signMetadata) !== null && _2 !== void 0 ? _2 : false,
            racComparison: (_3 = ctorOptions.racComparison) !== null && _3 !== void 0 ? _3 : "exact",
        };
        /**
         * List of possible values:
         * - exact : Assertion context must exactly match a context in the list
         * - minimum:  Assertion context must be at least as strong as a context in the list
         * - maximum:  Assertion context must be no stronger than a context in the list
         * - better:  Assertion context must be stronger than all contexts in the list
         */
        if (!["exact", "minimum", "maximum", "better"].includes(options.racComparison)) {
            throw new TypeError("racComparison must be one of ['exact', 'minimum', 'maximum', 'better']");
        }
        return options;
    }
    getCallbackUrl(host) {
        // Post-auth destination
        if (this.options.callbackUrl) {
            return this.options.callbackUrl;
        }
        else {
            const url = new url_1.URL("http://localhost");
            if (host) {
                url.host = host;
            }
            else {
                url.host = this.options.host;
            }
            if (this.options.protocol) {
                url.protocol = this.options.protocol;
            }
            url.pathname = this.options.path;
            return url.toString();
        }
    }
    signRequest(samlMessage) {
        (0, utility_1.assertRequired)(this.options.privateKey, "privateKey is required");
        const samlMessageToSign = {};
        samlMessage.SigAlg = algorithms.getSigningAlgorithm(this.options.signatureAlgorithm);
        const signer = algorithms.getSigner(this.options.signatureAlgorithm);
        if (samlMessage.SAMLRequest) {
            samlMessageToSign.SAMLRequest = samlMessage.SAMLRequest;
        }
        if (samlMessage.SAMLResponse) {
            samlMessageToSign.SAMLResponse = samlMessage.SAMLResponse;
        }
        if (samlMessage.RelayState) {
            samlMessageToSign.RelayState = samlMessage.RelayState;
        }
        if (samlMessage.SigAlg) {
            samlMessageToSign.SigAlg = samlMessage.SigAlg;
        }
        signer.update(querystring.stringify(samlMessageToSign));
        samlMessage.Signature = signer.sign((0, crypto_1.keyToPEM)(this.options.privateKey), "base64");
    }
    async generateAuthorizeRequestAsync(isPassive, isHttpPostBinding, host) {
        (0, utility_1.assertRequired)(this.options.entryPoint, "entryPoint is required");
        const id = this.options.generateUniqueId();
        const instant = (0, datetime_1.generateInstant)();
        if (this.mustValidateInResponseTo(true)) {
            await this.cacheProvider.saveAsync(id, instant);
        }
        const request = {
            "samlp:AuthnRequest": {
                "@xmlns:samlp": "urn:oasis:names:tc:SAML:2.0:protocol",
                "@ID": id,
                "@Version": "2.0",
                "@IssueInstant": instant,
                "@ProtocolBinding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST",
                "@Destination": this.options.entryPoint,
                "saml:Issuer": {
                    "@xmlns:saml": "urn:oasis:names:tc:SAML:2.0:assertion",
                    "#text": this.options.issuer,
                },
            },
        };
        if (isPassive)
            request["samlp:AuthnRequest"]["@IsPassive"] = true;
        if (this.options.forceAuthn === true) {
            request["samlp:AuthnRequest"]["@ForceAuthn"] = true;
        }
        if (!this.options.disableRequestAcsUrl) {
            request["samlp:AuthnRequest"]["@AssertionConsumerServiceURL"] = this.getCallbackUrl(host);
        }
        const samlAuthnRequestExtensions = this.options.samlAuthnRequestExtensions;
        if (samlAuthnRequestExtensions != null) {
            if (typeof samlAuthnRequestExtensions != "object") {
                throw new TypeError("samlAuthnRequestExtensions should be Object");
            }
            request["samlp:AuthnRequest"]["samlp:Extensions"] = {
                "@xmlns:samlp": "urn:oasis:names:tc:SAML:2.0:protocol",
                ...samlAuthnRequestExtensions,
            };
        }
        const nameIDPolicy = {
            "@xmlns:samlp": "urn:oasis:names:tc:SAML:2.0:protocol",
            "@AllowCreate": this.options.allowCreate,
        };
        if (this.options.identifierFormat != null) {
            nameIDPolicy["@Format"] = this.options.identifierFormat;
        }
        if (this.options.spNameQualifier != null) {
            nameIDPolicy["@SPNameQualifier"] = this.options.spNameQualifier;
        }
        request["samlp:AuthnRequest"]["samlp:NameIDPolicy"] = nameIDPolicy;
        if (!this.options.disableRequestedAuthnContext) {
            const authnContextClassRefs = [];
            this.options.authnContext.forEach(function (value) {
                authnContextClassRefs.push({
                    "@xmlns:saml": "urn:oasis:names:tc:SAML:2.0:assertion",
                    "#text": value,
                });
            });
            request["samlp:AuthnRequest"]["samlp:RequestedAuthnContext"] = {
                "@xmlns:samlp": "urn:oasis:names:tc:SAML:2.0:protocol",
                "@Comparison": this.options.racComparison,
                "saml:AuthnContextClassRef": authnContextClassRefs,
            };
        }
        if (this.options.attributeConsumingServiceIndex != null) {
            request["samlp:AuthnRequest"]["@AttributeConsumingServiceIndex"] =
                this.options.attributeConsumingServiceIndex;
        }
        if (this.options.providerName != null) {
            request["samlp:AuthnRequest"]["@ProviderName"] = this.options.providerName;
        }
        if (this.options.scoping != null) {
            const scoping = {
                "@xmlns:samlp": "urn:oasis:names:tc:SAML:2.0:protocol",
            };
            if (typeof this.options.scoping.proxyCount === "number") {
                scoping["@ProxyCount"] = this.options.scoping.proxyCount;
            }
            if (this.options.scoping.idpList) {
                scoping["samlp:IDPList"] = this.options.scoping.idpList.map((idpListItem) => {
                    const formattedIdpListItem = {
                        "@xmlns:samlp": "urn:oasis:names:tc:SAML:2.0:protocol",
                    };
                    if (idpListItem.entries) {
                        formattedIdpListItem["samlp:IDPEntry"] = idpListItem.entries.map((entry) => {
                            const formattedEntry = {
                                "@xmlns:samlp": "urn:oasis:names:tc:SAML:2.0:protocol",
                            };
                            formattedEntry["@ProviderID"] = entry.providerId;
                            if (entry.name) {
                                formattedEntry["@Name"] = entry.name;
                            }
                            if (entry.loc) {
                                formattedEntry["@Loc"] = entry.loc;
                            }
                            return formattedEntry;
                        });
                    }
                    if (idpListItem.getComplete) {
                        formattedIdpListItem["samlp:GetComplete"] = idpListItem.getComplete;
                    }
                    return formattedIdpListItem;
                });
            }
            if (this.options.scoping.requesterId) {
                scoping["samlp:RequesterID"] = this.options.scoping.requesterId;
            }
            request["samlp:AuthnRequest"]["samlp:Scoping"] = scoping;
        }
        let stringRequest = (0, xml_1.buildXmlBuilderObject)(request, false);
        // TODO: maybe we should always sign here
        if (isHttpPostBinding && (0, types_1.isValidSamlSigningOptions)(this.options)) {
            stringRequest = (0, saml_post_signing_1.signAuthnRequestPost)(stringRequest, this.options);
        }
        return stringRequest;
    }
    async _generateLogoutRequest(user) {
        const id = this.options.generateUniqueId();
        const instant = (0, datetime_1.generateInstant)();
        const request = {
            "samlp:LogoutRequest": {
                "@xmlns:samlp": "urn:oasis:names:tc:SAML:2.0:protocol",
                "@xmlns:saml": "urn:oasis:names:tc:SAML:2.0:assertion",
                "@ID": id,
                "@Version": "2.0",
                "@IssueInstant": instant,
                "@Destination": this.options.logoutUrl,
                "saml:Issuer": {
                    "@xmlns:saml": "urn:oasis:names:tc:SAML:2.0:assertion",
                    "#text": this.options.issuer,
                },
                "samlp:Extensions": {},
                "saml:NameID": {
                    "@Format": user.nameIDFormat,
                    "#text": user.nameID,
                },
            },
        };
        const samlLogoutRequestExtensions = this.options.samlLogoutRequestExtensions;
        if (samlLogoutRequestExtensions != null) {
            if (typeof samlLogoutRequestExtensions != "object") {
                throw new TypeError("samlLogoutRequestExtensions should be Object");
            }
            request["samlp:LogoutRequest"]["samlp:Extensions"] = {
                "@xmlns:samlp": "urn:oasis:names:tc:SAML:2.0:protocol",
                ...samlLogoutRequestExtensions,
            };
        }
        else {
            delete request["samlp:LogoutRequest"]["samlp:Extensions"];
        }
        if (user.nameQualifier != null) {
            request["samlp:LogoutRequest"]["saml:NameID"]["@NameQualifier"] = user.nameQualifier;
        }
        if (user.spNameQualifier != null) {
            request["samlp:LogoutRequest"]["saml:NameID"]["@SPNameQualifier"] = user.spNameQualifier;
        }
        if (user.sessionIndex) {
            request["samlp:LogoutRequest"]["saml2p:SessionIndex"] = {
                "@xmlns:saml2p": "urn:oasis:names:tc:SAML:2.0:protocol",
                "#text": user.sessionIndex,
            };
        }
        await this.cacheProvider.saveAsync(id, instant);
        return (0, xml_1.buildXmlBuilderObject)(request, false);
    }
    _generateLogoutResponse(logoutRequest, success) {
        const id = this.options.generateUniqueId();
        const instant = (0, datetime_1.generateInstant)();
        const successStatus = {
            "samlp:StatusCode": {
                "@Value": "urn:oasis:names:tc:SAML:2.0:status:Success",
            },
        };
        const failStatus = {
            "samlp:StatusCode": {
                "@Value": "urn:oasis:names:tc:SAML:2.0:status:Requester",
                "samlp:StatusCode": {
                    "@Value": "urn:oasis:names:tc:SAML:2.0:status:UnknownPrincipal",
                },
            },
        };
        const request = {
            "samlp:LogoutResponse": {
                "@xmlns:samlp": "urn:oasis:names:tc:SAML:2.0:protocol",
                "@xmlns:saml": "urn:oasis:names:tc:SAML:2.0:assertion",
                "@ID": id,
                "@Version": "2.0",
                "@IssueInstant": instant,
                "@Destination": this.options.logoutUrl,
                "@InResponseTo": logoutRequest.ID,
                "saml:Issuer": {
                    "#text": this.options.issuer,
                },
                "samlp:Status": success ? successStatus : failStatus,
            },
        };
        return (0, xml_1.buildXmlBuilderObject)(request, false);
    }
    async _requestToUrlAsync(request, response, operation, additionalParameters) {
        (0, utility_1.assertRequired)(this.options.entryPoint, "entryPoint is required");
        const requestOrResponse = request || response;
        (0, utility_1.assertRequired)(requestOrResponse, "either request or response is required");
        let buffer;
        if (this.options.skipRequestCompression) {
            buffer = Buffer.from(requestOrResponse, "utf8");
        }
        else {
            buffer = await deflateRawAsync(requestOrResponse);
        }
        const base64 = buffer.toString("base64");
        let target = new url_1.URL(this.options.entryPoint);
        if (operation === "logout") {
            if (this.options.logoutUrl) {
                target = new url_1.URL(this.options.logoutUrl);
            }
        }
        else if (operation !== "authorize") {
            throw new Error("Unknown operation: " + operation);
        }
        const samlMessage = request
            ? {
                SAMLRequest: base64,
            }
            : {
                SAMLResponse: base64,
            };
        Object.keys(additionalParameters).forEach((k) => {
            samlMessage[k] = additionalParameters[k];
        });
        if ((0, types_1.isValidSamlSigningOptions)(this.options)) {
            if (!this.options.entryPoint) {
                throw new Error('"entryPoint" config parameter is required for signed messages');
            }
            // sets .SigAlg and .Signature
            this.signRequest(samlMessage);
        }
        Object.keys(samlMessage).forEach((k) => {
            target.searchParams.set(k, samlMessage[k]);
        });
        return target.toString();
    }
    _getAdditionalParams(relayState, operation, overrideParams) {
        const additionalParams = {};
        if (typeof relayState === "string" && relayState.length > 0) {
            additionalParams.RelayState = relayState;
        }
        return Object.assign(additionalParams, this.options.additionalParams, operation === "logout"
            ? this.options.additionalLogoutParams
            : this.options.additionalAuthorizeParams, overrideParams !== null && overrideParams !== void 0 ? overrideParams : {});
    }
    async getAuthorizeUrlAsync(RelayState, host, options) {
        const request = await this.generateAuthorizeRequestAsync(this.options.passive, false, host);
        const operation = "authorize";
        const overrideParams = options ? options.additionalParams || {} : {};
        return await this._requestToUrlAsync(request, null, operation, this._getAdditionalParams(RelayState, operation, overrideParams));
    }
    async getAuthorizeFormAsync(RelayState, host) {
        (0, utility_1.assertRequired)(this.options.entryPoint, "entryPoint is required");
        // The quoteattr() function is used in a context, where the result will not be evaluated by javascript
        // but must be interpreted by an XML or HTML parser, and it must absolutely avoid breaking the syntax
        // of an element attribute.
        const quoteattr = function (s, preserveCR) {
            const preserveCRChar = preserveCR ? "&#13;" : "\n";
            return (("" + s) // Forces the conversion to string.
                .replace(/&/g, "&amp;") // This MUST be the 1st replacement.
                .replace(/'/g, "&apos;") // The 4 other predefined entities, required.
                .replace(/"/g, "&quot;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                // Add other replacements here for HTML only
                // Or for XML, only if the named entities are defined in its DTD.
                .replace(/\r\n/g, preserveCRChar) // Must be before the next replacement.
                .replace(/[\r\n]/g, preserveCRChar));
        };
        const request = await this.generateAuthorizeRequestAsync(this.options.passive, true, host);
        let buffer;
        if (this.options.skipRequestCompression) {
            buffer = Buffer.from(request, "utf8");
        }
        else {
            buffer = await deflateRawAsync(request);
        }
        const operation = "authorize";
        const additionalParameters = this._getAdditionalParams(RelayState, operation);
        const samlMessage = {
            SAMLRequest: buffer.toString("base64"),
        };
        Object.keys(additionalParameters).forEach((k) => {
            samlMessage[k] = additionalParameters[k] || "";
        });
        const formInputs = Object.keys(samlMessage)
            .map((k) => {
            return '<input type="hidden" name="' + k + '" value="' + quoteattr(samlMessage[k]) + '" />';
        })
            .join("\r\n");
        return [
            "<!DOCTYPE html>",
            "<html>",
            "<head>",
            '<meta charset="utf-8">',
            '<meta http-equiv="x-ua-compatible" content="ie=edge">',
            "</head>",
            '<body onload="document.forms[0].submit()">',
            "<noscript>",
            "<p><strong>Note:</strong> Since your browser does not support JavaScript, you must press the button below once to proceed.</p>",
            "</noscript>",
            '<form method="post" action="' + encodeURI(this.options.entryPoint) + '">',
            formInputs,
            '<input type="submit" value="Submit" />',
            "</form>",
            '<script>document.forms[0].style.display="none";</script>',
            "</body>",
            "</html>",
        ].join("\r\n");
    }
    async getLogoutUrlAsync(user, RelayState, options) {
        const request = await this._generateLogoutRequest(user);
        const operation = "logout";
        const overrideParams = options ? options.additionalParams || {} : {};
        return await this._requestToUrlAsync(request, null, operation, this._getAdditionalParams(RelayState, operation, overrideParams));
    }
    getLogoutResponseUrl(samlLogoutRequest, RelayState, options, success, callback) {
        util.callbackify(() => this.getLogoutResponseUrlAsync(samlLogoutRequest, RelayState, options, success))(callback);
    }
    async getLogoutResponseUrlAsync(samlLogoutRequest, RelayState, options, success) {
        const response = this._generateLogoutResponse(samlLogoutRequest, success);
        const operation = "logout";
        const overrideParams = options ? options.additionalParams || {} : {};
        return await this._requestToUrlAsync(null, response, operation, this._getAdditionalParams(RelayState, operation, overrideParams));
    }
    async certsToCheck() {
        let checkedCerts;
        if (typeof this.options.cert === "function") {
            checkedCerts = await util
                .promisify(this.options.cert)()
                .then((certs) => {
                (0, utility_1.assertRequired)(certs, "callback didn't return cert");
                if (!Array.isArray(certs)) {
                    certs = [certs];
                }
                return certs;
            });
        }
        else if (Array.isArray(this.options.cert)) {
            checkedCerts = this.options.cert;
        }
        else {
            checkedCerts = [this.options.cert];
        }
        checkedCerts.forEach((cert) => {
            (0, utility_1.assertRequired)(cert, "unknown cert found");
        });
        return checkedCerts;
    }
    async validatePostResponseAsync(container) {
        var _a, _b, _c, _d;
        let xml;
        let doc;
        let inResponseTo = null;
        try {
            xml = Buffer.from(container.SAMLResponse, "base64").toString("utf8");
            doc = await (0, xml_1.parseDomFromString)(xml);
            const inResponseToNodes = xml_1.xpath.selectAttributes(doc, "/*[local-name()='Response']/@InResponseTo");
            if (inResponseToNodes) {
                inResponseTo = inResponseToNodes.length ? inResponseToNodes[0].nodeValue : null;
                await this.validateInResponseTo(inResponseTo);
            }
            const certs = await this.certsToCheck();
            // Check if this document has a valid top-level signature which applies to the entire XML document
            let validSignature = false;
            if ((0, xml_1.validateSignature)(xml, doc.documentElement, certs)) {
                validSignature = true;
            }
            if (this.options.wantAuthnResponseSigned === true && validSignature === false) {
                throw new Error("Invalid document signature");
            }
            const assertions = xml_1.xpath.selectElements(doc, "/*[local-name()='Response']/*[local-name()='Assertion']");
            const encryptedAssertions = xml_1.xpath.selectElements(doc, "/*[local-name()='Response']/*[local-name()='EncryptedAssertion']");
            if (assertions.length + encryptedAssertions.length > 1) {
                // There's no reason I know of that we want to handle multiple assertions, and it seems like a
                //   potential risk vector for signature scope issues, so treat this as an invalid signature
                throw new Error("Invalid signature: multiple assertions");
            }
            if (assertions.length == 1) {
                if ((this.options.wantAssertionsSigned || !validSignature) &&
                    !(0, xml_1.validateSignature)(xml, assertions[0], certs)) {
                    throw new Error("Invalid signature");
                }
                return await this.processValidlySignedAssertionAsync(assertions[0].toString(), xml, inResponseTo);
            }
            if (encryptedAssertions.length == 1) {
                (0, utility_1.assertRequired)(this.options.decryptionPvk, "No decryption key for encrypted SAML response");
                const encryptedAssertionXml = encryptedAssertions[0].toString();
                const decryptedXml = await (0, xml_1.decryptXml)(encryptedAssertionXml, this.options.decryptionPvk);
                const decryptedDoc = await (0, xml_1.parseDomFromString)(decryptedXml);
                const decryptedAssertions = xml_1.xpath.selectElements(decryptedDoc, "/*[local-name()='Assertion']");
                if (decryptedAssertions.length != 1)
                    throw new Error("Invalid EncryptedAssertion content");
                if ((this.options.wantAssertionsSigned || !validSignature) &&
                    !(0, xml_1.validateSignature)(decryptedXml, decryptedAssertions[0], certs)) {
                    throw new Error("Invalid signature from encrypted assertion");
                }
                return await this.processValidlySignedAssertionAsync(decryptedAssertions[0].toString(), xml, inResponseTo);
            }
            // If there's no assertion, fall back on xml2js response parsing for the status &
            //   LogoutResponse code.
            const xmljsDoc = (await (0, xml_1.parseXml2JsFromString)(xml));
            const response = xmljsDoc.Response;
            if (response) {
                if (!("Assertion" in response)) {
                    const status = response.Status;
                    if (status) {
                        const statusCode = status[0].StatusCode;
                        if (statusCode &&
                            ((_a = statusCode[0].$) === null || _a === void 0 ? void 0 : _a.Value) === "urn:oasis:names:tc:SAML:2.0:status:Responder") {
                            const nestedStatusCode = statusCode[0].StatusCode;
                            if (nestedStatusCode &&
                                ((_b = nestedStatusCode[0].$) === null || _b === void 0 ? void 0 : _b.Value) === "urn:oasis:names:tc:SAML:2.0:status:NoPassive") {
                                if (!validSignature) {
                                    throw new Error("Invalid signature: NoPassive");
                                }
                                return { profile: null, loggedOut: false };
                            }
                        }
                        // Note that we're not requiring a valid signature before this logic -- since we are
                        //   throwing an error in any case, and some providers don't sign error results,
                        //   let's go ahead and give the potentially more helpful error.
                        if (statusCode && ((_c = statusCode[0].$) === null || _c === void 0 ? void 0 : _c.Value)) {
                            const msgType = statusCode[0].$.Value.match(/[^:]*$/);
                            if (msgType && msgType[0] != "Success") {
                                let msg = "unspecified";
                                if (status[0].StatusMessage) {
                                    msg = status[0].StatusMessage[0]._ || msg;
                                }
                                else if (statusCode[0].StatusCode) {
                                    const msgValues = (_d = statusCode[0].StatusCode[0].$) === null || _d === void 0 ? void 0 : _d.Value.match(/[^:]*$/);
                                    msg = msgValues ? msgValues[0] : msg;
                                }
                                const statusXml = (0, xml_1.buildXml2JsObject)("Status", status[0]);
                                throw new types_1.ErrorWithXmlStatus("SAML provider returned " + msgType + " error: " + msg, statusXml);
                            }
                        }
                    }
                }
                throw new Error("Missing SAML assertion");
            }
            else {
                if (!validSignature) {
                    throw new Error("Invalid signature: No response found");
                }
                const logoutResponse = xmljsDoc.LogoutResponse;
                if (logoutResponse) {
                    return { profile: null, loggedOut: true };
                }
                else {
                    throw new Error("Unknown SAML response message");
                }
            }
        }
        catch (err) {
            debug("validatePostResponse resulted in an error: %s", err);
            if (this.mustValidateInResponseTo(Boolean(inResponseTo))) {
                await this.cacheProvider.removeAsync(inResponseTo);
            }
            throw err;
        }
    }
    async validateInResponseTo(inResponseTo) {
        if (this.mustValidateInResponseTo(Boolean(inResponseTo))) {
            if (inResponseTo) {
                const result = await this.cacheProvider.getAsync(inResponseTo);
                if (!result)
                    throw new Error("InResponseTo is not valid");
                return;
            }
            else {
                throw new Error("InResponseTo is missing from response");
            }
        }
    }
    async validateRedirectAsync(container, originalQuery) {
        const samlMessageType = container.SAMLRequest ? "SAMLRequest" : "SAMLResponse";
        const data = Buffer.from(container[samlMessageType], "base64");
        const inflated = await inflateRawAsync(data);
        const dom = await (0, xml_1.parseDomFromString)(inflated.toString());
        const doc = await (0, xml_1.parseXml2JsFromString)(inflated);
        samlMessageType === "SAMLResponse"
            ? await this.verifyLogoutResponse(doc)
            : this.verifyLogoutRequest(doc);
        await this.hasValidSignatureForRedirect(container, originalQuery);
        return await this.processValidlySignedSamlLogoutAsync(doc, dom);
    }
    async hasValidSignatureForRedirect(container, originalQuery) {
        const tokens = originalQuery.split("&");
        const getParam = (key) => {
            const exists = tokens.filter((t) => {
                return new RegExp(key).test(t);
            });
            return exists[0];
        };
        if (container.Signature) {
            let urlString = getParam("SAMLRequest") || getParam("SAMLResponse");
            if (getParam("RelayState")) {
                urlString += "&" + getParam("RelayState");
            }
            urlString += "&" + getParam("SigAlg");
            const certs = await this.certsToCheck();
            const hasValidQuerySignature = certs.some((cert) => {
                return this.validateSignatureForRedirect(urlString, container.Signature, container.SigAlg, cert);
            });
            if (!hasValidQuerySignature) {
                throw new Error("Invalid query signature");
            }
        }
        else {
            return true;
        }
    }
    validateSignatureForRedirect(urlString, signature, alg, cert) {
        // See if we support a matching algorithm, case-insensitive. Otherwise, throw error.
        function hasMatch(ourAlgo) {
            // The incoming algorithm is forwarded as a URL.
            // We trim everything before the last # get something we can compare to the Node.js list
            const algFromURI = alg.toLowerCase().replace(/.*#(.*)$/, "$1");
            return ourAlgo.toLowerCase() === algFromURI;
        }
        const i = crypto.getHashes().findIndex(hasMatch);
        let matchingAlgo;
        if (i > -1) {
            matchingAlgo = crypto.getHashes()[i];
        }
        else {
            throw new Error(alg + " is not supported");
        }
        const verifier = crypto.createVerify(matchingAlgo);
        verifier.update(urlString);
        return verifier.verify((0, crypto_1.certToPEM)(cert), signature, "base64");
    }
    verifyLogoutRequest(doc) {
        this.verifyIssuer(doc.LogoutRequest);
        const nowMs = new Date().getTime();
        const conditions = doc.LogoutRequest.$;
        const conErr = this.checkTimestampsValidityError(nowMs, conditions.NotBefore, conditions.NotOnOrAfter);
        if (conErr) {
            throw conErr;
        }
    }
    async verifyLogoutResponse(doc) {
        const statusCode = doc.LogoutResponse.Status[0].StatusCode[0].$.Value;
        if (statusCode !== "urn:oasis:names:tc:SAML:2.0:status:Success")
            throw new Error("Bad status code: " + statusCode);
        this.verifyIssuer(doc.LogoutResponse);
        const inResponseTo = doc.LogoutResponse.$.InResponseTo;
        if (inResponseTo) {
            return this.validateInResponseTo(inResponseTo);
        }
        return;
    }
    verifyIssuer(samlMessage) {
        if (this.options.idpIssuer != null) {
            const issuer = samlMessage.Issuer;
            if (issuer) {
                if (issuer[0]._ !== this.options.idpIssuer)
                    throw new Error("Unknown SAML issuer. Expected: " + this.options.idpIssuer + " Received: " + issuer[0]._);
            }
            else {
                throw new Error("Missing SAML issuer");
            }
        }
    }
    async processValidlySignedAssertionAsync(xml, samlResponseXml, inResponseTo) {
        let msg;
        const nowMs = new Date().getTime();
        const profile = {};
        const doc = await (0, xml_1.parseXml2JsFromString)(xml);
        const parsedAssertion = doc;
        const assertion = doc.Assertion;
        getInResponseTo: {
            const issuer = assertion.Issuer;
            if (issuer && issuer[0]._) {
                profile.issuer = issuer[0]._;
            }
            if (inResponseTo != null) {
                profile.inResponseTo = inResponseTo;
            }
            const authnStatement = assertion.AuthnStatement;
            if (authnStatement) {
                if (authnStatement[0].$ && authnStatement[0].$.SessionIndex) {
                    profile.sessionIndex = authnStatement[0].$.SessionIndex;
                }
            }
            const subject = assertion.Subject;
            let subjectConfirmation;
            let confirmData = null;
            let subjectConfirmations = null;
            if (subject) {
                const nameID = subject[0].NameID;
                if (nameID && nameID[0]._) {
                    profile.nameID = nameID[0]._;
                    if (nameID[0].$ && nameID[0].$.Format) {
                        profile.nameIDFormat = nameID[0].$.Format;
                        profile.nameQualifier = nameID[0].$.NameQualifier;
                        profile.spNameQualifier = nameID[0].$.SPNameQualifier;
                    }
                }
                subjectConfirmations = subject[0].SubjectConfirmation;
                subjectConfirmation = subjectConfirmations === null || subjectConfirmations === void 0 ? void 0 : subjectConfirmations.find((_subjectConfirmation) => {
                    var _a;
                    const _confirmData = (_a = _subjectConfirmation.SubjectConfirmationData) === null || _a === void 0 ? void 0 : _a[0];
                    if (_confirmData === null || _confirmData === void 0 ? void 0 : _confirmData.$) {
                        const subjectNotBefore = _confirmData.$.NotBefore;
                        const subjectNotOnOrAfter = _confirmData.$.NotOnOrAfter;
                        const maxTimeLimitMs = this.calcMaxAgeAssertionTime(this.options.maxAssertionAgeMs, subjectNotOnOrAfter, assertion.$.IssueInstant);
                        const subjErr = this.checkTimestampsValidityError(nowMs, subjectNotBefore, subjectNotOnOrAfter, maxTimeLimitMs);
                        if (subjErr === null)
                            return true;
                    }
                    return false;
                });
                if (subjectConfirmation != null) {
                    confirmData = subjectConfirmation.SubjectConfirmationData[0];
                }
            }
            /**
             * Test to see that if we have a SubjectConfirmation InResponseTo that it matches
             * the 'InResponseTo' attribute set in the Response
             */
            if (this.mustValidateInResponseTo(Boolean(inResponseTo))) {
                if (subjectConfirmation) {
                    if (confirmData === null || confirmData === void 0 ? void 0 : confirmData.$) {
                        const subjectInResponseTo = confirmData.$.InResponseTo;
                        if (inResponseTo && subjectInResponseTo && subjectInResponseTo != inResponseTo) {
                            await this.cacheProvider.removeAsync(inResponseTo);
                            throw new Error("InResponseTo does not match subjectInResponseTo");
                        }
                        else if (subjectInResponseTo) {
                            let foundValidInResponseTo = false;
                            const result = await this.cacheProvider.getAsync(subjectInResponseTo);
                            if (result) {
                                const createdAt = new Date(result);
                                if (nowMs < createdAt.getTime() + this.options.requestIdExpirationPeriodMs)
                                    foundValidInResponseTo = true;
                            }
                            await this.cacheProvider.removeAsync(inResponseTo);
                            if (!foundValidInResponseTo) {
                                throw new Error("SubjectInResponseTo is not valid");
                            }
                            break getInResponseTo;
                        }
                    }
                }
                else {
                    if (subjectConfirmations != null && subjectConfirmation == null) {
                        msg = "No valid subject confirmation found among those available in the SAML assertion";
                        throw new Error(msg);
                    }
                    else {
                        await this.cacheProvider.removeAsync(inResponseTo);
                        break getInResponseTo;
                    }
                }
            }
            else {
                break getInResponseTo;
            }
        }
        const conditions = assertion.Conditions ? assertion.Conditions[0] : null;
        if (assertion.Conditions && assertion.Conditions.length > 1) {
            msg = "Unable to process multiple conditions in SAML assertion";
            throw new Error(msg);
        }
        if (conditions && conditions.$) {
            const maxTimeLimitMs = this.calcMaxAgeAssertionTime(this.options.maxAssertionAgeMs, conditions.$.NotOnOrAfter, assertion.$.IssueInstant);
            const conErr = this.checkTimestampsValidityError(nowMs, conditions.$.NotBefore, conditions.$.NotOnOrAfter, maxTimeLimitMs);
            if (conErr)
                throw conErr;
        }
        if (this.options.audience !== false) {
            const audienceErr = this.checkAudienceValidityError(this.options.audience, conditions.AudienceRestriction);
            if (audienceErr)
                throw audienceErr;
        }
        const attributeStatement = assertion.AttributeStatement;
        if (attributeStatement) {
            const attributes = [].concat(...attributeStatement
                .filter((attr) => Array.isArray(attr.Attribute))
                .map((attr) => attr.Attribute));
            const attrValueMapper = (value) => {
                const hasChildren = Object.keys(value).some((cur) => {
                    return cur !== "_" && cur !== "$";
                });
                return hasChildren ? value : value._;
            };
            if (attributes.length > 0) {
                const profileAttributes = {};
                attributes.forEach((attribute) => {
                    if (!Object.prototype.hasOwnProperty.call(attribute, "AttributeValue")) {
                        // if attributes has no AttributeValue child, continue
                        return;
                    }
                    const name = attribute.$.Name;
                    const value = attribute.AttributeValue.length === 1
                        ? attrValueMapper(attribute.AttributeValue[0])
                        : attribute.AttributeValue.map(attrValueMapper);
                    profileAttributes[name] = value;
                    /**
                     * If any property is already present in profile and is also present
                     * in attributes, then skip the one from attributes. Handle this
                     * conflict gracefully without returning any error
                     */
                    if (Object.prototype.hasOwnProperty.call(profile, name)) {
                        return;
                    }
                    profile[name] = value;
                });
                profile.attributes = profileAttributes;
            }
        }
        if (!profile.mail && profile["urn:oid:0.9.2342.19200300.100.1.3"]) {
            /**
             * See https://spaces.internet2.edu/display/InCFederation/Supported+Attribute+Summary
             * for definition of attribute OIDs
             */
            profile.mail = profile["urn:oid:0.9.2342.19200300.100.1.3"];
        }
        if (!profile.email && profile.mail) {
            profile.email = profile.mail;
        }
        profile.getAssertionXml = () => xml.toString();
        profile.getAssertion = () => parsedAssertion;
        profile.getSamlResponseXml = () => samlResponseXml;
        return { profile, loggedOut: false };
    }
    checkTimestampsValidityError(nowMs, notBefore, notOnOrAfter, maxTimeLimitMs) {
        if (this.options.acceptedClockSkewMs == -1)
            return null;
        if (notBefore) {
            const notBeforeMs = (0, datetime_1.dateStringToTimestamp)(notBefore, "NotBefore");
            if (nowMs + this.options.acceptedClockSkewMs < notBeforeMs)
                return new Error("SAML assertion not yet valid");
        }
        if (notOnOrAfter) {
            const notOnOrAfterMs = (0, datetime_1.dateStringToTimestamp)(notOnOrAfter, "NotOnOrAfter");
            if (nowMs - this.options.acceptedClockSkewMs >= notOnOrAfterMs)
                return new Error("SAML assertion expired: clocks skewed too much");
        }
        if (maxTimeLimitMs) {
            if (nowMs - this.options.acceptedClockSkewMs >= maxTimeLimitMs)
                return new Error("SAML assertion expired: assertion too old");
        }
        return null;
    }
    checkAudienceValidityError(expectedAudience, audienceRestrictions) {
        if (!audienceRestrictions || audienceRestrictions.length < 1) {
            return new Error("SAML assertion has no AudienceRestriction");
        }
        const errors = audienceRestrictions
            .map((restriction) => {
            if (!restriction.Audience || !restriction.Audience[0] || !restriction.Audience[0]._) {
                return new Error("SAML assertion AudienceRestriction has no Audience value");
            }
            if (restriction.Audience[0]._ !== expectedAudience) {
                return new Error("SAML assertion audience mismatch");
            }
            return null;
        })
            .filter((result) => {
            return result !== null;
        });
        if (errors.length > 0) {
            return errors[0];
        }
        return null;
    }
    async validatePostRequestAsync(container) {
        const xml = Buffer.from(container.SAMLRequest, "base64").toString("utf8");
        const dom = await (0, xml_1.parseDomFromString)(xml);
        const doc = await (0, xml_1.parseXml2JsFromString)(xml);
        const certs = await this.certsToCheck();
        if (!(0, xml_1.validateSignature)(xml, dom.documentElement, certs)) {
            throw new Error("Invalid signature on documentElement");
        }
        return await this.processValidlySignedPostRequestAsync(doc, dom);
    }
    async processValidlySignedPostRequestAsync(doc, dom) {
        var _a;
        const request = doc.LogoutRequest;
        if (request) {
            const profile = {};
            if (request.$.ID) {
                profile.ID = request.$.ID;
            }
            else {
                throw new Error("Missing SAML LogoutRequest ID");
            }
            const issuer = request.Issuer;
            if (issuer && issuer[0]._) {
                profile.issuer = issuer[0]._;
            }
            else {
                throw new Error("Missing SAML issuer");
            }
            const nameID = await (0, xml_1.getNameIdAsync)(dom, (_a = this.options.decryptionPvk) !== null && _a !== void 0 ? _a : null);
            if (nameID.value) {
                profile.nameID = nameID.value;
                if (nameID.format) {
                    profile.nameIDFormat = nameID.format;
                }
            }
            else {
                throw new Error("Missing SAML NameID");
            }
            const sessionIndex = request.SessionIndex;
            if (sessionIndex) {
                profile.sessionIndex = sessionIndex[0]._;
            }
            return { profile, loggedOut: true };
        }
        else {
            throw new Error("Unknown SAML request message");
        }
    }
    async processValidlySignedSamlLogoutAsync(doc, dom) {
        const response = doc.LogoutResponse;
        const request = doc.LogoutRequest;
        if (response) {
            return { profile: null, loggedOut: true };
        }
        else if (request) {
            return await this.processValidlySignedPostRequestAsync(doc, dom);
        }
        else {
            throw new Error("Unknown SAML response message");
        }
    }
    generateServiceProviderMetadata(decryptionCert, signingCerts) {
        const callbackUrl = this.getCallbackUrl(); // TODO it would probably be useful to have a host parameter here
        return (0, metadata_1.generateServiceProviderMetadata)({
            ...this.options,
            callbackUrl,
            decryptionCert,
            signingCerts,
        });
    }
    /**
     * Process max age assertion and use it if it is more restrictive than the NotOnOrAfter age
     * assertion received in the SAMLResponse.
     *
     * @param maxAssertionAgeMs Max time after IssueInstant that we will accept assertion, in Ms.
     * @param notOnOrAfter Expiration provided in response.
     * @param issueInstant Time when response was issued.
     * @returns {*} The expiration time to be used, in Ms.
     */
    calcMaxAgeAssertionTime(maxAssertionAgeMs, notOnOrAfter, issueInstant) {
        const notOnOrAfterMs = (0, datetime_1.dateStringToTimestamp)(notOnOrAfter, "NotOnOrAfter");
        const issueInstantMs = (0, datetime_1.dateStringToTimestamp)(issueInstant, "IssueInstant");
        if (maxAssertionAgeMs === 0) {
            return notOnOrAfterMs;
        }
        const maxAssertionTimeMs = issueInstantMs + maxAssertionAgeMs;
        return maxAssertionTimeMs < notOnOrAfterMs ? maxAssertionTimeMs : notOnOrAfterMs;
    }
    mustValidateInResponseTo(hasInResponseTo) {
        return (this.options.validateInResponseTo === types_1.ValidateInResponseTo.always ||
            (this.options.validateInResponseTo === types_1.ValidateInResponseTo.ifPresent && hasInResponseTo));
    }
}
exports.SAML = SAML;
//# sourceMappingURL=saml.js.map