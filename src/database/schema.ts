import {
    sqliteTable,
    integer,
    text
} from "drizzle-orm/sqlite-core";

export const movies = sqliteTable("movies", {
    id: integer("id").primaryKey(),
    year: integer("year").notNull(),
    title: text("title"),
    studios: text("studios"),
    producers: text("producers").notNull(),
    winner: integer("winner", { mode: "boolean" }).notNull().default(false)
});