// client/src/pages/PrivacyPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-background text-charcoal dark:text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link
          to="/"
          className="inline-flex items-center text-pastel-blue hover:underline mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h1>Privacy Policy</h1>
          <p className="text-charcoal/60 dark:text-gray-400">
            Last Updated: May 2, 2025
          </p>

          <p className="lead">
            This Privacy Policy explains how PostoraAI ("we", "us", or "our")
            collects, uses, and shares information about you when you use our
            website, services, and applications (collectively, the "Service").
          </p>

          <h2 className="mt-8">1. Information We Collect</h2>

          <h3>1.1 Information You Provide</h3>
          <ul>
            <li>
              <strong>Account Information</strong>: When you register for an
              account, we collect your email address, name, and password.
            </li>
            <li>
              <strong>Profile Information</strong>: Optional information such as
              company name.
            </li>
            <li>
              <strong>Payment Information</strong>: When you make a purchase, we
              collect payment method details. Payment information is processed
              securely by our payment processors.
            </li>
            <li>
              <strong>User Content</strong>: Images and other content you upload
              to our Service.
            </li>
            <li>
              <strong>Communications</strong>: Information you provide when
              contacting us.
            </li>
          </ul>

          <h3>1.2 Information Collected Automatically</h3>
          <ul>
            <li>
              <strong>Usage Information</strong>: How you use and interact with
              our Service.
            </li>
            <li>
              <strong>Device Information</strong>: IP address, browser type,
              operating system, and device identifiers.
            </li>
            <li>
              <strong>Cookies and Similar Technologies</strong>: Data collected
              through cookies and similar technologies.
            </li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our Service.</li>
            <li>Process transactions and manage your account.</li>
            <li>Generate AI images based on your inputs.</li>
            <li>Send you technical notices, updates, and support messages.</li>
            <li>Respond to your comments and questions.</li>
            <li>Analyze usage patterns and trends.</li>
            <li>
              Protect against, identify, and prevent fraud and other illegal
              activities.
            </li>
          </ul>

          <h2>3. How We Share Your Information</h2>
          <p>We may share your information:</p>
          <ul>
            <li>With service providers who help us deliver our Service.</li>
            <li>To comply with legal obligations.</li>
            <li>
              In connection with a business transfer such as a merger or
              acquisition.
            </li>
            <li>With your consent or at your direction.</li>
          </ul>
          <p>We do not sell your personal information.</p>

          <h2>4. Data Storage and Security</h2>
          <ul>
            <li>
              <strong>Data Storage</strong>: Your data is stored on secure
              servers and retained for as long as necessary to provide our
              Service or as required by law.
            </li>
            <li>
              <strong>Security Measures</strong>: We implement appropriate
              technical and organizational measures to protect your data.
            </li>
            <li>
              <strong>Data Retention</strong>: Generated images are
              automatically deleted from our servers after 7 days unless you
              have a subscription that includes extended storage.
            </li>
          </ul>

          <h2>5. Your Rights and Choices</h2>
          <p>
            Depending on your location, you may have rights regarding your
            personal information, including:
          </p>
          <ul>
            <li>Accessing your personal information.</li>
            <li>Correcting inaccurate information.</li>
            <li>Deleting your personal information.</li>
            <li>Objecting to or restricting certain processing activities.</li>
            <li>Data portability.</li>
          </ul>
          <p>
            To exercise these rights, please contact us using the information in
            the "Contact Us" section.
          </p>

          <h2>6. Children's Privacy</h2>
          <p>
            Our Service is not directed to children under 16. We do not
            knowingly collect personal information from children under 16. If
            you become aware that a child has provided us with personal
            information, please contact us.
          </p>

          <h2>7. International Transfers</h2>
          <p>
            Your information may be transferred to, stored, and processed in
            countries other than your country of residence. We will take
            appropriate measures to ensure your information remains protected.
          </p>

          <h2>8. Third-Party Links and Services</h2>
          <p>
            Our Service may contain links to third-party websites or services.
            We are not responsible for the privacy practices or content of these
            third parties.
          </p>

          <h2>9. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page
            and updating the "Last Updated" date.
          </p>

          <h2>10. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact
            us at:
          </p>
          <ul>
            <li>Email: privacy@postoraai.com</li>{" "}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
