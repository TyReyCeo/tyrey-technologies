import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Terms of Service — TyRey Intelligence™" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <h2>1. The Service</h2>
      <p>
        TyRey Intelligence™ (&quot;the Service&quot;) is an AI-powered strategic planning
        platform operated by TyRey Technologies, Inc. (&quot;TyRey&quot;, &quot;we&quot;). The
        Service generates business planning documents, diagnostics, and analyses based on
        information you provide.
      </p>

      <h2>2. Not Professional Advice</h2>
      <p>
        All outputs are strategic planning tools provided for informational purposes only. They
        do not constitute financial, investment, legal, tax, or accounting advice, and are not a
        recommendation to buy or sell any security or enter any transaction. Scores and
        projections are based on stated assumptions and are not guarantees of business success
        or future performance. You are responsible for decisions made using the Service and
        should consult qualified professional advisors.
      </p>

      <h2>3. Accounts and Acceptable Use</h2>
      <p>
        You are responsible for your account credentials and for the accuracy of information you
        submit. You may not use the Service to generate unlawful content, misrepresent
        AI-generated material as independently audited fact, or resell outputs as your own
        advisory service without attribution where required by your agreement tier.
      </p>

      <h2>4. Payments and Refunds</h2>
      <p>
        One-time packs are charged at purchase via Stripe. Subscriptions renew monthly until
        canceled and can be managed through the billing portal. If a generated deliverable fails
        to produce, contact us within 14 days for a regeneration or refund.
      </p>

      <h2>5. Intellectual Property</h2>
      <p>
        You own the documents generated from your inputs. TyRey retains all rights to the
        platform, the Business Genome™, Intelligence Score™, and all other proprietary
        frameworks, prompts, and methodologies used to produce outputs.
      </p>

      <h2>6. Limitation of Liability</h2>
      <p>
        The Service is provided &quot;as is&quot; without warranties of any kind. To the maximum
        extent permitted by law, TyRey&apos;s aggregate liability is limited to the amounts you
        paid in the twelve months preceding the claim.
      </p>

      <h2>7. Changes and Contact</h2>
      <p>
        We may update these terms; material changes will be notified via the Service. Questions:
        tywilliams729@gmail.com.
      </p>
    </LegalPage>
  );
}
