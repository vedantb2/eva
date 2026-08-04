/**
 * Ordering rules for a message's agent proof media (recordings, screenshots).
 *
 * Generic over the id type: this is list logic over opaque ids, so call sites
 * keep their `Id<"_storage">` by inference and tests can use plain strings.
 */
type MediaFields<TId> = {
  /** Legacy single-media fields, still sent by callback bundles mid-deploy. */
  imageStorageId?: TId;
  videoStorageId?: TId;
  mediaStorageIds?: TId[];
};

/**
 * The ids one `updateLastInternal` call contributes, in capture order.
 *
 * Video before image, matching the order the legacy pair was resolved in.
 */
export function incomingMediaStorageIds<TId>(args: MediaFields<TId>): TId[] {
  return [
    ...(args.mediaStorageIds ?? []),
    ...(args.videoStorageId ? [args.videoStorageId] : []),
    ...(args.imageStorageId ? [args.imageStorageId] : []),
  ];
}

/**
 * The message's media ids after appending one call's worth.
 *
 * Appends rather than replaces: a turn that captures twice used to keep only the
 * last upload and orphan the earlier blob in storage. Returns `undefined` when
 * the call carries no media, so the caller leaves the field untouched instead of
 * writing an empty array over what is already there.
 */
export function appendMediaStorageIds<TId>(
  existing: TId[] | undefined,
  args: MediaFields<TId>,
): TId[] | undefined {
  const incoming = incomingMediaStorageIds(args);
  if (incoming.length === 0) return undefined;
  return [...(existing ?? []), ...incoming];
}

/**
 * The ids to resolve to URLs for a stored message.
 *
 * `mediaStorageIds` is the source of truth once a doc has it — including when it
 * is empty, which means the media was removed. Only a doc that predates the
 * field falls back to the legacy pair.
 */
export function messageMediaStorageIds<TId>(doc: MediaFields<TId>): TId[] {
  if (doc.mediaStorageIds !== undefined) return doc.mediaStorageIds;
  return [doc.videoStorageId, doc.imageStorageId].filter(
    (id): id is TId => id !== undefined,
  );
}
