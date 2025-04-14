import Dexie from "dexie";
export const db = new Dexie("ChatDB");
db.version(1).stores({
  messages:
    "++id,_id,temporaryId,senderId,receiverId,text,image,createdAt,status",
  users: "_id,fullName,profilePic",
});

// FORCE the database to open (and thus create the object stores) right away:
db.open().catch((err) => {
  console.error("Failed to open ChatDB:", err);
});
