# Contributing

Keep public design changes consistent with `lib/constants.js`. Put all data operations behind `lib/db.js`, protect every admin mutation with `requireAdmin()`, and document new environment variables and schema changes.

Never commit `.env.local`, service-role keys, `data/store.json`, or customer inquiry exports.
