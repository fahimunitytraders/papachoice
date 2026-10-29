import {
  BUSINESS_FIELDS,
  DELIVERY_FIELDS,
  GUARANTOR_FIELDS,
  SIGNATORY_FIELDS,
  addressFields,
  referenceFields,
  DECLARATION_TEXT,
} from '@papas-choice/registration';
import { signatureBytes } from './attachments.js';

export const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );

export function buildEmail({ registration, proof, bytes, ticket, config }) {
  const v = registration.values;
  const rows = (fields) => fields.map(([key, label]) => [label, v[key] || 'Not provided']);
  const address = (prefix) => [
    ...rows(addressFields(prefix)),
    ...(v[`${prefix}Country`] === 'Other' ? [['Country name', v[`${prefix}OtherCountry`]]] : []),
  ];
  const sections = [
    [
      'Submission',
      [
        ['Reference', ticket.reference],
        ['Submitted at (UTC)', ticket.createdAt],
      ],
    ],
    ['Business and contact', rows(BUSINESS_FIELDS)],
    ['Business address', address('account')],
    [
      'Delivery',
      [
        [
          'Different delivery address',
          registration.differentDelivery ? 'Yes' : 'No, use business address',
        ],
        ...address(registration.differentDelivery ? 'delivery' : 'account'),
        ...rows(DELIVERY_FIELDS),
      ],
    ],
    ...[1, 2].map((n) => [
      `Trade reference ${n}`,
      [
        ...rows(referenceFields(n)),
        ...(v[`ref${n}Country`] === 'Other' ? [['Country name', v[`ref${n}OtherCountry`]]] : []),
      ],
    ]),
    [
      'Supporting document',
      [
        ['Original filename', proof.name],
        ['File type', proof.type],
        ['File size (bytes)', String(proof.size)],
      ],
    ],
    [
      'Guarantor',
      [
        ['Included', registration.includeGuarantor ? 'Yes' : 'No'],
        ...(registration.includeGuarantor ? rows(GUARANTOR_FIELDS) : []),
      ],
    ],
    [
      'Declaration and signatures',
      [
        ...rows(SIGNATORY_FIELDS),
        [
          'Drawn signature',
          registration.signatureDataUrl ? 'Attached as signature.png' : 'Not provided',
        ],
        ['Declaration accepted', 'Yes'],
        ['Declaration version', registration.declarationVersion],
        ['Declaration text', DECLARATION_TEXT],
      ],
    ],
  ];
  const introduction =
    'A new registration application has been submitted through the Papa’s Choice website. Review it and reply to the applicant to follow up. This submission does not approve an account or grant credit.';
  const text = `${introduction}\n\n${sections.map(([title, entries]) => `${title}\n${entries.map(([label, value]) => `${label}: ${value}`).join('\n')}`).join('\n\n')}`;
  const html = `<!doctype html><html><body style="margin:0;background:#f5f0e9;font-family:Arial,sans-serif;color:#26241f"><main style="max-width:700px;margin:24px auto;background:#fff;padding:32px"><p style="color:#8b2523;font-size:14px">PAPA’S CHOICE</p><h1 style="font-size:26px">New registration application</h1><p>${escapeHtml(introduction)}</p>${sections.map(([title, entries]) => `<h2 style="margin-top:28px;font-size:18px">${escapeHtml(title)}</h2><table style="width:100%;border-collapse:collapse">${entries.map(([label, value]) => `<tr><th scope="row" style="text-align:left;vertical-align:top;padding:10px;border-bottom:1px solid #eee;width:38%">${escapeHtml(label)}</th><td style="padding:10px;border-bottom:1px solid #eee;white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(value)}</td></tr>`).join('')}</table>`).join('')}<p style="margin-top:28px;font-size:12px;color:#716b63">This email contains application information. Share it only with staff reviewing this application.</p></main></body></html>`;
  const signature = signatureBytes(registration.signatureDataUrl);
  return {
    FromEmailAddress: config.fromEmail,
    Destination: { ToAddresses: [config.toEmail] },
    ReplyToAddresses: [v.email],
    Content: {
      Simple: {
        Subject: {
          Charset: 'UTF-8',
          Data: `Registration ${ticket.reference}: ${v.businessName.slice(0, 120)}`,
        },
        Body: { Text: { Charset: 'UTF-8', Data: text }, Html: { Charset: 'UTF-8', Data: html } },
        Attachments: [
          {
            FileName: `proof-of-address.${proof.extension}`,
            ContentType: proof.type,
            RawContent: bytes,
            ContentDisposition: 'ATTACHMENT',
            ContentTransferEncoding: 'BASE64',
          },
          ...(signature
            ? [
                {
                  FileName: 'signature.png',
                  ContentType: 'image/png',
                  RawContent: signature,
                  ContentDisposition: 'ATTACHMENT',
                  ContentTransferEncoding: 'BASE64',
                },
              ]
            : []),
        ],
      },
    },
  };
}
