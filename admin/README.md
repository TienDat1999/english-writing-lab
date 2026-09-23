# Draftwise Admin

Private content-operations application for Draftwise.

## Local setup

1. Copy `.env.example` to `.env.local` and fill the values.
2. Create the first Admin credential with the root `auth:bootstrap-admin` command.
3. From the repository root, run `pnpm dev:admin`.

The Admin app uses a separate username/password credential and an 8-hour JWT session.
Staff cannot sign up or assign Admin access from the login screen.

```bash
ADMIN_BOOTSTRAP_PASSWORD='Use-a-strong-password' pnpm auth:bootstrap-admin -- \
  --username admin \
  --email admin@example.com \
  --name "Draftwise Admin" \
  --reason "Initial production administrator" \
  --confirm-bootstrap-admin
```

Do not commit or keep `ADMIN_BOOTSTRAP_PASSWORD` in an env file after provisioning.

## Build

```bash
pnpm build:admin
```

Deploy this directory as a separate Vercel project. The deployment must include the
workspace packages outside this directory.
