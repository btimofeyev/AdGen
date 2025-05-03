// client/src/pages/TermsPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background text-charcoal dark:text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center text-pastel-blue hover:underline mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h1>Terms of Service</h1>
          <p className="text-charcoal/60 dark:text-gray-400">Last Updated: May 2, 2025</p>

          <h2 className="mt-8">1. Introduction</h2>
          <p>
            Welcome to PostoraAI. These Terms of Service ("Terms") govern your access to and use of the PostoraAI website, services, and applications (collectively, the "Service"). Please read these Terms carefully before using our Service.
          </p>
          <p>
            By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Service.
          </p>

          <h2>2. Definitions</h2>
          <ul>
            <li>"Service" refers to the PostoraAI website, applications, and services.</li>
            <li>"User," "you," and "your" refer to the individual or entity using our Service.</li>
            <li>"Content" refers to images, text, data, and other materials.</li>
            <li>"User Content" refers to any Content that users submit, upload, or generate through the Service.</li>
          </ul>

          <h2>3. Account Registration</h2>
          <p>
            To use certain features of the Service, you may need to create an account. You are responsible for:
          </p>
          <ul>
            <li>Providing accurate and complete information.</li>
            <li>Maintaining the security of your account and password.</li>
            <li>All activities that occur under your account.</li>
          </ul>

          <h2>4. Service Usage and Restrictions</h2>
          <p>
            You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:
          </p>
          <ul>
            <li>Use the Service to create, upload, or share illegal, harmful, threatening, abusive, harassing, or offensive content.</li>
            <li>Upload content that infringes on intellectual property rights.</li>
            <li>Attempt to gain unauthorized access to any part of the Service.</li>
            <li>Use the Service to generate content that impersonates individuals or creates misleading information.</li>
          </ul>

          <h2>5. Payment and Subscriptions</h2>
          <ul>
            <li>Certain features of our Service may require payment or subscription.</li>
            <li>All payments are processed through secure third-party payment processors.</li>
            <li>Subscriptions will automatically renew unless canceled before the renewal date.</li>
            <li>Credits expire according to the terms specified at the time of purchase.</li>
          </ul>

          <h2>6. User Content</h2>
          <ul>
            <li>You retain ownership of your User Content.</li>
            <li>By uploading Content to the Service, you grant PostoraAI a non-exclusive, worldwide license to use, store, and process that Content for the purpose of providing the Service.</li>
            <li>PostoraAI reserves the right to remove any User Content that violates these Terms.</li>
          </ul>

          <h2>7. Intellectual Property</h2>
          <ul>
            <li>The Service and its original content, features, and functionality are owned by PostoraAI and are protected by international copyright, trademark, and other intellectual property laws.</li>
            <li>Generated images are owned by the user who created them, subject to the limitations set forth in these Terms.</li>
          </ul>

          <h2>8. AI-Generated Content</h2>
          <ul>
            <li>Content generated through our AI tools is provided "as is" without warranties.</li>
            <li>You are responsible for ensuring that your use of AI-generated content complies with applicable laws and does not infringe on third-party rights.</li>
            <li>PostoraAI reserves the right to limit the generation of certain types of content.</li>
          </ul>

          <h2>9. Termination</h2>
          <p>
            We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms.
          </p>

          <h2>10. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, PostoraAI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.
          </p>

          <h2>11. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will provide notice of significant changes through the Service or by other means.
          </p>

          <h2>12. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law provisions.
          </p>

          <h2>13. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at: support@postoraai.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;