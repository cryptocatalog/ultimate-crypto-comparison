# Themis - https://www.cossacklabs.com/
Themis is an open-source high-level cryptographic services library for mobile and server platforms, which provides secure data exchange and storage.

## Description
Themis provides four important cryptographic services:

- Secure Message: a simple encrypted messaging solution for the widest scope of applications. Exchange the keys between the parties and you're good to go. Two pairs of the underlying crytosystems: ECC + ECDSA / RSA + PSS + PKCS#7.
- Secure Session: session-oriented, forward secrecy datagram exchange solution with better security guarantees, but more demanding infrastructure. Secure Session can perfectly function as socket encryption, session security, or (with some additional infrastructure) as a high-level messaging primitive. ECDH key agreement, ECC & AES encryption.
- Secure Cell: a multi-mode cryptographic container suitable for storing anything from encrypted files to database records and format-preserved strings. Secure Cell is built around AES in GCM (Token and Seal modes) and CTR (Context imprint mode).
- Secure Comparator: a Zero-Knowledge based cryptographic protocol for authentication and comparing secrets.

## Repository
- https://github.com/cossacklabs/themis

## License
- Apache-2.0

## Metadata
- Developed by Cossack Labs

## Interface Languages
- Swift
- Obj-C
- Android/Java
- C++
- JavaScript
- Python
- Ruby
- PHP
- Go
