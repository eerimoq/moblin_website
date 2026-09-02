import { links } from "../data/links";
import Mascot from "./Mascot";

const footerLinks = [
  { label: "GitHub", href: links.github },
  { label: "Discord", href: links.discord },
  { label: "Privacy policy", href: links.privacyPolicy },
];

export default function Footer() {
  return (
    <footer class="border-t border-line/40 py-10">
      <div class="mx-auto flex max-w-[1120px] flex-col items-center gap-5 px-5 text-center sm:px-8 md:flex-row md:justify-between md:text-left">
        <div class="flex flex-col items-center gap-3 md:flex-row">
          <Mascot variant="happy" class="w-8" />
          <p class="text-[15px] text-muted">
            Moblin is free and open source. Made by Erik Moqvist and the Moblin community.
          </p>
        </div>
        <nav class="flex gap-7" aria-label="Footer">
          {footerLinks.map((l) => (
            <a
              href={l.href}
              target="_blank"
              rel="noopener"
              class="text-[15px] font-bold text-muted hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
