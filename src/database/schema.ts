import {
    sqliteTable,
    integer,
    text
} from "drizzle-orm/sqlite-core";

export const movies = sqliteTable("movies", {
    id: integer("id").primaryKey(),
    year: integer("year"),
    title: text("title"),
    studios: text("studios"),
    producers: text("producers"),
    winner: integer("winner", { mode: "boolean" }).default(false)
});