export function uploadFields(ticket) {
  return {
    'Content-Type': ticket.proof.type,
    'x-amz-server-side-encryption': 'AES256',
    success_action_status: '204',
    'x-amz-meta-application-hash': ticket.fingerprint,
    'x-amz-meta-created-at': ticket.createdAt,
    'x-amz-meta-expires-at': String(ticket.uploadExpiresAt),
  };
}
