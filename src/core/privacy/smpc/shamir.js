/**
 * PrivAI Network - Shamir's Secret Sharing Implementation
 * 
 * This module provides functions to split secrets into shares and reconstruct them
 * using Shamir's Secret Sharing scheme, a threshold cryptography technique.
 */

const crypto = require('crypto');

class ShamirSecretSharing {
  /**
   * Generate shares from a secret using Shamir's Secret Sharing
   * @param {number|string} secret - The secret to be shared
   * @param {number} totalShares - Total number of shares to generate
   * @param {number} threshold - Minimum shares needed for reconstruction
   * @returns {Array} Array of share objects {x, y}
   */
  static generateShares(secret, totalShares, threshold) {
    // Convert secret to a BigInt for large number arithmetic
    const secretValue = typeof secret === 'number' ? BigInt(secret) : 
                        BigInt('0x' + crypto.createHash('sha256').update(String(secret)).digest('hex'));
    
    const shares = [];
    const prime = BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639747'); // 256-bit prime
    
    // Generate random coefficients for the polynomial
    const coefficients = [secretValue];
    for (let i = 1; i < threshold; i++) {
      // Generate random coefficient (using crypto.randomBytes for security)
      const randBytes = crypto.randomBytes(32);
      const randCoefficient = BigInt('0x' + randBytes.toString('hex')) % prime;
      coefficients.push(randCoefficient);
    }
    
    // Generate shares using the polynomial
    for (let x = 1; x <= totalShares; x++) {
      const xBigInt = BigInt(x);
      let y = BigInt(0);
      
      // Evaluate polynomial at point x
      for (let j = 0; j < coefficients.length; j++) {
        // y += coefficients[j] * (x^j)
        y = (y + coefficients[j] * this._pow(xBigInt, BigInt(j), prime)) % prime;
      }
      
      shares.push({
        x: x,
        y: y.toString()
      });
    }
    
    return shares;
  }
  
  /**
   * Helper function for modular exponentiation
   */
  static _pow(base, exponent, modulus) {
    if (modulus === BigInt(1)) return BigInt(0);
    
    let result = BigInt(1);
    base = base % modulus;
    
    while (exponent > BigInt(0)) {
      if (exponent % BigInt(2) === BigInt(1)) {
        result = (result * base) % modulus;
      }
      exponent = exponent >> BigInt(1);
      base = (base * base) % modulus;
    }
    
    return result;
  }
  
  /**
   * Reconstruct the secret from shares using Lagrange interpolation
   * @param {Array} shares - Array of share objects {x, y}
   * @param {string} prime - Prime number for modular arithmetic
   * @returns {string} Reconstructed secret as string
   */
  static reconstructSecret(shares, prime) {
    prime = BigInt(prime || '115792089237316195423570985008687907853269984665640564039457584007913129639747');
    
    if (shares.length === 0) {
      throw new Error('No shares provided for reconstruction');
    }
    
    let secret = BigInt(0);
    
    for (let i = 0; i < shares.length; i++) {
      const share = shares[i];
      const xi = BigInt(share.x);
      const yi = BigInt(share.y);
      
      let numerator = BigInt(1);
      let denominator = BigInt(1);
      
      for (let j = 0; j < shares.length; j++) {
        if (i !== j) {
          const xj = BigInt(shares[j].x);
          numerator = (numerator * xj) % prime;
          denominator = (denominator * ((xj - xi) % prime)) % prime;
        }
      }
      
      // Calculate the modular multiplicative inverse of denominator
      const denominatorInverse = this._modInverse(denominator, prime);
      
      // Update the secret using Lagrange basis polynomial
      const lagrangeTerm = (yi * numerator * denominatorInverse) % prime;
      secret = (secret + lagrangeTerm) % prime;
    }
    
    return secret.toString();
  }
  
  /**
   * Calculate modular multiplicative inverse
   */
  static _modInverse(a, m) {
    a = ((a % m) + m) % m; // Ensure positive value
    
    if (a === BigInt(0)) {
      throw new Error('Modular inverse does not exist');
    }
    
    const [gcd, x] = this._extendedGCD(a, m);
    
    if (gcd !== BigInt(1)) {
      throw new Error('Modular inverse does not exist');
    } else {
      return ((x % m) + m) % m;
    }
  }
  
  /**
   * Extended Euclidean Algorithm to find GCD and coefficients
   */
  static _extendedGCD(a, b) {
    if (a === BigInt(0)) {
      return [b, BigInt(0), BigInt(1)];
    }
    
    const [gcd, x1, y1] = this._extendedGCD(b % a, a);
    const x = y1 - (b / a) * x1;
    const y = x1;
    
    return [gcd, x, y];
  }
}

module.exports = ShamirSecretSharing; 