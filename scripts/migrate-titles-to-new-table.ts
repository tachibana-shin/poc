// import { and, eq } from "drizzle-orm";
// import pLimit from "p-limit";
// import { db } from "../db";
// import { mangas, titles } from "../db/schema";

// const limit = pLimit(20);
// for (let index = 0; ; index++) {
// 	const items = await db
// 		.select({
// 			id: mangas.id,
// 			name: mangas.name,
// 			titles: mangas.titles,
// 		})
// 		.from(mangas)
// 		.limit(100)
// 		.offset(index * 100);
// 	if (items.length === 0) break;

// 	// verify
// 	const results = await Promise.all(
// 		items.map((item) =>
// 			limit(async () => {
// 				const items = await db
// 					.select({ id: titles.id })
// 					.from(titles)
// 					.where(and(eq(titles.manga_id, item.id), eq(titles.name, item.name)));

// 				return items.length > 0;

// 				// return db.insert(titles).values(
// 				//   item.titles.map(json => ({
// 				//     manga_id: item.id,
// 				//     raw_id: (json as { id: number; name: string; primary: boolean }).id,
// 				//     name: (json as { id: number; name: string; primary: boolean }).name,
// 				//     primary: (json as { id: number; name: string; primary: boolean })
// 				//       .primary
// 				//   }))
// 				// ).onConflictDoNothing()
// 			}),
// 		),
// 	);

// 	if (results.every((result) => result)) console.log("%s ok", index);
// 	else console.log("%s failed", index);
// }

// console.log("Migration completed");