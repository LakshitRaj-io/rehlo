"use server";

import type { StudentEnquiry } from "@/types";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPublishedListings } from "@/lib/db/queries";
import { toRow } from "@/lib/db/rows";
import { createUploadTicket, type UploadTicket } from "@/lib/db/uploads";
import { buildCallback, buildEnquiry, buildServiceRequest, buildVacancyDraft } from "@/lib/records";
import { FALLBACK_IMAGE, type MediaKind } from "@/lib/media";
import {
  callbackFormSchema,
  enquiryFormSchema,
  fieldErrors,
  serviceFormSchema,
  vacancyFormSchema,
  vacancyMediaSchema,
  VACANCY_MEDIA_FOLDER,
  type CallbackFormValues,
  type EnquiryFormValues,
  type ServiceFormValues,
  type VacancyFormValues,
} from "@/lib/validation";

/**
 * Public submissions. Anyone can call these, so each one re-validates with the
 * same zod schema the form uses and builds the stored record on the server.
 */
export type SubmitResult<T> = { ok: true; data: T } | { ok: false; errors: Record<string, string>; message?: string };

const FAILED = "We couldn't save that just now. Please try again in a moment.";

async function listingRef(listingId: string | null) {
  if (!listingId) return null;
  const l = (await getPublishedListings()).find((x) => x.id === listingId);
  return l ? { id: l.id, title: l.title, locality: l.locality } : null;
}

async function insertEnquiry(enquiry: StudentEnquiry): Promise<SubmitResult<StudentEnquiry>> {
  const { error } = await supabaseAdmin().from("enquiries").insert(toRow(enquiry));
  if (error) {
    console.error("insert enquiry:", error.message);
    return { ok: false, errors: {}, message: FAILED };
  }
  return { ok: true, data: enquiry };
}

export async function submitEnquiry(values: EnquiryFormValues, listingId: string | null): Promise<SubmitResult<StudentEnquiry>> {
  const parsed = enquiryFormSchema.safeParse(values);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  return insertEnquiry(buildEnquiry(parsed.data, await listingRef(listingId)));
}

export async function submitCallback(values: CallbackFormValues, listingId: string | null): Promise<SubmitResult<StudentEnquiry>> {
  const parsed = callbackFormSchema.safeParse(values);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  return insertEnquiry(buildCallback(parsed.data, await listingRef(listingId)));
}

export async function submitServiceRequest(values: ServiceFormValues): Promise<SubmitResult<{ ref: string }>> {
  const parsed = serviceFormSchema.safeParse(values);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const request = buildServiceRequest(parsed.data);
  const { error } = await supabaseAdmin().from("service_requests").insert(toRow(request));
  if (error) {
    console.error("insert service request:", error.message);
    return { ok: false, errors: {}, message: FAILED };
  }
  return { ok: true, data: { ref: request.id } };
}

/**
 * The public can only post vacancies (a room or bed free in a flat they live in).
 * It's saved unpublished; an agent verifies it before it goes live.
 */
export async function submitVacancy(
  values: VacancyFormValues,
  media: { images: string[]; videos: string[] },
): Promise<SubmitResult<{ ref: string }>> {
  const parsed = vacancyFormSchema.safeParse(values);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const files = vacancyMediaSchema.safeParse(media);
  if (!files.success) return { ok: false, errors: {}, message: "One of the uploaded files couldn't be attached. Remove it and try again." };

  const { listing, ref } = buildVacancyDraft(parsed.data, files.data, FALLBACK_IMAGE);
  const { error } = await supabaseAdmin().from("listings").insert(toRow(listing));
  if (error) {
    console.error("insert vacancy:", error.message);
    return { ok: false, errors: {}, message: FAILED };
  }
  return { ok: true, data: { ref } };
}

/** Photos and a video tour can be uploaded with a vacancy. */
export async function createVacancyUpload(kind: MediaKind, contentType: string, size: number): Promise<UploadTicket> {
  return createUploadTicket(VACANCY_MEDIA_FOLDER.replace(/\/$/, ""), kind, contentType, size);
}
