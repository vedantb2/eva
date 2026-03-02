this repo

mcp supports convex, supabase currently.

your codebase needs agent-browser skill for any screenshots or video walkthrough to be captured.

to add these connections, simply add your convex url and supabase url to either the repo/team env vars .

authentication issues in preview url
you may face authentication issues in the preview url if your auth provider blocks frame ancestors (this is the case with authkit). auth providers usually do this for security reason. you can either solve this by opening the preview url in a new tab, adding the daytona domain to your auth settings allowlist and callback url and using the preview url instead of the iframe.
alternatively, if you want to use the iframe, you will need to implement authentication so that it goes through your backend instead of authkit's. you can still use authkit, you will just need to implement a separate (fake) login page that doesn't make any network requests to authkit so that it is viewable in the iframe.

this restriction is not unique to eva, it is set for security reasons when using iframes. we chose to use an iframe because we didn't like daytona's vnc - it was slow, high latency, and you would need to install most apps yourself which can be limiting on a sandbox that has max storage limits of 10GB.

add to your CLAUDE.md how to use the fake auth so the agent knows what to do when using agent-browser.

env vars you need to add:
since this platform is made to work with convex, you will need to add your convex deploy key (if you want mcp/analyse), daytona api key (for the sandbox), and other repo specific
`DAYTONA_API_KEY`
`CONVEX_DEPLOY_KEY`

you need to create a workflow to build your snapshot, we don't provide this as this is an impleemntation detial that you need to add to your codebase. you can use github actions to automate the snapshot creation per commit to main or everyday at 6am. maximise the resources you can allocate so the sandboxes can use the resources they need, which is important for sessions
