import { relations, sql } from "drizzle-orm";
import {
  blob,
  index,
  int,
  primaryKey,
  sqliteTableCreator,
  text,
} from "drizzle-orm/sqlite-core";
import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = sqliteTableCreator((name) => `whatsapp-api_${name}`);

type Activity = {
  timestamp: number;
  status: "PENDING" | "SUCCESS" | "FAILED";
  message: string;
  error?: unknown;
}

type ActionData = {
  components: Array<Record<string, unknown>>;
}

export const actions = createTable(
  "actions",
  {
    id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    type: text("type", { length: 256, enum: [
      "SEND_TEMPLATE_MESSAGE",
    ] }).notNull(),
    status: text("status", { length: 256, enum: [
      "PENDING",
      "SUCCESS",
      "FAILED",
    ] }).notNull(),
    data: text("data", { mode: "json" }).notNull().$type<ActionData>().default({ components: [] }),
    templateId: text("template_id", { length: 256 }).references(() => templates.id, { onDelete: "cascade"}),
    contactId: int("contact_id", { mode: "number" }).notNull().references(() => contacts.id, {
      onDelete: "cascade",
    }),
    profileId: int("profile_id", { mode: "number" }).notNull().references(() => profiles.id, {
      onDelete: "cascade",
    }),
    createdById: text("created_by_id", { length: 256 }).notNull().references(() => users.id, {
      onDelete: "cascade",
    }),
    activityLog: text("activity_log", { mode: "json" }).notNull().$type<Activity[]>().default([]),
  },
  (table) => ({
    statusIdx: index("action_status_idx").on(table.status),
    contactIdIdx: index("action_contact_id_idx").on(table.contactId),
    templateIdIdx: index("action_template_id_idx").on(table.templateId),
    profileIdIdx: index("action_profile_id_idx").on(table.profileId),
    createdByIdIdx: index("action_created_by_id_idx").on(table.createdById),
  })
);

export type Action = typeof actions.$inferSelect;
export type NewAction = typeof actions.$inferInsert;

export const profiles = createTable(
  "profiles",
  {
    id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    name: text("name", { length: 256 }).notNull(),
    displayImage: blob("display_image"),
    FACEBOOK_ACCESS_TOKEN: text("FACEBOOK_ACCESS_TOKEN", { length: 1000 }).notNull(),
    WHATSAPP_PHONE_NUMBER_ID: text("WHATSAPP_PHONE_NUMBER_ID", { length: 256 }).notNull(),
    FACEBOOK_BUSINESS_ID: text("FACEBOOK_BUSINESS_ID", { length: 256 }).notNull(),
    userId: text("user_id", { length: 256 }).notNull().references(() => users.id, {
      onDelete: "cascade",
    }),
  },
  (table) => ({
    userIdIdx: index("profile_user_id_idx").on(table.userId),
  })
);

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export const contacts = createTable(
  "contacts",
  {
    id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    name: text("name", { length: 256 }).notNull(),
    phone: text("phone", { length: 256 }).notNull(),
    country: text("country", { length: 256 }).notNull().default("KW"),
    address: text("address", { length: 256 }).notNull().default(""),
    profileId: int("profile_id", { mode: "number" }).notNull().references(() => profiles.id, {
      onDelete: "cascade",
    }),
    createdById: text("created_by_id", { length: 256 }).notNull().references(() => users.id, {
      onDelete: "cascade",
    }),
  },
  (table) => ({
    profileIdIdx: index("contact_profile_id_idx").on(table.profileId),
    createdByIdIdx: index("contact_created_by_id_idx").on(table.createdById),
  })
);

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;

export const templates = createTable(
  "templates",
  {
    id: text("id", { length: 256 }).primaryKey(),
    name: text("name", { length: 256 }).notNull(),
    language: text("language", { length: 256 }).notNull(),
    status: text("status", { length: 256 }).notNull(),
    category: text("category", { length: 256 }).notNull(),
    components: text("components", { mode: "json" }).notNull(),
    profileId: int("profile_id", { mode: "number" }).notNull().references(() => profiles.id, {
      onDelete: "cascade",
    }),
    createdById: text("created_by_id", { length: 256 }).notNull().references(() => users.id, {
      onDelete: "cascade",
    }),
  },
  (table) => ({
    profileIdIdx: index("template_profile_id_idx").on(table.profileId),
    createdByIdIdx: index("template_created_by_id_idx").on(table.createdById),
  })
);

export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;

export const profilesRelations = relations(profiles, ({ one, many }) => {
  return {
    user: one(users, { fields: [profiles.userId], references: [users.id] }),
    contacts: many(contacts),
    templates: many(templates),
    actions: many(actions),
  }
});

export const contactsRelations = relations(contacts, ({ one, many }) => {
  return {
    parentProfile: one(profiles, { fields: [contacts.profileId], references: [profiles.id] }),
    createdBy: one(users, { fields: [contacts.createdById], references: [users.id] }),
    actions: many(actions),
  }
});

export const templatesRelations = relations(templates, ({ one, many }) => {
  return {
    parentProfile: one(profiles, { fields: [templates.profileId], references: [profiles.id] }),
    createdBy: one(users, { fields: [templates.createdById], references: [users.id] }),
    actions: many(actions),
  }
});

export const actionsRelations = relations(actions, ({ one }) => {
  return {
    profile: one(profiles, { fields: [actions.profileId], references: [profiles.id] }),
    contact: one(contacts, { fields: [actions.contactId], references: [contacts.id] }),
    template: one(templates, { fields: [actions.templateId], references: [templates.id] }),
    createdBy: one(users, { fields: [actions.createdById], references: [users.id] }),
  }
});

export const users = createTable("user", {
  id: text("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name", { length: 255 }),
  email: text("email", { length: 255 }).notNull(),
  username: text("username", { length: 255 }),
  password: text("password", { length: 255 }),
  emailVerified: int("email_verified", {
    mode: "timestamp",
  }).default(sql`(unixepoch())`),
  image: text("image", { length: 255 }),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  profiles: many(profiles),
}));

export const accounts = createTable(
  "account",
  {
    userId: text("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    type: text("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: text("provider", { length: 255 }).notNull(),
    providerAccountId: text("provider_account_id", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: int("expires_at"),
    token_type: text("token_type", { length: 255 }),
    scope: text("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: text("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_user_id_idx").on(account.userId),
  })
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  {
    sessionToken: text("session_token", { length: 255 }).notNull().primaryKey(),
    userId: text("userId", { length: 255 })
      .notNull()
      .references(() => users.id),
    expires: int("expires", { mode: "timestamp" }).notNull(),
  },
  (session) => ({
    userIdIdx: index("session_userId_idx").on(session.userId),
  })
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  {
    identifier: text("identifier", { length: 255 }).notNull(),
    token: text("token", { length: 255 }).notNull(),
    expires: int("expires", { mode: "timestamp" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);
