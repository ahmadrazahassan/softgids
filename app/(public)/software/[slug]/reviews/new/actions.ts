"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_REVIEWER_COUNTRY, REVIEWER_COUNTRIES } from "@/lib/site";
import type { FormActionState } from "@/app/(public)/newsletter/actions";

function ratingField(formData: FormData, name: string, required = false): number | null {
  const raw = Number(formData.get(name));
  if (!raw || Number.isNaN(raw)) return required ? NaN : null;
  if (raw < 1 || raw > 5) return NaN;
  return Math.round(raw);
}

/**
 * Verified review submission. Validates every dimension; the database
 * ratings trigger recalculates product aggregates on insert (Phase 2).
 */
export async function submitReview(
  _prev: FormActionState | null,
  formData: FormData
): Promise<FormActionState> {
  const softwareId = String(formData.get("software_id") ?? "").trim();
  const reviewerName = String(formData.get("reviewer_name") ?? "").trim();
  const reviewTitle = String(formData.get("review_title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const country = String(formData.get("reviewer_country") ?? DEFAULT_REVIEWER_COUNTRY);

  const overall = ratingField(formData, "overall_rating", true);
  const dimensions = {
    ease_of_use: ratingField(formData, "ease_of_use"),
    value_for_money: ratingField(formData, "value_for_money"),
    customer_service: ratingField(formData, "customer_service"),
    functionality: ratingField(formData, "functionality"),
  };

  if (!softwareId) return { ok: false, message: "Missing software reference." };
  if (reviewerName.length < 2 || reviewerName.length > 120) {
    return { ok: false, message: "Please enter your name." };
  }
  if (reviewTitle.length < 5 || reviewTitle.length > 160) {
    return { ok: false, message: "Please give your review a title (5–160 characters)." };
  }
  if (summary.length < 30 || summary.length > 4000) {
    return {
      ok: false,
      message: "Please write a summary of at least 30 characters — detail helps other buyers.",
    };
  }
  if (overall === null || Number.isNaN(overall)) {
    return { ok: false, message: "Please select an overall star rating." };
  }
  if (Object.values(dimensions).some((v) => v !== null && Number.isNaN(v))) {
    return { ok: false, message: "Ratings must be between 1 and 5 stars." };
  }
  if (!REVIEWER_COUNTRIES.includes(country as (typeof REVIEWER_COUNTRIES)[number])) {
    return { ok: false, message: "Please choose your country from the list." };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      message:
        "Preview mode: the database isn't connected yet, so your review wasn't saved.",
    };
  }

  const { data: software } = await admin
    .from("software")
    .select("id, slug")
    .eq("id", softwareId)
    .eq("status", "published")
    .maybeSingle();
  if (!software) {
    return { ok: false, message: "We couldn't find that product. Please refresh and try again." };
  }

  const optional = (name: string, max = 2000) => {
    const value = String(formData.get(name) ?? "").trim();
    return value ? value.slice(0, max) : null;
  };

  // The update_software_ratings() trigger recomputes the product aggregates.
  const { error } = await admin.from("reviews").insert({
    software_id: software.id,
    reviewer_name: reviewerName,
    reviewer_job_title: optional("reviewer_job_title", 120),
    reviewer_company: optional("reviewer_company", 160),
    reviewer_industry: optional("reviewer_industry", 120),
    reviewer_company_size: optional("reviewer_company_size", 60),
    reviewer_country: country,
    used_for_duration: optional("used_for_duration", 60),
    overall_rating: overall,
    ease_of_use: dimensions.ease_of_use,
    value_for_money: dimensions.value_for_money,
    customer_service: dimensions.customer_service,
    functionality: dimensions.functionality,
    review_title: reviewTitle,
    summary,
    pros: optional("pros"),
    cons: optional("cons"),
    status: "published",
  });
  if (error) {
    return { ok: false, message: "Something went wrong saving your review. Please try again." };
  }

  revalidatePath(`/software/${software.slug}`);
  revalidatePath(`/software/${software.slug}/reviews`);

  return {
    ok: true,
    message: "Thank you! Your review has been submitted.",
  };
}
