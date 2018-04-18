# SecurityDriven.Inferno - http://securitydriven.net/inferno/
 .NET crypto done right. Professionally audited.

## Description
Inferno has the following design goals:

- .NET crypto done right.
- Free, open source (MIT license).
- Developer-friendly, misuse-resistant API.
- Safe by design: safe algorithms, safe modes, safe choices.
- Does not re-implement crypto primitives.
- Uses FIPS-certified implementations where possible.
- 100% managed modern c# 6.0. The only reference is "System.dll".
- Performance-oriented (within reason - unsafe code is not a reason).
- Minimal codebase, high maintainability & introspectability (easy security audits).
- Unit testing, fuzz testing.
- Streaming authenticated encryption (secure channels).
- Symmetric crypto: AEAD only.
- Asymmetric crypto: NSA/CNSA Suite B API only (Elliptic Curves). No RSA.
- Decent documentation & code examples.

## Repository
- https://github.com/sdrapkin/SecurityDriven.Inferno

## License
- MIT

## Interface Languages
- C#
