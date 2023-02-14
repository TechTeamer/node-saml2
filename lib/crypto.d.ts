/// <reference types="node" />
/// <reference types="node" />
import * as crypto from "crypto";
export declare const keyToPEM: (key: string | Buffer) => string | Buffer;
export declare const certToPEM: (cert: string) => string;
export declare const generateUniqueId: () => string;
export declare const removeCertPEMHeaderAndFooter: (certificate: string) => string;
export declare const createHash: (algorithm: string) => crypto.Hash;
export declare const createSign: (algorithm: string) => crypto.Signer;
export declare const createVerify: (algorithm: string) => crypto.Verify;
