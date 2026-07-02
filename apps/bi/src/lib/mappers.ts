import type { Connection, ConnectionPublic } from "./types";

export function toConnectionPublic(c: Connection): ConnectionPublic {
  return {
    id: c.id,
    name: c.name,
    host: c.host,
    port: c.port,
    serviceName: c.serviceName,
    sid: c.sid,
    user: c.user,
    defaultSchema: c.defaultSchema,
    ownerId: c.ownerId,
  };
}
