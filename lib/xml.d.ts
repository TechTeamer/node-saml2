/// <reference types="node" />
import { NameID, SamlSigningOptions, XmlJsObject, XMLOutput, XmlSignatureLocation } from "./types";
export declare const xpath: {
    selectAttributes: (node: Node, xpath: string) => Attr[];
    selectElements: (node: Node, xpath: string) => Element[];
};
export declare const decryptXml: (xml: string, decryptionKey: string | Buffer) => Promise<string>;
/**
 * This function checks that the |currentNode| in the |fullXml| document contains exactly 1 valid
 *   signature of the |currentNode|.
 *
 * See https://github.com/bergie/passport-saml/issues/19 for references to some of the attack
 *   vectors against SAML signature verification.
 */
export declare const validateSignature: (fullXml: string, currentNode: Element, certs: string[]) => boolean;
/**
 * This function checks that the |signature| is signed with a given |cert|.
 */
export declare const validateXmlSignatureForCert: (signature: Node, certPem: string, fullXml: string, currentNode: Element) => boolean;
export declare const signXml: (xml: string, xpath: string, location: XmlSignatureLocation, options: SamlSigningOptions) => string;
export declare const parseDomFromString: (xml: string) => Promise<Document>;
export declare const parseXml2JsFromString: (xml: string | Buffer) => Promise<XmlJsObject>;
export declare const buildXml2JsObject: (rootName: string, xml: XmlJsObject) => string;
export declare const buildXmlBuilderObject: (xml: XMLOutput, pretty: boolean) => string;
export declare const promiseWithNameId: (nameid: Node) => Promise<NameID>;
export declare const getNameIdAsync: (doc: Node, decryptionPvk: string | Buffer | null) => Promise<NameID>;
