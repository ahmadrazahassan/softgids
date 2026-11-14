import { AdLabel } from "@/components/public/AdLabel";
import { AffiliateLink } from "@/components/public/AffiliateLink";
import {
  AFFILIATE_BANNERS,
  AFFILIATE_VIDEO_ADS,
  DEFAULT_VIDEO_AD,
  bannerImageSrc,
  bannerLink,
  placementId,
  videoAdSrc,
  type BannerFormat,
  type VideoAdName,
} from "@/lib/affiliate";
import { cn } from "@/lib/utils";

/**
 * Sage display creatives from the Impact asset library.
 *
 * Each format uses its own official click link and its own hosted image,
 * unchanged — the creative IDs, dimensions and URLs all live in
 * lib/affiliate.ts. The wrapper anchor is an AffiliateLink like any text CTA,
 * so it inherits `sponsored noopener` and the strict-origin referrer policy
 * and shows up in the post-build scan.
 *
 * Third-party creatives, so plain <img> rather than next/image: the bytes come
 * from Impact's CDN and must not be re-encoded or re-hosted.
 *
 * There is deliberately no impression pixel. The previous version loaded a
 * hidden 0x0 image at imp.pxf.io inside the anchor, which is both redundant
 * (Impact counts the display-ad request already) and indistinguishable from
 * the hidden-tracker pattern networks treat as cookie stuffing.
 */
export type AdFormat = BannerFormat | "video";

export function SponsoredAd({
  format = "billboard",
  video = DEFAULT_VIDEO_AD,
  slot,
  slug,
  className,
}: {
  /**
   * The IAB ad unit to serve. Pick the one that fits the slot — the catalogue
   * in lib/affiliate.ts carries 320x50, 728x90, 970x250, 300x250, 300x600,
   * 160x600 and 120x600, plus "video" for the 9:16 unit.
   */
  format?: AdFormat;
  /** Which video creative, when `format` is "video". */
  video?: VideoAdName;
  /** Where this unit sits, for the placement ID — e.g. "software-billboard". */
  slot: string;
  /** The product page it sits on, so reporting can attribute the banner. */
  slug?: string | null;
  className?: string;
}) {
  return (
    <aside
      aria-label="Sponsored"
      className={cn("mx-auto w-fit max-w-full text-center", className)}
    >
      <AdLabel className="mb-1.5 block" />
      {format === "video" ? (
        <VideoUnit video={video} />
      ) : (
        <DisplayUnit format={format} slot={slot} slug={slug} />
      )}
    </aside>
  );
}

function DisplayUnit({
  format,
  slot,
  slug,
}: {
  format: BannerFormat;
  slot: string;
  slug?: string | null;
}) {
  const { w, h, alt } = AFFILIATE_BANNERS[format];
  const link = bannerLink(format, placementId(slot, slug));

  return (
    <AffiliateLink link={link} action={`${alt} offer`} className="block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bannerImageSrc(format)}
        alt={alt}
        width={w}
        height={h}
        loading="lazy"
        className="h-auto max-w-full"
        style={{ aspectRatio: `${w} / ${h}` }}
      />
    </AffiliateLink>
  );
}

/**
 * Impact's own ad-code iframe. It renders the creative and handles its own
 * click-out, so there is no anchor of ours to attach a placement ID to —
 * conversions from this unit land in Impact under the campaign, not a sub ID.
 */
function VideoUnit({ video }: { video: VideoAdName }) {
  const { w, h, title } = AFFILIATE_VIDEO_ADS[video];
  return (
    <div
      className="relative mx-auto w-full max-w-[300px] overflow-hidden rounded-2xl"
      style={{ aspectRatio: `${w} / ${h}` }}
    >
      <iframe
        src={videoAdSrc(video)}
        title={`Sponsored: Sage, ${title}`}
        loading="lazy"
        scrolling="no"
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}
