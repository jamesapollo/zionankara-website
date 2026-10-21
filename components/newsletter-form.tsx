"use client";

import { useState } from "react";

// Not wired to a mailing-list provider yet; it only confirms locally.
export function NewsletterForm() {
  const [subscribed, setSubscribed] = useState(false);

  if (subscribed) {
    return <p className="border-b border-muted py-3 text-body text-white">Thank you — you’re on the list.</p>;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubscribed(true);
      }}
      className="flex border-b border-muted"
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        placeholder="Your email address"
        className="min-w-0 flex-1 bg-transparent py-3 text-body text-white outline-none placeholder:text-subtle"
      />
      <button type="submit" className="cursor-pointer text-label uppercase tracking-button text-white hover:text-accent-soft">
        Subscribe
      </button>
    </form>
  );
}
