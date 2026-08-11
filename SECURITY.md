# Security Policy

BioMed 3D Engineering Lab is an educational platform. Do not commit production secrets, API keys, database credentials, or private environment values to this repository.

## Secrets

- Keep future private API keys only in server-side environment variables.
- Never expose private keys with a `NEXT_PUBLIC_` prefix.
- Use `.env.example` only as documentation. It must not contain real credentials.

## Reporting

If you find a security issue, report it privately through the repository owner or GitHub private vulnerability reporting when available. Do not open a public issue with exploit details or active secrets.

## Educational Scope

This project is for education and training. It does not replace institutional protocols, clinical supervision, certified biomedical maintenance, or regulatory compliance.
