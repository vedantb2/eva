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
