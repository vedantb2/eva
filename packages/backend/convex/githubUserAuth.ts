// Public surface for the GitHub App user-authorization hop. Separate from
// `github.ts` because that file is "use node" and may only export actions.
//
// There is deliberately no "do I have a token?" query: whether an authorization
// is still usable depends on the clock, and Convex caches query results until
// their data changes, so such a query would answer for whenever it was first
// run. The setup flow instead learns it needs the hop from the action that
// actually tried to use the token.
export { startUserAuthorization } from "./_github/userTokens";
