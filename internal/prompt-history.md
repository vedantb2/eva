[] get sessions working
[] save chat history somehow
[] filesystem volume to save session
[] add the screenshots, gifs
[] move snapshot build to the platform

why is convex deploy key passed in there, shouldn't it be set in the repoenv/teamenv?
same for daytona api key? the agent shouldn't use the convex env vars, it should use the ones the user has defined in the settings.

[x] one thing, get rid of slug for the teams and instead just use the team.\_id for the url, why do we have a slug anyway?

[x] second thing, can you check if an env var exists for CLAUDE_CODE_OAUTH_TOKEN when entering a repo (based on the team) and if no I want it to show the setup banner still cos this is basically an env that's required to use the platform. I don't it as a hardcoded field, just a check and then the user needs to add it

[x] few more things, the env vars in the admin page don't have the view button so I cant see them
second thing is why do we have an isPersonal field for the teams? is this needed

[]Make it general purpose ready
[]Create snapshots based on repo
[]Contact simran and aimilia for their thoughts
[]unstash project timeline and fix it
[x]fix type error in web, also move the view pr button in sessions id page to the header
[x]store env variables per repo
[]install carepulse repo
[x]install docker in snapshot to run convex locally + setup seed file to run that stores data in snapshot- automate this

[x]refactor designs to use sessions
[]install figma, linear, clickup plugins + figure out how to auth through figma plugin
[]figure out how to detect claude session usage limit and auto switch/show limit/set schedule

[]add "Upload PRD button" to docs page
[]add generate tests to docs page or to testing arena I guess?
[]Add build project to docs page, add generate test project to testing arena

[]after confirming send for dev review, it opens a multi step modal that shows auditing progress, then shows result in final step with just a banner saying this information has automatically been sent to the dev team.

[]figure out chrome extension distribution policy/updates
[]figure out recording user steps with record button in extension
[]improve extension toolbar

[]refactor chrome extension, it should not use pseudoterminal, it should use real terminal, so cmd in windows and whatever in macos. pyt is too slow and unstable. I want speed. this app should be extremely fast and currently it is extremely slow. please fix.

Move the preview button to the header, add suggestions to all input components, which change as the user prompts - add as system prompt.

Generate dashboard in analytics queries.

Add slide on can't this be done by claude cowork?
table of what can be done, what can't be done
emphasis owning the infra and control

Add scheduled runs to taskdetailmodal.tsx so we can set the task to automatically run at a specific time - put this option as "Scheduled Task" in the column with the assigned to, etc

Create plan to install draggable panels npm package and then add it to the sessions id page between for the chat right panel.

Change "Eva" to Evalucom with the eva emphasises

Rename projects back to features.
Then create projects which can contain multiple tasks?
Have timeline page to view project status and durations

[] Create plan so we have states saved in sessions, I want it like v0, where each edit is like a new version with version history, and there is a dropdown with the version history and we can just revert back to that point in history.

[] Check if we have any use case for https://v0.app/docs/api/platform/packages/react or no

[] Create a plan to install agent-browser in the snapshot which I can use in sandboxes, I want this so I can ask it to control the browser in prompts in the sessions page.

[] Create a plan for the chrome extension codebase to improve the toolbar and make it slightly bigger, make more like vercel toolbar in terms of design and add run all button,

[] Create plan to add this to the Quick tasks so that when Eva creates a deployment, she can get the status of the deployment and show it in the card details.

- https://docs.vercel.com/docs/rest-api/reference/examples/deployments-automation
- https://docs.vercel.com/docs/rest-api/reference/examples/logs-monitoring

[] I want you to look into the design page and come up with a plan to improve its current usability, the way it works is, the user sends a prompt, sandbox opens with the codebase, it generates design based on prompt/codebase context and then shows this on the frontend. The user can then click on I select this design to continuously iterate over a design until it is finalised. I want you to make sure it flows this way and come up with how to improve the design generation through improving the prompts or whatever needs to be done.

Add tags to the taskdetailmodal.tsx, to quick tasks so we can group tasks, create a Linear style inbox, with projects timeline view for projects, make projects start and end date editable in a modal when editing the project etc.

For projectcard instead of making them clickable and going directly to the projects link, I want it to open a modal called ProjectCardModal.tsx, it should be a similar to the TaskDetailModal.tsx in the structure, but in the right column we need new fields like "Project Lead" "Project Members", "Start Date" "End Date"

Create plan to use https://elements.ai-sdk.dev/components/sandbox Sandbox component for the research queries.

adding accordion on quick task modal for 3 audits

- accessibility audit - checks whether it meets accessibility guidelines
- code test audit - checks whether tests have been implemented correct (if they are needed)
- code review audit - checks whether the code implemented is correct
-
- add dictation(voice ) to all input areas
  add interview to docuements that generates the requriements and user flows

adding a user persona to design sessions

- increase size of annotations on screen by 1.25x
- replace all purple usages with our theme colour instead
- colour of annotation reflects the task status grey for todo, yellow in progress, business business review, purple code review
-
- - add design to ext sidebar to view designs (drag and drop into figma)

Install to the packages/ui

confirmation - analyse
artifact - analyse
web preview - sessions
plan - sessions
test results - testing arena

not needed for now:
model selector - sessions
prompt input - sessions
jsx preview - interview
terminal - sessions

honestly, just limit the languages to html, css, javascript, typescript - we don't use any other language
also, you should probably read
https://streamdown.ai/docs/code-blocks
for more info if you want

can you add a toggle to the toolbar to hide/view the annotations pls

add to extension:

- add a toolbar that appears on the page just like vercel has, there should be a button in the side panel to toggle the toolbars view
- in the toolbar, add a button to add all annotations on the page to quick tasks "Add all to Quick Tasks"
- in the toolbar, add button to add all annotations to a project "Add all to a Project"
- - add toolbar to chrome extension
- button to convert all annotations on page into quick tasks

Daytona has network restrictions and has set domains from which it allows access, convex is not included in that domain but I have sent a request to have it added
https://www.daytona.io/docs/en/network-limits/

add an analyse function to analyse all quick tasks made, all session chat history against a tag (a project) like nh supa and can give a report into where most of the issues were, what eva struggled with the most

- add access to data from clickup, sentry, posthog, sharedrive mcp's
  can be useful during retrospectives

in docs add 3 sections

- description
- user flows
- requirements
  The three you proposed: - Description — what the page does
  - User flows — step-by-step paths (2D array)
  - Requirements — checklist items to evaluate
-

also 3 things

- can you replace the manual doc interface with functionreturntype from convex?
- I literally said I don't want manual state being used anywhere, so why do we have manual local state for the title, description, requirements, userflows??????
- we can use optimisticupdates with convex so we don't get the state delay so please add this

second thing - are we saving the user id of who sent the message for the project interview and the session?

I want session to be collaborative, so I was thinking of replacing the generic iconuser in the chat area for both sides and instead using the UserInitials.tsx with hideLastSeen prop set as true

is a separate field for this streaming output needed? if so, is it possible to style the message separately from a regular assistant message, or maybe keep it under an accordion under the assistants message saying "View logs" so the entire streaming history is only visible when the user wants to see it

I am using Daytona for sandbox. I want claude code on it to execute tasks.
I am using Daytona cli, I am creating a snapshot.
the snapshot needs to contain:

- pnpm git claude code installed
- git cloned my repo
- my repo is private
  read my Dockerfile and tell me whether this is okay and what I need to run in the cli now to set it up

i want you to create a helper function called something like createNotification in convex which takes the userId and content/title and then I want you to analyse places in the convex codebase of where it would be appropriate to call this function to send a notificaton to the user. one example is when changing an assignee on a task to someone else, can send noti to that user so they are aware.

need you to plan a new feature, I want you to add a role field to the users table, for now just have "business" or "dev". and then in the quick tasks table i want you to add a field assignedTo which is connected to the users table, then in quicktaskmodal I want you to add a select option to assign to user which in the dropdown gets entire list of users and then once selected adds them as who the task is assigned to

I want to plan a new feature - Notifications.
The notifications page should show a list of notifications for system stuff - like if an export is finished and ready, if it has routines running at 8am so 9am start you have everything ready, etc.
Emails should be sent when a routine is complete
Do not implement the emails yet, this will come later, we will use Resend convex component. But implement the backend/frontend. for the notifications.

Add button to fix issue in task if not complete

Great now in the quicktask modal I also want a section called "Proof of Completion" which gets shown after it has completed the task, so when it is not in to do on in progress. this section is basically for eva to attach an image or a video clip to provide that a task has been completed.

I want you to change something, in the quick task button, the run eva button only appears if the task is in to-do status, nothing else. it should be hidden if not.
secondly. it has a 2 column layout. I want the 2nd column to be collapsible/expandable and by default it is collapsed. it shouldn't be a place for comments but a place for the user to ask to make changes if Eva does not complete a task as per the users requirements or if the requirements have changed. change the wording from comments to more like Ask Eva to make changes.

Add business review column

Add collapse to projects view

Reword task cards to add creation date

great now I need you to plan out a big feature - spotlight search. I want to be able to press ctrl+k and it opens the search and I can navigate to any project, quick task, session, document, testing area, analyse query, within that search.

great now I need you to always add 2 tasks at the end whenever a project is created from a plan - accessibility audit and testing audit. Accessibility audit checks whether it follows accessibility requirements from https://www.w3.org/TR/WCAG22. Testing audit checks all the diffs in the branch/pr and whether the tests created in this pr are correct as per requirements.

great now I need you to plan this on the /docs page, I want real time collaborative sync, here is the docs and an example of how to set it up and configure it. I have already installed the packages for you

great now I need you to plan this on the /docs page, I want you to use this timeline component to save the document edit history, then I want the frontend added for this too. here is the docs and an example of how to set it up and configure it. I have already installed the packages for you

great now I need you to install dayjs in the web codebase, create a dates.ts with all the .extend imports and then search through entire codebase and use dayjs everywhere where it can be used. there are quite a lot of places. you can start with the UserInitials.tsx file

- mark area with selector, input pops up with add task button under selection
