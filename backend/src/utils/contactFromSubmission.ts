export type FormFieldLike = { name: string; type?: string };

export type ExtractedContact = {
  email?: string;
  phone?: string;
  displayName?: string;
};

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function asTrimmedString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const s = value.trim();
  return s === '' ? undefined : s;
}

function responseString(responses: Record<string, string | string[]>, fieldName: string): string | undefined {
  const raw = responses[fieldName];
  return asTrimmedString(raw);
}

/**
 * Pull identity fields from validated submission responses using form field definitions.
 * Returns null when neither email nor phone can be determined (no contact row).
 */
export function extractContactFromSubmission(
  fields: FormFieldLike[] | null | undefined,
  responses: Record<string, string | string[]>,
): ExtractedContact | null {
  if (!Array.isArray(fields) || fields.length === 0) {
    return null;
  }

  let email: string | undefined;
  for (const f of fields) {
    if (!f || typeof f.name !== 'string') continue;
    if (f.type === 'email') {
      const s = responseString(responses, f.name);
      if (s) {
        email = normalizeEmail(s);
        break;
      }
    }
  }
  if (!email) {
    for (const f of fields) {
      if (!f || typeof f.name !== 'string') continue;
      if (f.name === 'email') {
        const s = responseString(responses, f.name);
        if (s) {
          email = normalizeEmail(s);
          break;
        }
      }
    }
  }

  let phone: string | undefined;
  for (const f of fields) {
    if (!f || typeof f.name !== 'string') continue;
    if (f.type === 'phone') {
      const s = responseString(responses, f.name);
      if (s) {
        phone = normalizePhone(s);
        break;
      }
    }
  }
  if (!phone) {
    for (const name of ['phone', 'mobile', 'tel'] as const) {
      const hit = fields.find((f) => f && f.name === name);
      if (!hit) continue;
      const s = responseString(responses, hit.name);
      if (s) {
        phone = normalizePhone(s);
        break;
      }
    }
  }

  let displayName: string | undefined;
  for (const f of fields) {
    if (!f || typeof f.name !== 'string') continue;
    if (f.type === 'name') {
      const s = responseString(responses, f.name);
      if (s) {
        displayName = s;
        break;
      }
    }
  }
  if (!displayName) {
    for (const name of ['name', 'full_name', 'fullname'] as const) {
      const hit = fields.find((f) => f && f.name === name);
      if (!hit) continue;
      const s = responseString(responses, hit.name);
      if (s) {
        displayName = s;
        break;
      }
    }
  }

  if (!email && !phone) {
    return null;
  }

  const out: ExtractedContact = {};
  if (email) out.email = email;
  if (phone) out.phone = phone;
  if (displayName) out.displayName = displayName;
  return out;
}
