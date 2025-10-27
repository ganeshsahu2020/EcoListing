import React from "react";

export default function Blog() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-4xl font-bold text-slate-900 mb-2">EcoListing Blog</h1>
      <p className="text-slate-600 text-lg mb-8">
        Explore insights, trends, and tips on sustainable real estate, green living, and the future of eco-friendly homes.
        Our blog is dedicated to helping you make informed decisions for a healthier planet and a better lifestyle.
      </p>

      <div className="space-y-10">
        <section>
          <h2 className="text-2xl font-semibold text-emerald-800 mb-2">The Rise of Eco-Friendly Homes</h2>
          <p className="text-slate-700 mb-1">
            Sustainability is more than a trend—it's a movement reshaping the real estate industry. Modern homebuyers are prioritizing energy efficiency, renewable materials, and healthy indoor environments.
            At EcoListing, we connect you with properties that are good for your family and the planet.
          </p>
          <p className="text-slate-500 text-sm">
            <span className="font-semibold">Key Takeaway:</span> Green homes offer long-term savings, improved wellness, and a reduced carbon footprint.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Top 5 Features of a Sustainable Home</h2>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li>High-performance insulation and windows for energy efficiency</li>
            <li>Solar panels and renewable energy sources</li>
            <li>Low-VOC paints and eco-friendly building materials</li>
            <li>Smart water management systems</li>
            <li>Native landscaping and outdoor spaces that support biodiversity</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Why Invest in Green Real Estate?</h2>
          <p className="text-slate-700">
            Eco-friendly properties are in high demand and tend to hold their value. Forward-thinking buyers and investors appreciate homes that offer lower utility bills, healthier environments, and future-ready technology.
          </p>
          <p className="text-slate-500 text-sm mt-1">
            <span className="font-semibold">Pro Tip:</span> Look for certifications like LEED, ENERGY STAR, or Passive House when searching for your next property.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">EcoListing’s Commitment to Sustainability</h2>
          <p className="text-slate-700">
            Our mission is to empower homebuyers, sellers, and agents with resources and listings that align with sustainable values.
            We partner with green-certified builders and agents to ensure every listing meets high standards for efficiency and environmental responsibility.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Get Involved and Stay Informed</h2>
          <p className="text-slate-700">
            Subscribe to our newsletter for the latest blog posts, new eco-friendly listings, and actionable tips for sustainable living.
            Connect with us on social media and join a community that’s building a greener future—one home at a time.
          </p>
        </section>
      </div>

      <div className="mt-10 text-center text-slate-500 text-sm">
        Interested in contributing to our blog? Email <a href="mailto:editor@ecolisting.com" className="text-emerald-700 underline">editor@ecolisting.com</a> with your ideas or guest post submissions.
      </div>
    </div>
  );
}