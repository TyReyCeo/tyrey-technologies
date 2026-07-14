# Connect AI — 10DLC / Toll-Free Registration Runbook (admin)

Real (non-demo) numbers cannot send SMS until carrier registration completes.
The platform enforces this: a `ConnectNumber` provisioned through Twilio is
created with `status="pending_registration"`, and every real send is blocked
with a 409 until an admin flips it to `active`. Demo numbers are exempt.

**Start registration during development, not at launch** — approval takes
days (toll-free) to weeks (10DLC). This is standing risk #1 in ROADMAP.md.

## When a customer provisions their first real number

1. **Choose the registration path.**
   - **Toll-free verification** (simpler, one form, no monthly campaign fee):
     right default for low-volume local businesses. Provision with
     `toll_free: true`.
   - **10DLC** (local numbers): requires a Brand + Campaign registration with
     The Campaign Registry via Twilio.

2. **Submit in the Twilio Console.**
   - Toll-free: Console → Phone Numbers → Regulatory Compliance → Toll-Free
     Verification. You'll need the customer's legal business name, address,
     website, sample messages, and opt-in description ("Customers text our
     published number; STOP/HELP honored").
   - 10DLC: Console → Messaging → Regulatory Compliance → A2P 10DLC. Register
     the Brand (customer's EIN) first, then a Campaign (use-case: "Customer
     Care" or "Mixed"), then attach the number to the campaign's Messaging
     Service.

3. **Wire the webhooks while you wait.** On the Twilio number, set:
   - Incoming message webhook → `POST https://<backend>/connect/webhooks/twilio/inbound`
   - Status callback → `POST https://<backend>/connect/webhooks/twilio/status`

4. **Track status.** Twilio emails on approval/rejection; status is also
   visible in the Console. Rejections are usually fixable (clearer opt-in
   language, working website).

5. **Activate the number.** Once approved, flip the platform gate
   (admin-only — your email must be in `ADMIN_EMAILS`):

   ```
   PATCH /connect/admin/numbers/{number_id}
   {"status": "active"}
   ```

   Real sends unlock immediately; the customer's Settings page stops showing
   the "registration in progress" note.

## Compliance invariants (already enforced in code — do not relax)

- STOP/STOPALL/UNSUBSCRIBE/CANCEL/END/QUIT set `sms_opt_out` and suppress all
  further sends, including AI auto-replies. START/UNSTOP/YES re-subscribes.
  HELP returns the business identification + opt-out instructions.
- Keywords are processed at the service layer **before** AI ever sees the
  message.
- Every outbound send checks `sms_opt_out` and the number's registration
  status. There is no bypass path.

## Monthly reconciliation (risk #4)

Compare `connect_usage_records` totals against the Twilio usage report for
the same period. Investigate any drift > 2% — it usually means missed status
callbacks or a webhook outage.
