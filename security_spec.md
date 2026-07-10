# Security Specification: Fortress Firestore Rules

## 1. Data Invariants
1. **User Identity Invariant**: A user document under `/users/{uid}` must only be readable and writeable by its respective owner or a designated Admin.
2. **Branch Security Invariant**: Sub-resources like Branches and Warehouses must only be modified by the organization they belong to (matching `pharmacyId`).
3. **Audit Log Invariant**: Any authenticated user can record activities in the `/audit_logs` collection to prevent security logging silent failures.

## 2. Threat Analysis: The "Dirty Dozen" Payload Tests
1. **Identity Spoofing**: Attempting to write a user profile under `/users/attacker` using another user's `uid`.
2. **Privilege Escalation**: Modifying role to `admin` or setting `verificationStatus` to `approved` as a regular pharmacy owner.
3. **Branch Hijacking**: Deleting a branch belonging to another hierarchy (`pharmacyId !== auth.uid`).
4. **Subscription Bypass**: Lowering or manipulating the `monthlyBillingAmount` on own profile directly without dynamic verification.
5. **Invoice Fabrication**: Simulating paid status in SaaS invoices directly on `/saas_invoices/{invoiceId}`.
6. **Audit Logs Evasion**: Deleting audit logs to erase evidence of malicious operations.
7. **Ref_ID Poisoning**: Creating inventory items with an extremely long malformed ID to exhaust system memory.
8. **Products Tampering**: Unauthorized modification of drug catalog listings by non-approved importer roles.
9. **Staff Impersonation**: Assigning staff credentials to an unverified email structure.
10. **Sales Tampering**: Modifying or deleting sales records to forge transaction logs.
11. **Transfer Hijacking**: Unauthorized modification or deletion of branch stock transit orders.
12. **PII Exfiltration**: A non-owner attempting to extract user emails and contact options blanketly from the `users` collection.
