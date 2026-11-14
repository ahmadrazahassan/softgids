import type { Page } from "@/lib/types";

/**
 * Legal & policy pages, rendered inside `.legal-content`.
 * All compliance copy references POPIA and the Information Regulator
 * (South Africa) — never UK GDPR/PECR/ICO. Prose is written in plain,
 * human language and deliberately avoids dashes and hyphenated connectors.
 */

function pg(seed: Pick<Page, "id" | "slug" | "title" | "content"> & Partial<Page>): Page {
  return { status: "published", updated_at: "2026-07-15T08:00:00.000Z", ...seed };
}

export const placeholderPages: Page[] = [
  pg({
    id: "page-privacy",
    slug: "privacy-policy",
    title: "Privacy Policy",
    content: `<p>SoftGids is an independent platform where South African businesses read and write honest reviews of the software they run every day. This policy sets out what we collect, why we collect it, and how we look after it under the Protection of Personal Information Act, 2013, which most people know as POPIA.</p>
<p>We have written it in plain language on purpose. If anything here is unclear, email us and a real person will explain it properly.</p>
<h2>Who we are</h2>
<p>SoftGids operates softgids.co.za and is the responsible party for the personal information handled through this website. You can reach us at <a href="mailto:hello@softgids.co.za">hello@softgids.co.za</a> or write to us at our offices in Cape Town.</p>
<h2>The information we collect</h2>
<ul>
<li><strong>Reviews you publish.</strong> Your name, your job title, the company you work for and the words of your review. You decide what to share, and you choose to make it public.</li>
<li><strong>Newsletter sign ups.</strong> Your email address, the topics you care about, and a simple record of your consent that notes when you subscribed and the page you subscribed from.</li>
<li><strong>Messages you send us.</strong> Your name, your email address and whatever you write to us.</li>
<li><strong>How the site is used.</strong> Quiet, aggregated analytics that show us which pages actually help people. When you click through to a vendor, we log the click against a scrambled version of your IP address. We never keep the real one.</li>
</ul>
<h2>Why we use it</h2>
<p>We use your information to publish the reviews you submit, to send the newsletter you asked for, to reply to your messages, to learn which recommendations are genuinely useful, and to meet our legal duties. Where we rely on your consent, as we do for the newsletter, you are free to change your mind whenever you like.</p>
<h2>Marketing you actually agreed to</h2>
<p>In keeping with section 69 of POPIA, we only send marketing email to people who have asked to receive it. We confirm every subscription by email first, we keep a record of that consent, and every newsletter carries a one click way to leave. No hard feelings if you do.</p>
<h2>The partners who help us run the site</h2>
<p>We rely on a small number of trusted providers for hosting, our database and email delivery. Under POPIA these are our operators. They only ever handle your information on our instructions, and they may not use it for their own ends. We do not sell your personal information to anyone, and we never will.</p>
<h2>Affiliate links and the advertising network</h2>
<p>Some of the links and banners on this site are affiliate links. We run them through impact.com, the affiliate network that administers the Sage programme on our behalf. Every one of them is marked "Sponsored" where you can see it, and our <a href="/affiliate-disclosure">Affiliate Disclosure</a> sets out the arrangement in full.</p>
<p>When you click one of those links your browser goes to impact.com first, and then on to the vendor. At that moment your browser hands impact.com three things:</p>
<ul>
<li><strong>Your IP address</strong>, together with your browser and device details, exactly as it would for any website you visit.</li>
<li><strong>Our domain name</strong>, softgids.co.za, as the referring site. We send only the domain. We do not send the address of the page you were reading, or anything you typed into the search box.</li>
<li><strong>A placement code</strong>, a short label such as "software-hero-sage-accounting", which tells us which button or banner you used. It describes a spot on a page and says nothing about you.</li>
</ul>
<p>impact.com may set a cookie in your browser at that point, so that the vendor can credit the referral if you go on to buy. That cookie is theirs, set under their own privacy policy, and we cannot read it.</p>
<p>The sponsored banners are images served from impact.com's own servers, which means your IP address reaches them whenever a page carrying one loads, whether or not you click it. Beyond those banner images we place no separate tracking or impression pixels of our own.</p>
<h2>Information that leaves South Africa</h2>
<p>Some of our providers store data on servers outside the country. Where that happens, we make sure the information is protected by laws or binding agreements that offer a standard of care comparable to POPIA, as section 72 requires.</p>
<h2>Keeping it safe, and letting it go</h2>
<p>We protect personal information with security measures that are reasonable and appropriate for the kind of data we hold. We keep it only for as long as we genuinely need it for the reasons above, or for as long as the law tells us to, and then we remove it.</p>
<h2>Your rights</h2>
<p>POPIA gives you real control. You may ask to see the information we hold about you, to correct it, or to have it deleted, and you may object to the way we use it. Email <a href="mailto:hello@softgids.co.za">hello@softgids.co.za</a> and we will come back to you within a reasonable time. If you feel we have let you down, you may also complain to the Information Regulator of South Africa at <a href="https://inforegulator.org.za" rel="nofollow">inforegulator.org.za</a>.</p>
<h2>Updates to this policy</h2>
<p>We will refresh this page whenever our practices change. When a change is significant, we will say so clearly and show a new effective date at the top.</p>`,
  }),
  pg({
    id: "page-cookies",
    slug: "cookie-policy",
    title: "Cookie Policy",
    content: `<p>This page explains how softgids.co.za uses cookies and similar technology, and it sits comfortably alongside our commitments under the Protection of Personal Information Act, 2013.</p>
<h2>What a cookie is</h2>
<p>A cookie is a small text file that your browser keeps on your device. It lets a website remember simple things about you, such as whether you prefer a light or dark screen, and it helps us see which pages people find useful.</p>
<h2>The cookies we set</h2>
<table>
<tr><th>Type</th><th>What it does</th><th>How long it lasts</th></tr>
<tr><td>Essential</td><td>Remembers your theme choice and keeps the basics of the site working</td><td>Up to twelve months</td></tr>
<tr><td>Analytics</td><td>Measures how the site is used, in a way that stays aggregated and respectful of your privacy</td><td>The length of your visit</td></tr>
</table>
<p>We do not run advertising cookies, and we do not follow you around other websites. That is a deliberate choice.</p>
<h2>Affiliate links</h2>
<p>When you follow a link to a software vendor, we record that click on our own server against a scrambled version of your IP address, purely so we can report on it in aggregate. Sponsored links pass through impact.com, our affiliate network, which may set a cookie of its own so the vendor can credit the referral. Once you land on the vendor site, that company may also set its own cookies. Both sit under their own policies and are outside our control. The <a href="/privacy-policy">Privacy Policy</a> spells out what your browser sends them.</p>
<h2>Staying in charge</h2>
<p>You can clear or block cookies at any time in your browser settings. Do bear in mind that blocking the essential ones may switch off small conveniences, such as remembering the theme you like.</p>
<h2>Talk to us</h2>
<p>Any questions are welcome at <a href="mailto:hello@softgids.co.za">hello@softgids.co.za</a>. You are also free to raise a concern with the Information Regulator of South Africa about the way we handle personal information.</p>`,
  }),
  pg({
    id: "page-terms",
    slug: "terms",
    title: "Terms of Use",
    content: `<p>Thank you for using SoftGids. These terms are the agreement between you and us when you visit softgids.co.za. By using the site you accept them, so please take a moment to read them through.</p>
<h2>What SoftGids is</h2>
<p>We publish independent reviews, ratings and comparisons of business software for the South African market. Everything here is general information meant to help you make a better decision. It is not financial, legal or tax advice. Always confirm pricing and features with the vendor before you buy, and speak to a registered tax practitioner about anything that touches your SARS obligations.</p>
<h2>The reviews you write</h2>
<ul>
<li>Write only about software you have genuinely used.</li>
<li>Give us your honest opinion. Your review must be truthful, and it must not be defamatory, misleading or unlawful.</li>
<li>By posting a review, you allow us to publish it, keep it on the site and moderate it.</li>
<li>We may decline or take down a review that falls short of our editorial standards.</li>
</ul>
<h2>How we make money</h2>
<p>Some of the outbound links on the site are affiliate links, which means we may earn a commission when you buy through them. It never costs you a cent more, and it never changes a rating or a ranking. You can read the full story in our <a href="/affiliate-disclosure">Affiliate Disclosure</a> and <a href="/editorial-policy">Editorial Policy</a>.</p>
<h2>Who owns what</h2>
<p>The content on this site belongs to SoftGids or is licensed to us. Vendor names and logos belong to the companies behind them and appear here only so you can recognise the products we write about.</p>
<h2>Using the site fairly</h2>
<p>Please do not harvest the site at scale, post fake reviews, try to break its security, or use it to spread spam or malware. In short, treat it the way you would want your own work treated.</p>
<h2>Where we stand on liability</h2>
<p>As far as South African law allows, including the Consumer Protection Act where it applies, we cannot be held responsible for the decisions you make based on what you read here, or for products you buy from other companies through our links.</p>
<h2>The law that applies</h2>
<p>These terms are governed by the law of the Republic of South Africa, and the South African courts have jurisdiction over any dispute that arises from them.</p>
<h2>Reach us</h2>
<p>If anything here needs explaining, email <a href="mailto:hello@softgids.co.za">hello@softgids.co.za</a> and a real person will answer.</p>`,
  }),
  pg({
    id: "page-affiliate",
    slug: "affiliate-disclosure",
    title: "Affiliate Disclosure",
    content: `<p>We would rather be plain with you than clever about it, so here is exactly how SoftGids pays its way.</p>
<h2>How we earn</h2>
<p>When you follow a link from our site to a software vendor and go on to buy, we may receive a referral commission. The vendor pays the commission, and it never adds a cent to your price.</p>
<p>Every link and banner of that kind is marked "Sponsored" where you can see it, and a screen reader announces it the same way. They are handled by impact.com, the affiliate network that administers the Sage programme for us. Clicking one lets impact.com set a cookie so the vendor can credit the referral, and it tells us which button or banner you used so we know which ones are actually useful. Our <a href="/privacy-policy">Privacy Policy</a> lists exactly what your browser passes on.</p>
<h2>What that money never buys</h2>
<ul>
<li>Ratings. Every star rating is worked out automatically from verified user reviews, and nothing else.</li>
<li>Rankings. The order of the directory follows review data and honest editorial judgement, not who pays the most.</li>
<li>Verdicts. The people who write our comparisons never see the commercial terms behind a product.</li>
</ul>
<h2>Products that pay us nothing</h2>
<p>We review software whether or not there is a commission on the table. Plenty of the products in our directory earn us nothing at all, and we assess them in precisely the same way as the rest.</p>
<h2>Why we run it this way</h2>
<p>Affiliate income keeps the platform free for the South African businesses that rely on it, with no paywalls and no sponsored placements dressed up as advice. If you would rather not use an affiliate link, you can always go straight to a vendor and type their address yourself.</p>
<h2>Ask us anything</h2>
<p>We are happy to talk about our commercial relationships. Email <a href="mailto:hello@softgids.co.za">hello@softgids.co.za</a>.</p>`,
  }),
  pg({
    id: "page-editorial",
    slug: "editorial-policy",
    title: "Editorial Policy",
    content: `<p>SoftGids exists to give South African businesses software advice they can trust. This policy explains how we research, write and look after everything we publish.</p>
<h2>Independence we protect</h2>
<p>We keep our editorial side and our commercial side apart. The writers and analysts do not know which vendors pay us, or how much. No vendor can buy a place in the rankings, a better rating or a kinder verdict. That line does not move.</p>
<h2>How we judge software</h2>
<ul>
<li>We put products to work against the things that matter here at home, from preparing a VAT201 and filing on SARS eFiling to EMP201 and EMP501 support, UIF automation, IRP5 certificates, POPIA readiness and honest pricing in rand.</li>
<li>We lean on verified reviews from businesses across South Africa and the region, and those reviews drive the published star ratings on their own.</li>
<li>We research the wider picture too, including price, the quality of support and how stable the vendor is.</li>
</ul>
<h2>The standards behind every review</h2>
<p>We check that reviewers are real users wherever we can, we turn away reviews that are paid for or written by the vendor, and we never change the substance of someone's opinion. Vendors are welcome to reply to a review in public.</p>
<h2>Corrections and updates</h2>
<p>Software moves quickly, so we revisit pricing and features on a rolling basis and we date every update. If you spot something wrong, email <a href="mailto:hello@softgids.co.za">hello@softgids.co.za</a> and we will look into it straight away.</p>
<h2>Where AI fits in</h2>
<p>We sometimes use AI tools to help with research and early drafts. Every published assessment is then read, checked and approved by a human editor who is accountable for getting it right.</p>`,
  }),
  pg({
    id: "page-accessibility",
    slug: "accessibility",
    title: "Accessibility Statement",
    content: `<p>SoftGids should be usable by everyone, including people who browse with a screen reader, a keyboard, or any other assistive technology. We take that seriously, and this page is an honest account of where we stand.</p>
<h2>The standard we aim for</h2>
<p>We build towards the Web Content Accessibility Guidelines, version 2.2, at level AA. It is the benchmark we hold ourselves to as the site keeps growing.</p>
<h2>What we have already built in</h2>
<ul>
<li>Clean, semantic structure and a sensible heading order on every page, so the shape of a page makes sense out loud as well as on screen.</li>
<li>Full keyboard control. Menus, dialogs and the search overlay all work without a mouse, and the Escape key closes anything that opens over the page.</li>
<li>Focus you can actually see, so you always know where you are as you move through a page.</li>
<li>Text descriptions on meaningful images, and clear labels on buttons that show only an icon.</li>
<li>Colour contrast that meets level AA in both the light and dark themes.</li>
<li>Respect for people who prefer less movement. If your device asks for reduced motion, our animations step aside.</li>
</ul>
<h2>Where we still have work to do</h2>
<ul>
<li>A few of our charts tell their story visually. We place a written summary beside them, and we are steadily improving how they read to a screen reader.</li>
<li>The vendor websites we link out to are built by other people and sit outside our control.</li>
</ul>
<h2>Tell us when we fall short</h2>
<p>If something on this site gets in your way, we want to hear about it. Email <a href="mailto:hello@softgids.co.za">hello@softgids.co.za</a>. We aim to reply within five business days and to fix anything we can confirm as quickly as we are able.</p>`,
  }),
];
