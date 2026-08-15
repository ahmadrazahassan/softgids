import { cn } from "@/lib/utils";

/**
 * Sage sponsored ad units, served through the Impact affiliate network
 * (partner 7483506, campaign 34654). These are third party ad creatives, so
 * they are rendered with plain <img>/<iframe> rather than next/image, and each
 * one carries rel="sponsored" plus a visible "Sponsored" label so the
 * placement is disclosed per the FTC endorsement guides and our own
 * /affiliate-disclosure page.
 *
 * Formats map 1:1 to the creatives in the Impact asset library:
 *   leaderboard  320 x 50    (mobile / inline strip)
 *   billboard    970 x 250   (in content banner, scales down responsively)
 *   halfpage     300 x 600   (sidebar skyscraper)
 *   video       1080 x 1920  (vertical video, 9:16)
 */

const PARTNER = "7483506";
const CAMPAIGN = "34654";

export type AdFormat = "leaderboard" | "billboard" | "halfpage" | "video";

const DISPLAY: Record<
  Exclude<AdFormat, "video">,
  { id: string; w: number; h: number; label: string }
> = {
  leaderboard: { id: "3997319", w: 320, h: 50, label: "Sage Accounting" },
  billboard: { id: "3067398", w: 970, h: 250, label: "Sage" },
  halfpage: { id: "3997318", w: 300, h: 600, label: "Sage Accounting" },
};

const VIDEO = { id: "3997706", w: 1080, h: 1920 };

export function SponsoredAd({
  format = "billboard",
  className,
}: {
  format?: AdFormat;
  className?: string;
}) {
  return (
    <aside
      aria-label="Sponsored"
      className={cn("mx-auto w-fit max-w-full text-center", className)}
    >
      <p className="mb-1.5 text-[0.65rem] font-semibold tracking-widest text-muted-foreground/70 uppercase">
        Sponsored
      </p>
      {format === "video" ? <VideoUnit /> : <DisplayUnit format={format} />}
    </aside>
  );
}

function DisplayUnit({ format }: { format: Exclude<AdFormat, "video"> }) {
  const { id, w, h, label } = DISPLAY[format];
  return (
    <a
      rel="sponsored noopener noreferrer"
      target="_blank"
      href={`https://sagesouthafrica.pxf.io/c/${PARTNER}/${id}/${CAMPAIGN}`}
      aria-label={`${label}, sponsored`}
      className="block"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://a.impactradius-go.com/display-ad/${CAMPAIGN}-${id}`}
        alt={label}
        width={w}
        height={h}
        loading="lazy"
        className="h-auto max-w-full"
        style={{ aspectRatio: `${w} / ${h}` }}
      />
      {/* impression tracking pixel */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://imp.pxf.io/i/${PARTNER}/${id}/${CAMPAIGN}`}
        alt=""
        width={0}
        height={0}
        aria-hidden="true"
        style={{ position: "absolute", visibility: "hidden" }}
      />
    </a>
  );
}

function VideoUnit() {
  const { id, w, h } = VIDEO;
  return (
    <div
      className="relative mx-auto w-full max-w-[300px] overflow-hidden rounded-2xl"
      style={{ aspectRatio: `${w} / ${h}` }}
    >
      <iframe
        src={`https://a.impactradius-go.com/gen-ad-code/${PARTNER}/${id}/${CAMPAIGN}/`}
        title="Sage, sponsored video"
        loading="lazy"
        scrolling="no"
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}
