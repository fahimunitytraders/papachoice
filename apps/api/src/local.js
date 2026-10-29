import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { HttpError } from './errors.js';
import { uploadFields } from './uploads.js';

// Local development only. This module is not imported into the Lambda bundle.
export function localDependencies({ port = 3001, outbox, now = () => Date.now(), onMessage } = {}) {
  const files = new Map();
  const grants = new Map();
  const messages = [];
  return {
    config: {
      fromEmail: 'preview@example.com',
      toEmail: 'imfahim003@gmail.com',
      allowedOrigin: 'http://localhost:5173',
      mode: 'preview',
    },
    now,
    files,
    messages,
    async acceptUpload(id, form) {
      const grant = grants.get(id);
      if (
        !grant ||
        grant.expires <= now() ||
        Object.entries(grant.fields).some(([key, value]) => form.get(key) !== value)
      )
        throw new HttpError(403, 'UPLOAD_EXPIRED', 'Upload permission is invalid or expired.');
      const file = form.get('file');
      if (!file || typeof file.arrayBuffer !== 'function' || file.size !== grant.size)
        throw new HttpError(400, 'UPLOAD_INVALID', 'Invalid file.');
      files.set(id, {
        bytes: Buffer.from(await file.arrayBuffer()),
        fingerprint: grant.fields['x-amz-meta-application-hash'],
        createdAt: grant.fields['x-amz-meta-created-at'],
        expiresAt: Number(grant.fields['x-amz-meta-expires-at']),
      });
    },
    uploads: {
      async sign(ticket, expires) {
        const fields = { token: randomUUID(), ...uploadFields(ticket) };
        grants.set(ticket.id, { fields, size: ticket.proof.size, expires: now() + expires * 1000 });
        return { url: `http://localhost:${port}/local-upload/${ticket.id}`, fields };
      },
      async read(ticket) {
        if (!files.has(ticket.id))
          throw new HttpError(
            409,
            'DELIVERY_UNCONFIRMED',
            `This document is no longer available. Please contact us with reference ${ticket.reference} before submitting again.`,
          );
        return files.get(ticket.id);
      },
      async remove(ticket) {
        files.delete(ticket.id);
      },
    },
    mailer: {
      async send(message, ticket) {
        if (outbox) {
          const directory = join(outbox, ticket.id);
          await mkdir(directory, { recursive: true, mode: 0o700 });
          const simple = message.Content.Simple;
          await writeFile(join(directory, 'message.html'), simple.Body.Html.Data, { mode: 0o600 });
          await writeFile(
            join(directory, 'message.txt'),
            `From: ${message.FromEmailAddress}\nTo: ${message.Destination.ToAddresses.join(', ')}\nReply-To: ${message.ReplyToAddresses.join(', ')}\nSubject: ${simple.Subject.Data}\n\n${simple.Body.Text.Data}`,
            { mode: 0o600 },
          );
          for (const file of simple.Attachments)
            await writeFile(join(directory, file.FileName), file.RawContent, { mode: 0o600 });
        }
        await onMessage?.(message, ticket);
        messages.push(message);
        return `local-${ticket.id}`;
      },
    },
  };
}
