/**
 * PrivAI Network - Cryptographic Utilities
 * 
 * This module provides cryptographic functions for securing data and communications
 * in the PrivAI Network, including encryption, decryption, hashing, and key generation.
 */

const crypto = require('crypto');
const { promisify } = require('util');
const randomBytes = promisify(crypto.randomBytes);
const elliptic = require('elliptic');
const EC = new elliptic.ec('secp256k1');

/**
 * Generate a random key pair for asymmetric encryption
 * @param {string} type - Type of key pair (e.g., 'rsa', 'ec')
 * @param {Object} options - Options for key generation
 * @returns {Object} Generated key pair {publicKey, privateKey}
 */
async function generateKeyPair(type = 'ec', options = {}) {
  if (type === 'ec') {
    const keyPair = EC.genKeyPair();
    return {
      publicKey: keyPair.getPublic('hex'),
      privateKey: keyPair.getPrivate('hex')
    };
  } else if (type === 'rsa') {
    const defaultOptions = {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    };
    
    return new Promise((resolve, reject) => {
      crypto.generateKeyPair('rsa', {
        ...defaultOptions,
        ...options
      }, (err, publicKey, privateKey) => {
        if (err) return reject(err);
        resolve({ publicKey, privateKey });
      });
    });
  } else {
    throw new Error(`Unsupported key type: ${type}`);
  }
}

/**
 * Encrypt data using AES-GCM algorithm
 * @param {string|Buffer} data - Data to be encrypted
 * @param {string|Buffer} key - Encryption key (32 bytes for AES-256)
 * @param {string|Buffer} [iv] - Initialization vector (optional)
 * @returns {Object} Encrypted data, IV, and auth tag
 */
async function encrypt(data, key, iv = null) {
  // Generate random IV if not provided
  if (!iv) {
    iv = await randomBytes(16);
  } else if (typeof iv === 'string') {
    iv = Buffer.from(iv, 'hex');
  }

  // Ensure key is proper length and format
  if (typeof key === 'string') {
    key = Buffer.from(key, 'hex');
  }
  
  // Convert data to buffer if it's a string
  const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  
  // Create cipher with AES-256-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  // Encrypt the data
  const encryptedData = Buffer.concat([
    cipher.update(dataBuffer),
    cipher.final()
  ]);
  
  // Get authentication tag
  const authTag = cipher.getAuthTag();
  
  return {
    encryptedData: encryptedData.toString('base64'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

/**
 * Decrypt data using AES-GCM algorithm
 * @param {string|Buffer} encryptedData - Data to be decrypted
 * @param {string|Buffer} key - Decryption key
 * @param {string|Buffer} iv - Initialization vector
 * @param {string|Buffer} authTag - Authentication tag
 * @returns {Buffer} Decrypted data
 */
function decrypt(encryptedData, key, iv, authTag) {
  // Ensure proper formats
  if (typeof encryptedData === 'string') {
    encryptedData = Buffer.from(encryptedData, 'base64');
  }
  if (typeof key === 'string') {
    key = Buffer.from(key, 'hex');
  }
  if (typeof iv === 'string') {
    iv = Buffer.from(iv, 'hex');
  }
  if (typeof authTag === 'string') {
    authTag = Buffer.from(authTag, 'hex');
  }
  
  // Create decipher
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  // Decrypt the data
  const decryptedData = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final()
  ]);
  
  return decryptedData;
}

/**
 * Hash data using the specified algorithm
 * @param {string|Buffer} data - Data to be hashed
 * @param {string} algorithm - Hash algorithm (e.g., 'sha256', 'sha512')
 * @returns {string} Hex-encoded hash
 */
function hashData(data, algorithm = 'sha256') {
  const hash = crypto.createHash(algorithm);
  hash.update(typeof data === 'string' ? data : data.toString());
  return hash.digest('hex');
}

/**
 * Generate a digital signature for data
 * @param {string|Buffer} data - Data to sign
 * @param {string|Buffer} privateKey - Private key for signing
 * @param {string} algorithm - Signature algorithm
 * @returns {string} Hex-encoded signature
 */
function signData(data, privateKey, algorithm = 'sha256') {
  if (typeof privateKey === 'string' && privateKey.startsWith('-----BEGIN')) {
    // RSA private key in PEM format
    const sign = crypto.createSign(algorithm);
    sign.update(typeof data === 'string' ? data : data.toString());
    return sign.sign(privateKey, 'hex');
  } else {
    // EC private key as hex string
    const keyPair = EC.keyFromPrivate(privateKey);
    const msgHash = hashData(data);
    const signature = keyPair.sign(msgHash);
    return signature.toDER('hex');
  }
}

/**
 * Verify a digital signature
 * @param {string|Buffer} data - Original data
 * @param {string} signature - Signature to verify
 * @param {string|Buffer} publicKey - Public key for verification
 * @param {string} algorithm - Signature algorithm
 * @returns {boolean} Whether the signature is valid
 */
function verifySignature(data, signature, publicKey, algorithm = 'sha256') {
  try {
    if (typeof publicKey === 'string' && publicKey.startsWith('-----BEGIN')) {
      // RSA public key in PEM format
      const verify = crypto.createVerify(algorithm);
      verify.update(typeof data === 'string' ? data : data.toString());
      return verify.verify(publicKey, Buffer.from(signature, 'hex'));
    } else {
      // EC public key as hex string
      const keyPair = EC.keyFromPublic(publicKey, 'hex');
      const msgHash = hashData(data);
      return keyPair.verify(msgHash, signature);
    }
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Generate a secure random string
 * @param {number} length - Length of the random string
 * @returns {string} Random hex string
 */
async function generateRandomString(length = 32) {
  const bytes = await randomBytes(Math.ceil(length / 2));
  return bytes.toString('hex').slice(0, length);
}

/**
 * Derive a key from a password using PBKDF2
 * @param {string} password - Password to derive key from
 * @param {string|Buffer} salt - Salt for key derivation
 * @param {number} keyLength - Length of the derived key in bytes
 * @param {number} iterations - Number of iterations
 * @returns {Promise<Buffer>} Derived key
 */
function deriveKey(password, salt, keyLength = 32, iterations = 100000) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, keyLength, 'sha512', (err, key) => {
      if (err) return reject(err);
      resolve(key);
    });
  });
}

module.exports = {
  generateKeyPair,
  encrypt,
  decrypt,
  hashData,
  signData,
  verifySignature,
  generateRandomString,
  deriveKey
}; 