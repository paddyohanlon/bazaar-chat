export type Room = {
  id: string;
  name: string;
};

export type GuestRoom = {
  id: string;
  name: string;
  ownerId: string;
};

export type Chat = {
  id: string;
  message: string;
  /** Timestamp */
  ts: number;
  userId: string;
};
