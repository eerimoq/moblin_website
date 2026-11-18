import type { JSX } from "solid-js";
import Footer from "../components/Footer";
import Nav from "../components/Nav";
import { links } from "../data/links";

function Section(props: { title: string; children: JSX.Element }) {
  return (
    <section class="flex flex-col gap-3">
      <h2 class="text-[23px] font-semibold">{props.title}</h2>
      {props.children}
    </section>
  );
}

function Link(props: { href: string; children: JSX.Element }) {
  return (
    <a href={props.href} target="_blank" rel="noopener" class="text-leaf hover:text-leaf-bright">
      {props.children}
    </a>
  );
}

export default function Privacy() {
  return (
    <>
      <Nav />
      <main>
        <article class="mx-auto flex max-w-[760px] flex-col gap-10 px-5 pt-12 pb-20 text-ink-2 sm:px-8 lg:pt-18 [&_li]:ml-5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2">
          <header class="flex flex-col gap-4">
            <span class="font-display text-[15px] font-semibold uppercase tracking-[0.08em] text-leaf">
              moblin.app
            </span>
            <h1 class="text-[40px] leading-[1.05] font-bold text-balance text-ink sm:text-6xl">
              Privacy policy
            </h1>
            <p class="text-[15px] text-muted">Last updated 18 November 2026.</p>
            <p>
              This policy covers the website moblin.app, its pages and the backend at api.moblin.app
              that the website and the Moblin app talk to. The Moblin app itself has its{" "}
              <Link href={links.appPrivacyPolicy}>own privacy policy</Link>, and Moblin Cloud at
              cloud.moblin.app has its own as well.
            </p>
          </header>

          <Section title="Who is responsible">
            <p>
              The controller of the personal data described here is Erik Moqvist, Sweden, who
              develops Moblin as an individual ("we", "us"). See{" "}
              <a href="#contact" class="text-leaf hover:text-leaf-bright">
                Contact
              </a>{" "}
              below for how to reach us.
            </p>
          </Section>

          <Section title="In short">
            <ul>
              <li>No cookies, no analytics, no advertising and no tracking of any kind.</li>
              <li>No accounts and no forms; we never ask you for any information.</li>
              <li>
                The site's fonts, scripts and own images are served from moblin.app itself, with no
                requests to Google Fonts or any other font or script service.
              </li>
              <li>
                Like every website, the servers that deliver it see your IP address. That is the
                only personal data of visitors we process, and we do not use it to identify you.
              </li>
            </ul>
          </Section>

          <Section title="Hosting on GitHub Pages">
            <p>
              The website is a static site hosted on GitHub Pages by GitHub, Inc., 88 Colin P Kelly
              Jr St, San Francisco, CA 94107, USA. When you open a page, your browser sends GitHub
              the usual request data: your IP address, the address of the page, the time, and your
              browser's user agent and referrer. GitHub keeps this in its server logs to deliver the
              site and to keep it secure, and we have no access to those logs. See the{" "}
              <Link href="https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement">
                GitHub General Privacy Statement
              </Link>
              .
            </p>
          </Section>

          <Section title="The backend at api.moblin.app">
            <p>
              api.moblin.app is a small service of our own, reached through Cloudflare, Inc., 101
              Townsend St, San Francisco, CA 94107, USA, which protects it and passes the requests
              on. Cloudflare processes the request data, including your IP address, on our behalf to
              deliver and protect the service. See the{" "}
              <Link href="https://www.cloudflare.com/privacypolicy/">
                Cloudflare privacy policy
              </Link>
              .
            </p>
            <p>The backend does the following and nothing else:</p>
            <ul>
              <li>
                On the home page, your browser asks it for the list of streamers and, every five
                minutes while the page is visible, whether Moblin's developer is live on Twitch.
                These requests carry no information about you beyond the request data above. The
                backend does not log IP addresses or keep any record of visitors.
              </li>
              <li>
                It keeps the list of streamers shown on the home page. A streamer appears there only
                after turning on Settings → Streams → (stream) → Go live notification → Moblin
                website in the Moblin app. When such a stream goes live, the app sends the stream's
                channel names (platform and name). Before accepting them, the backend checks with
                Apple App Attest that they come from the real Moblin app; the attestation is checked
                and thrown away, not stored.
              </li>
              <li>
                For each listed channel it looks up the public display name and profile image, and
                whether the channel is live with its category, title and preview image, from Twitch,
                YouTube, Kick and, for some YouTube profile images, unavatar.io. It asks Moblin
                Cloud whether the streamer has a tip page. Only the public channel names are sent in
                these lookups, by the backend, not by your browser.
              </li>
              <li>
                Only the most recent streamers are kept, plus older ones while they are still live.
                A streamer pushed off the list by newer ones is deleted from the backend's database.
                Turning the setting off in the app stops new posts; to be removed right away,
                contact us.
              </li>
            </ul>
          </Section>

          <Section title="Images from streaming platforms">
            <p>
              Most images are served from moblin.app itself. Two parts of the home page show images
              that your browser loads directly from other services, which then see your IP address
              and browser's user agent:
            </p>
            <ul>
              <li>
                The streamers' profile and live preview images, from the platform the channel is on
                (Twitch, YouTube, Kick or unavatar.io), and Moblin's icon on a streamer's tip page
                link from Moblin Cloud. They are requested without a referrer.
              </li>
              <li>
                The video previews in the Videos section, from YouTube (Google Ireland Limited,
                Gordon House, Barrow Street, Dublin 4, Ireland). See the{" "}
                <Link href="https://policies.google.com/privacy">Google Privacy Policy</Link>.
              </li>
            </ul>
            <p>
              Links to YouTube, Twitch, Kick, Discord, GitHub, the App Store, PayPal and other sites
              contact those sites only when you follow them, and their own privacy policies apply
              there.
            </p>
          </Section>

          <Section title="Cookies and local storage">
            <p>
              The website sets no cookies. When you pick a language in the footer, the choice is
              saved in your browser's local storage so the next page opens in that language. It
              never leaves your browser, and you can remove it by clearing the site's data.
            </p>
          </Section>

          <Section title="Legal basis">
            <p>
              We process the data above on the basis of our legitimate interest under Art. 6(1)(f)
              GDPR: to deliver the website and the backend reliably and securely, to show which
              streamers use Moblin after they have chosen to be shown, and to present Moblin with
              its videos. Saving your language choice is something you ask for yourself, and the
              site works without it.
            </p>
          </Section>

          <Section title="Transfers outside the EU">
            <p>
              GitHub and Cloudflare are based in the USA and may process the request data there.
              Both are certified under the EU-U.S. Data Privacy Framework, on which the European
              Commission has based an adequacy decision for transfers to certified companies.
            </p>
          </Section>

          <Section title="Your rights">
            <p>
              Under the GDPR you have the right to access the personal data we hold about you, and
              to have it corrected, deleted or its processing restricted. You have the right to
              object at any time to processing based on legitimate interest, for reasons arising
              from your particular situation. Since we keep no data about visitors, there is in
              practice nothing we can look up or delete for a visitor; a streamer can ask us to
              remove their channels from the list at any time.
            </p>
            <p>
              You also have the right to lodge a complaint with a supervisory authority, in Sweden
              the{" "}
              <Link href="https://www.imy.se/en/">
                Swedish Authority for Privacy Protection (IMY)
              </Link>
              , or the authority where you live or work.
            </p>
          </Section>

          <Section title="Changes">
            <p>
              We update this policy when the website changes in ways that affect your data. The date
              at the top shows when it last changed.
            </p>
          </Section>

          <section id="contact" class="flex flex-col gap-3">
            <h2 class="text-[23px] font-semibold">Contact</h2>
            <p>Questions about this policy, or requests about your data:</p>
            <ul>
              <li>
                Email:{" "}
                <a href="mailto:erik.moqvist@gmail.com" class="text-leaf hover:text-leaf-bright">
                  erik.moqvist@gmail.com
                </a>
              </li>
              <li>
                Discord: <Link href={links.discord}>{links.discord}</Link>
              </li>
            </ul>
            <p>Erik Moqvist, Sweden.</p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
