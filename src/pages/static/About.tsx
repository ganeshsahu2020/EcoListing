import React from "react";

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-4xl font-bold text-slate-900 mb-2">About Us</h1>
      <p className="text-slate-600 text-lg mb-8">
        EcoListing is redefining the real estate experience—where sustainability meets innovation, and your next home reflects your values.
      </p>
      <div className="space-y-10">
        <section>
          <h2 className="text-2xl font-semibold text-slate-900">Who We Are</h2>
          <p className="mt-2 text-slate-600">
            Founded by industry veterans and climate advocates, EcoListing is a forward-thinking real estate platform designed for the modern, eco-conscious world. We believe that responsible homeownership and environmental stewardship go hand in hand. Our team is passionate about leveraging technology to connect people with properties that aren’t just beautiful—but built for a better future.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold text-slate-900">Our Mission</h2>
          <p className="mt-2 text-slate-600">
            We are on a mission to empower buyers, sellers, and agents with advanced tools and sustainability insights. Our goal? To make every real estate transaction smarter, greener, and more transparent—so every move is a step toward healthier lives and thriving communities.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold text-slate-900">What Sets Us Apart</h2>
          <ul className="mt-2 text-slate-600 list-disc pl-6 space-y-2">
            <li>
              <strong>Eco Intelligence:</strong> We integrate real-time listing data with detailed sustainability analytics—energy efficiency scores, green certifications, carbon footprint metrics, and more.
            </li>
            <li>
              <strong>Verified Green Listings:</strong> All featured properties are evaluated for eco-friendly features, renewable energy sources, and low-impact materials, empowering you to choose homes aligned with your values.
            </li>
            <li>
              <strong>Transparent Processes:</strong> From virtual tours to digital paperwork, we streamline every step with clarity and integrity, ensuring you make informed decisions with confidence.
            </li>
            <li>
              <strong>Community Focus:</strong> We partner with local organizations to promote sustainable development, resilient neighborhoods, and environmental education.
            </li>
          </ul>
        </section>
        <section>
          <h2 className="text-2xl font-semibold text-slate-900">Our Commitment</h2>
          <p className="mt-2 text-slate-600">
            At EcoListing, we are committed to continuous improvement. We invest in research, foster innovation, and listen to our users—ensuring our platform evolves with the needs of tomorrow’s homeowners and the planet we all share.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold text-slate-900">Join Our Movement</h2>
          <p className="mt-2 text-slate-600">
            Whether you’re searching for your dream green home, listing a sustainable property, or seeking to partner with us to drive positive change—EcoListing welcomes you. Let’s build a future where every home is a step toward a more sustainable world.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold text-slate-900">Contact Us</h2>
          <p className="mt-2 text-slate-600">
            Have questions or want to learn more? Reach out to our team at <a href="mailto:info@ecolisting.com" className="text-blue-600 underline">info@ecolisting.com</a> or visit our <a href="/contact" className="text-blue-600 underline">Contact page</a>.
          </p>
        </section>
      </div>
    </div>
  );
}