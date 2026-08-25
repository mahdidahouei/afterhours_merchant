import { Link } from "react-router-dom";
import { ROUTES } from "./links";

/** How many entries show before "Show more" is offered. */
export const FAQ_PREVIEW_COUNT = 6;

const ContactLink = ({ children }: { children: React.ReactNode }) => (
  <Link to={ROUTES.contact} className="text-color-primary-text underline">
    {children}
  </Link>
);

export type FaqEntry = { question: string; answer: React.ReactNode };

export const FAQS: FaqEntry[] = [
  {
    question: "What exactly is Afterhours?",
    answer:
      "Afterhours is a discovery layer that connects diners to your restaurant and routes reservations directly into your existing reservation system.",
  },
  {
    question: "Do I need to create a profile or upload content?",
    answer:
      "No. Your restaurant profile is already set up through existing integrations. No content or profile management required.",
  },
  {
    question: "Which reservation systems do you support?",
    answer: "Guestplan, Formitable, and GoTable — more integrations are in the works.",
  },
  {
    question: "Who is Afterhours for?",
    answer:
      "Restaurants that value quality, considered visibility, and incremental demand without operational changes.",
  },
  {
    question: "What results do restaurants typically see?",
    answer: "On average, partners receive 5–10 incremental reservations per day.",
  },
  {
    question: "Will this affect our brand positioning?",
    answer:
      "No. Afterhours is designed to protect brand value and avoid promotional exposure, we have a strict evaluation policy to include restaurants into our curated collections.",
  },
  {
    question: "Do you handle payments?",
    answer: "No. Payments are handled exactly as they are today, outside of Afterhours.",
  },
  {
    question: "Who is Afterhours not for?",
    answer:
      "Restaurants looking for discounts, deal-driven traffic, or high-volume promotion.",
  },
  {
    question: "Does this change how we handle reservations?",
    answer:
      "No. Reservations are handled exactly as they are today, inside your current system.",
  },
  {
    question: "Is Afterhours a reservation system?",
    answer:
      "No. We don’t replace your reservation software — we work alongside it.",
  },
  {
    question: "Is Afterhours a discount or deals platform?",
    answer: "No. We don’t run discounts, deals, or promotions.",
  },
  {
    question: "How do diners book a table?",
    answer:
      "Diners discover your restaurant on Afterhours and book directly through your existing reservation system.",
  },
  {
    question: "Is there any cost involved?",
    answer:
      "No. Afterhours is free to use for restaurant partners. No subscriptions. No commissions.",
  },
  {
    question: "How long does setup take?",
    answer:
      "About 2-3 minutes depending on your platform, you can follow video instructions to connect your reservation system.",
  },
  {
    question: "Can we pause or stop at any time?",
    answer:
      "Yes. You’re fully in control and can pause or resume whenever you want.",
  },
  {
    question: "Where is Afterhours active?",
    answer:
      "Currently focused on Utrecht, with more cities planned to go live in Europe.",
  },
  {
    question:
      "We build reservation software for restaurants. How do we plug into Afterhours?",
    answer:
      "As partners, not competitors. What we are building: a decision layer for diners who actually care where they eat. We route them to the right room, then hand the booking straight to the system the restaurant already runs on. No duplicate tools. No competing interests. Our booking partners keep the operations. We handle intent. At Afterhours, we believe the restaurant industry needs more builders working in the same direction. If that sounds like you: integrations@afthr.com",
  },
  {
    question: "My restaurant is not listed, how can I be added?",
    answer: (
      <>
        Write a message to us with your restaurant details
        <ContactLink>here</ContactLink>.
      </>
    ),
  },
  {
    question:
      "My reservation platform is not in your list of integrations, how can I request an integration?",
    answer: (
      <>
        Write a message to us with your restaurant details &amp; desired reservation
        platform <ContactLink>here</ContactLink> and we will contact your reservation
        platform on your behalf.
      </>
    ),
  },
];
