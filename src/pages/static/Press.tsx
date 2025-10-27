import React from "react";

export default function Press() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-4xl font-bold text-slate-900 mb-2">Press & Media</h1>
      <p className="text-slate-600 text-lg mb-8">
        Welcome to the EcoListing Press Room. Here you’ll find our latest news, media resources, and contact information for journalists and media professionals.
      </p>

      <div className="space-y-10">
        <section>
          <h2 className="text-2xl font-semibold text-slate-900">Recent Announcements</h2>
          <ul className="mt-2 text-slate-600 list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">October 2025:</span> EcoListing launches “GreenScore,” an industry-first sustainability rating for residential properties.
            </li>
            <li>
              <span className="font-medium">August 2025:</span> EcoListing partners with GreenBuild Alliance to expand eco-friendly home certifications.
            </li>
            <li>
              <span className="font-medium">May 2025:</span> Recognized by CleanTech Today as a top innovator in sustainable real estate technology.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-900">Media Resources</h2>
          <ul className="mt-2 text-slate-600 list-disc pl-6 space-y-2">
            <li>
              <a href="/media/EcoListing-PressKit.zip" className="text-blue-600 underline" download>
                Download our Press Kit
              </a>{" "}
              — Logos, executive bios, product screenshots, and company fact sheet.
            </li>
            <li>
              <a href="/media/EcoListing-BrandGuidelines.pdf" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
                Brand Guidelines
              </a>{" "}
              — Usage policies for our marks and promotional assets.
            </li>
            <li>
              <a href="/about" className="text-blue-600 underline">
                Company Overview
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-900">In The News</h2>
          <ul className="mt-2 text-slate-600 list-disc pl-6 space-y-2">
            <li>
              <a href="https://www.cleantechtoday.com/ecolisting-feature" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                CleanTech Today: “EcoListing Pioneers Sustainable Real Estate Solutions” (May 2025)
              </a>
            </li>
            <li>
              <a href="https://www.greenbuildalliance.org/news/ecolisting-partnership" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                GreenBuild Alliance: “Expanding Green Home Access with EcoListing” (August 2025)
              </a>
            </li>
            <li>
              <a href="https://www.propertyweekly.com/interview-ecolisting" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                Property Weekly: “Interview with EcoListing’s CEO on the Future of Eco-Homes” (March 2025)
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-900">Press Contact</h2>
          <p className="mt-2 text-slate-600">
            For media inquiries, interviews, or to request additional information, please contact our communications team at{" "}
            <a href="mailto:press@ecolisting.com" className="text-blue-600 underline">press@ecolisting.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}