import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Privacy Policy — TyRey Intelligence™" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <h2>1. What We Collect</h2>
      <p>
        Account data (email, hashed password), the business information you submit to generate
        documents (ideas, project details, notes), generated outputs, and payment records
        processed by Stripe. We do not store full card numbers.
      </p>

      <h2>2. How We Use It</h2>
      <p>
        To operate the Service: generating your documents, storing them in your vault, processing
        payments, and providing support. Your inputs are sent to our AI model providers solely to
        produce your outputs. We may use aggregated, de-identified usage data to improve our
        frameworks and benchmarks; we do not sell personal data.
      </p>

      <h2>3. Sharing</h2>
      <p>
        Data is shared only with the processors needed to run the Service (cloud hosting, AI
        model providers, Stripe for payments) under their respective data protection terms, or
        when required by law.
      </p>

      <h2>4. Retention and Deletion</h2>
      <p>
        Projects and documents are retained while your account is active. You may delete projects
        at any time or request full account deletion by contacting us; funnel orders are retained
        as required for financial record-keeping.
      </p>

      <h2>5. Security</h2>
      <p>
        Passwords are hashed, transport is encrypted, and access to production data is
        restricted. No system is perfectly secure; notify us immediately of any suspected
        unauthorized access.
      </p>

      <h2>6. Your Rights and Contact</h2>
      <p>
        Depending on your jurisdiction, you may have rights to access, correct, export, or delete
        your personal data. Requests: tywilliams729@gmail.com.
      </p>
    </LegalPage>
  );
}
