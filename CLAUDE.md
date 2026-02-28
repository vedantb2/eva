the sandboxed app is a different codebase. this current codebase is a platform for  
 managing other codebases and running them remotely. that other codebase uses  
 workos/authkit for their auth

stop adding usestate's useref's for everything, this is the easy way out for every problem which is bad practice, first think of the best way to do this before resorting to those options

if the user asks you to run a migration, you need to add a migration function to clear the documents with that field in the db, then you run it, then you can get rid of the fields from the schema

you can only run npx convex dev, never deploy
