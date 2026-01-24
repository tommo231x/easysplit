import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";

export default function Privacy() {
  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <BrandLogo />
        </div>

        {/* Content */}
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: January 2025</p>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Overview</h2>
            <p className="text-muted-foreground leading-relaxed">
              EasySplit ("we", "our", or "us") is committed to protecting your privacy.
              This policy explains how we handle information when you use our bill-splitting service at easysplit.link.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Data you provide:</strong> When you create a bill split, you may enter names of people
              and menu items. This information is stored temporarily to enable the split functionality.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Analytics data:</strong> If you accept cookies, we use Firebase Analytics to collect
              anonymous usage data such as page views and feature usage. This helps us improve the service.
              No personal information is collected through analytics.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Local storage:</strong> We store preferences and recent split history in your browser's
              local storage. This data never leaves your device unless you choose to share a split link.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">How We Use Information</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>To provide the bill-splitting functionality</li>
              <li>To enable real-time collaboration via shared links</li>
              <li>To improve our service based on anonymous usage patterns</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell or share your personal information with third parties.
              Split data is only accessible to people who have the unique share code.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies for analytics purposes only. You can choose to accept or decline cookies
              when you first visit the site. If you decline, no analytics cookies will be set,
              and the service will still work normally.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              Split data is stored on our servers for a limited time to enable sharing functionality.
              Local storage data remains on your device until you clear your browser data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              You can clear your local data at any time by clearing your browser's storage.
              You can also withdraw cookie consent by clearing cookies and refreshing the page.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this privacy policy, please contact us through our social media channels.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this policy from time to time. Any changes will be posted on this page
              with an updated revision date.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-border text-center">
          <Link href="/">
            <Button variant="outline">Return to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
