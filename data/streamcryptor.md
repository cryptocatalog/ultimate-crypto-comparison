# StreamCryptor - https://github.com/bitbeans/StreamCryptor
Stream encryption & decryption with libsodium and protobuf

## Description
You can use StreamCryptor to encrypt and decrypt files without size limit and the need to load every file completely into memory. StreamCryptor uses FileStream to read and write files in chunks, there is also an asynchronous implementations for progress reporting available: example. For more working examples check out the tests in this repository.

Files are encrypted into SCCEF (StreamCryptor Chunked Encrypted File) format. Every file contains an EncryptedFileHeader some EncryptedFileChunks and an EncryptedFileFooter to prevent file manipulation.

The file serialization is realised with Google`s protobuf, it has a small overhead and offers an automatic length prefix for all file parts. All cryptographic operations are performed via libsodium-net and thus libsodium), see Algorithm details.

To protect the senders PublicKey from beeing tracked, you should use an ephemeral key pair for every file. If you do this it isn't possible to authenticate who encrypted the file!

## Repository
- https://github.com/bitbeans/StreamCryptor

## License
- MIT

## Metadata
- [Link to Audit-Report 04.2015](https://cure53.de/pentest-report_streamcryptor.pdf)
- This library targets .NET 4.5.

## Interface Languages
- C#