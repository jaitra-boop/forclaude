# Technical limits (example)

- Invites expire after 7 days; the API can resend but not extend.
- Email delivery status is not available to the client (no bounce webhooks yet).
- SSO workspaces cannot invite by email; members are provisioned via SCIM.
- The mobile app has no offline queue; requests fail immediately without network.
