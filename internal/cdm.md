Wednesday 4 Feb - Company
○ Yesterday I had uni and the evaluation retrospective and worked on fixing a
○ today I'm going to work on - Dev
○ Yesterday I worked on fixing those 2 linear issues
○ Worked on cdm
○ Will work on fixing those 2 issues
○ Few updates to Eva too, let me show u progress,
§ interview actually works now
§ Document structure progress
§ UI testing
§ I'm gonna add the bar to the chrome extension but yh
§ Just preview remaining I need to fix, and the analyse section, quick tasks works, quiz works, projects works, so I think that's at least MVP ready
○ Codex automations
§ How are we gonna integrate some of the stuff in there into our workflows
○ What else is there to do, with mobilisation I did try creating a prd but my claude code subscription ran out yesterday, got the base plan again but like 3 prompts in I was at 40% usage so yeah I'm gonna get max again this morning and try that, didn't manage to get far with that yet

Friday - Company
○ Yesterday I finished fixing the final set of issues with evaluations and fixing a bug with cqs
○ Today got a 1 to 1 with krzys and I'm gonna see what else to work on next
○ Krzys, george, matt, \_\_\_
○ Chrome extension is almost fully built, and for the platform got the quick tasks done but projects and rest is still remaining, I think I might have something to share in a few weeks so yh its good so far - Dev
○ hi

Thursday - Company
○ Yesterday I worked on fixing an issue with the sorting on the cq dashboard and other issues with some header state logic
○ Today im just gonna continue with that and see what other issues are remaining and fix those too
○ \_\_\_, zuza, matt, simran, - Dev
○ Yesterday I and yh think that should be it
○ Daytona cli it admin blocked it

Wednesday - Company
○ Yesterday I just worked on testing staging for bugs and fixing issues reported on there
○ Today just gonna continue with that and work on my cdm
○ George, simran, - Dev
○ Fixed the cq link
○ Fixed the hardcoded suggested outcome
○ Fixed the filter issue
○ Fixed the hardcoded suggested outcome as pending
○ Fixed the missing rationale badge issue
○ I did see jack added some issues tho, I think some are still getting clarified with the business team but most were added near the end of day so couldn't fully work on them
○ Worked a bit on cdm but not ready still so I'm gonna push it again to prob tomorrow if I can get it done today

Tuesday - Company
○ Yesterday I had uni and worked on testing staging and fixing an issue with the spotlight
○ Today im gonna work on my cdm, continue with testing and see if there's any more issues to fix
○ Krzys, zuza, jack, - Dev
○ Not much yesterday just had uni n then worked on testing and issue fixing
○ Fixed the spotlighted by issue
○ Fixed the issue where you couldn't add a rationale if a fail outcome was assigned after a cq was sent
○ And yeah just did some testing and there's 2 more issues
○ 1 is just a usability so in the chat history it should probably be scrolled to the bottom of the view
○ And 2nd was the live draft share is not working, like it automatically shares this with evaluators even when its not enabled
○ So yeah got all 3 of those fixed on my branch, will push those fixes now
○ And then yeah will just continue with testing today and fix any more issues I find, oh and also need to move my cdm cos I don’t have the doc ready for that yet so I'll work a bit on that today too
○ Also got something super cool to share
○ Chrome extension
§ Ask/flag mode
§ Selector options
§ Annotations - saved in convex so we can view them all, can add comments to annotations
○ Projects reworked
§ Combined plan and features
§ Changed layout of projects
○ Losing hope in the Analyse feature - do we even need this
§ Can just be done with Claude cowork now
§ Claude cowork can now generate UI from mcp
§ Maybe replace with just MCP server?
§ Not sure what to do
§ Added files, saved queries, routines
○ Quick tasks changed layout
§ Just for simple stuff
§ No feedback loop - Eva sends image/clip of compeltion for evidence
○ Testing arena
§ Runs analyse on requirements against codebase

Friday - Company
○ Yesterday I worked on refactoring cqs backend and modal, the outcome selector and the nav badges
○ Today got a 1 to 1 with Krzys, the ai workshop, and im gonna just continue with testing and bug fixing
○ George, krzys, - Dev
○ Yesterday worked on pretty much doing everything we mentioned yesterday
○ Started with refactoring the cqs to use the clarificationQuestions table instead of the history, and fixed drafting the cq and other cq states to insert records into that table and use that as the source of truth
○ Then for the chat I'm merging that along with the history to show the chat history like we did in evaluations
○ So yeah got rid of duplicate sendcq modals too, what's funny is that altho the newer send cq modal I made used to use the evaluationHistory and that was wrong, it was actually in a more polished state on the frontend with the scrollbar, the author name, the right panel rendering and stuff
○ But yeah just got those all fixed again so yeah only 1 send cqmodal component now
○ And then went over removing the outcome pills and using the outcome selector component again
○ Added the discard draft option to remove the cq selection, added the sharewithevaluators field to the cqs table and connected this to the outcome selector component
○ So when drafting a cq and sharing this on the evaluator side it just shows a disabled input field with the content in that input like u mentioned
○ Just one question on that - are u sure we should keep it like that, just looked weird to me cos I've kept it in a similar style to the outcome selector so idk,
○ also I don't have the typing indicator in there yet cos we're missing an updatedAt field but yeah that's the only thing with that
○ And then also fixed the issue of selecting the outcome twice inserts 2 records, so now it inserts a record which just says Outcome removed and unselects that option
○ And then finally worked on the badges a bit but just for the pass fail and cqs, changed the priority to be what we said, missing rationale, fail, pass, cqs, outcome conflicts etc
○ Also added a helper function which fixed the issue that we started with yesterday so it checks the current moderation session and not the entire chat history for the last outcome set and sets the outcome
○ So I'm using that helper function across the nav and both question cards so it should always be in sync now
○ And yeah that's pretty much it
○ I did do a bit of testing just of the basic functionality and all seemed okay, like with drafting cq, sending cqs, the badges, sharing with evaluator switch so hopefully it should all be fixed now
○ One issue though I have thought about is any dashboard that displays cqs in progress bars or anything like that, if they used the evaluationhistory it needs to be changed to use the cqs table but yeah that's the only thing I haven't updated yet
○ So yeah that's pretty much it for today

Thursday - Company
○ yesterday had a uni exam and worked on reviewing issues on staging and making sure they're fixed
○ today im gonna fix some issues with the badge statuses and see what to work on next
○ Krzys,
○ Yh had uni exams so was away just revising, exam was good so yh worth it - Dev
○ Not much to say
○ Just had uni exam yesterday which was okay
○ Final exam so no more exams just the final yr project and then im done with this uni thing
○ Need to get 65% min for the project for a first so yh need to grind out this project now
○ and then worked on reviewing the issues that I had marked as QA to make sure they were fixed on staging too cos I didn't test it on staging
○ And yeah fixed the badge issue which showed the in progress status when an outcome couldn't be applied to it cos this was the default case in the switch statement
○ And then also fixed the filter to exclude the questions which can't have an outcome assigned to them
○ So yeah I think that should be fixed now but im gonna check with zuza what other changes she wants cos she said the nav was super hard to use and that the badges were wrong, which I'm not sure what else needs to be changed cos I already added in the likely pass, the likely fail and tested the states all the badges so I thought it'd be fixed but I guess not
○ So yeah I'll check with her on that and then yeah not sure what else to work on for today pretty free
○ Today im gonna work on

Friday - Company
○ yesterday I worked on fixing issues on the evaluator dashboard, the spotlight, and the cqs
○ today got a 1 to 1 with Krzys and I'm gonna continue working on fixing moderation issues from testing
○ george, - Dev
○ yesterday I just continued with fixing more issues
○ fixed the spotlight issue which needed to show the name of the moderator that spotlighted a question, so I added a spotlightedBy field and just stored the admins name on there and connected this to the question card
○ fixed an issue with the progress bar being empty in an edge case where both evaluators complete outcomes but one get unassigned, on the frontend this was hardcoded as zero so I just changed this to return the progress, so that it still shows the progress made
○ fixed an issue with the sendcqmodal having hardcoded values of the other users that also have drafts, and that all cqs were selected by default which is a mistake as you might send a cq belonging to someone else
○ so yeah just changed the query to return the users and kept as unselected by default
○ fixed an issue with the show only filter on the nav basically calculating based on provided and confirmed outcome instead of checking the outcome in the history
○ so yeah today i'm gonna just continue with remaining issues which are mostly moderation or outcome statuses, which i'm gonna group the issues and just go through the entire thing to make sure its all fixed,
○ then for moderation need to add a moderation progress bar which is new to see how many outcomes assigned over total outcomes during that moderation
○ so yeah will get that fixed, also need to copy in my changes from my other branch cos i made a new one again, and then merge this new one into staging so that i can update the statuses of like 7 issues to qa for zuza to test
○ then i think there should only be 4 non assigned issues so will work on those
○ and yeah thats pretty much it

Thursday - Company
○ yesterday worked on fixing issues with filters and made some changes to the nav badges
○ today I'm just gonna continue with fixing more bugs and try to get them all cleared
○ george, jack - Dev
○ not too much to say
○ yesterday I worked on just fixing multiple issues
○ fixed issue with the more option dropdown not matching design
○ fixed issue with the rationale and outcome ui logic, so the rationale and outcome are shown separately in the chat history
○ fixed issue with the moderation records in evaluation history appearing as messages in the evaluations page
○ added highlight to the evaluations dashboard
○ and fixed the logic of the badges in the nav to add a likely pass and likely fail badge if the past 2 outcomes were both bad or both good - also updated it to show a missing rationale badge if the fail outcome is set but no rationale was added
○ its good we broke down the nav cos it was much easier to add this instead of having to go through that old file
○ and yeah today just gonna continue with more issues, I'm not sure how many non moderation issues are left that are assigned to no one, but I'll have a look and then move onto the moderation issues if there's nothing else

Wednesday 14 Jan - Company
○ yesterday I worked on connecting the assign evaluator flow to the backend and continued with fixing issues from testing
○ today I'm gonna work on fixing the filters on the dashboard and continue with more bug fixes
○ oh also I have uni exams next week so im gonna be away Monday Tuesday and Wednesday morning of next week
○ george, milli - Dev
○ yesterday I worked on adding the check if there are evaluators assigned to an application otherwise get them assigned and connected this to the backend
○ also deleted the edit evaluator modal which I had from before cos this was pretty much identical
○ fixed an issue with the evaluator names in the technical evaluations filter which was not connected to the backend
○ fixed an issue where you could access application pages where you weren't assigned an evaluator for
○ and then yeah I did try to merge staging into my branch but idk why it just merges in new code or leaves old code there and it doesn't show as a conflict when trying to merge
○ which makes sense cos technically there is no conflict, but if I removed something, and it's replaced with nothing, I should at least see that it was removed so I know to delete those lines of code
○ so yeah this happened in mainly the evaluator file and some other files which is quite big which we should probably break down so instead I just made a new branch and copied over my fixes in there
○ haven't copied the cq refactor but I'll copy that later now
○ so yeah in terms of the issues, quite a few are for moderation so I'll leave that for now, main thing left is fixing the filters, fixing outcome conflict not working, and the outcome guidance link not working
○ I'll assign some of those tasks to u jayke if you're free and I'll focus on the filter and the logic for that
○ so yeah thats pretty much it

Tuesday 13 Jan - Company
○ yesterday had cycle planning and i continued working on the cqs refactor and got the notes feature launched
○ today im gonna continue fixing issues from the evaluation testing and do more testing on my side too
○ simran, george, milli, matt, ruth, - Dev
○ yesterday I just continued with the cq refactor and got that pretty much finished so just fixed a few minor things when setting the question outcome it was missing the reviewedby and reviewed at
○ when updating the cq response it was setting the respondedby the admin user which basically meant it was being overwritten by admins when a response was changed so got that adjusted to keep provider instead
○ and then started with testing the flow from the figma design and I think one or two issues that zuza had put up on linear i had already fixed, maybe it wasn't included in the pr that was merged into staging so it wasn't visible there but the issues were
○ one was the application link not working on the dashboard, the other was the rationale input appearing when an outcome was not selected
○ and then worked on just testing user flows, fixed another issue with the next button not scrolling the user to the top of the page
○ and then got the notes feature for sussex launched, was some minor frontend change since the backend had it implemented already
○ and yeah thats pretty much it, today just gonna work on fixing zuzas issues and also fix some conflicts and merge staging into my branch so i dont end up being like 100 commits behind
○ also one issue zuza put up was of the assign evaluators header status missing, all the frontend was done for that just the backend connection was missing which ur working on krzys right or do you want me to take a look into it,
○ so yeah that's pretty much it

Monday 12 Jan - Weekend
○ weekend was okay just finished watching stranger things, met up with a friend, and yh did some revision for a uni exam coming up
○ i think thats everyone, - Company
○ on Friday had a 1 to 1 with krzys and worked on refactoring the nav on the evaluator page and cqs
○ today got cycle planning and im gonna work on testing the moderation user flows to find more issues and get them fixed - Dev
○ on Friday I worked on refactoring the cqs to use the cqs table instead of using the evaluationhistory so got this replaced in most places, just need to do testing for that before its ready
○ and then worked on refactoring the nav and breaking that down so it smore maintainble and created 4 files in total
○ 1 for the evaluator badges
○ 1 for the moderation badges
○ 1 for the nav component
○ and 1 for the types
○ and yeah got that replaced
○ and then worked on adding debounce to the comment input for the evaluation cos that was glitching since it was calling the mutation on change and the value was being set by the query so there was some delay, i dont think there were any optimistic updates idk but yeah just added that
○ and yeah thats pretty much it, for today unless there's anything left on the evaluation side i'll focus on testing the evaluation side
○ and then continuing with that cqs refactor and then moving onto testing everything on the moderation side
○ so yh thats pretty much it

Friday 9 Jan - Company
○ yesterday i worked on finishing off the moderation board tab and implementing the remaining states on the admin applications page
○ today got a 1 to1 with krzys and im gonna work on testing all the user flows and see what to work on next
○ jack, simran, krzys, - Dev
○ not too much new to say
○ yesterday I just worked on completing the moderation board so just connected this to the evaluator teams and show that along with the progress
○ and then also continued with implementing the remaining states and queries for the admin applications page for the review cqs, late cqs and evaluation progress
○ today just need to implement the status filter and check in with zuza on what needs to bet here in the dropdown cos there's a scrollbar in the design but the full list of options aren't shown
○ and then yeah once that's done i'm just gonna work on testing the user flows and checking for any bugs
○ and then read a few blog posts in the afternoon that i had saved up
○ so yh thats pretty much it
○ progress bar states in evluator side

Thursday 8 Jan - Company
○ yesterday i worked on connecting both the evaluator dashboard and cqs admin tab to the backend
○ today im gonna continue with that but for the moderation board and work on implementing a few remaining progress states on the applications page
○ simran, jack, george, jayke - Dev
○ not too much new to say
○ yesterday I just worked on the cqs tab so just connected all the frontend stuff to the backend and updated the counts for teh drafts, sent cqs and waiting responses for the different cq statuses
○ and then just reviewed jaykes changes and fixed a few issues mainly just with the evaluator homepage using mock data so got that replaced
○ oh also removed highlighted and im just using highlightedby now to check whether thats set to show if its active cos 2 fields weren't needed for that
○ so yeah today just need to complete the moderation board so just connect this to the evaluator teams and show that along with the progress
○ and then also finish off the admin applications page which I made a start with for all the cq states, just need to implement the other states and the status dropdown filter
○ so yeah thats it for today

Wednesday 7 Jan - Company
○ yesterday i worked on fixing an issue with assigning outcomes and a bug when sending cqs and started with the dashboard implementation
○ today im just gonna continue with that and work on the cqs tab
○ krzys, - Dev
○ yesterday worked on quite a few bug fixes
○ fixed the issue with the outcome not getting assigned after moderation ended
○ added the error message to the inputs for the fail and cq inputs since they are required
○ wrote osme query functions for the dashboard to fetch teh applications and their details
○ fixed an issue where cqs were visiblef or evaluators before they were sent
○ added the sent cq status badge to the nav
○ and also refactored the code to get rid of unnecessary useeffects that were being used for the live typing indicator which was updating the date whenever you refreshed the page so it seemed as if it is happened now
○ and then yeah started with implementing the applications tab dashboard
○ got the filters there, have hardcoded the evalutor stuff for now very quickly but im gonna update my branch to get the backend for that and get that connectged
○ and then yeah just created components for all the progress bar states
○ so yeah that was for the applications tab, today i need to work on the cqs tab and reuse that same query but show the cq statuses
○ and then move onto the moderation board tab and connect that to the backend
○ and then the only thing left is the all applications page which is pretty much the same as the applications tab but more in depth with the filtering of the status and the details in each component so that will probably take a bit longer
○ but yeah thats it for today

Tuesday 6 Jan - Company
○ yesterday had cycle planning and i worked on fixing bugs on the moderation view and implemented the cq sending functionality
○ today im gonna work on the cq statuses on the dashboard and test assigning outcomes when the moderation has finished
○ george, milli, jack, - Dev
○ yesterday I worked on refactoring the mutations and schema to get rid of the draft outcome and rationale that I was originally saving
○ and then added the moderation paused outcome to the chat history
○ tested the cq modal and got that setup and working
○ and also played around a bit with the ralph claude code loop which was so annoying took me like an hour to even setup cos it had so many issues, didnt even work half the times i used it and idk maybe it was cos of that but i didn't even feel like it provided much value
○ subsystem
○ had permission issues too so gave it entire bash permissions but
○ beads
○ i asked it to make some large refactors in this codebase and after it was running for 30 minutes i went through it and just hit undo on everything like it was so bad made components for small buttons added like 30 new files for no reason
○ so yeah prob won't be using that until it gets worked on more, i did see some other ppl having issues with it so maybe cos its new
○ but yeah removed both the plugin and the script for now
○ i also tried opencode and yh didnt notice any differnce between it and claude code other than it being much faster, like it spends less time reading or thinking i think not too much difference but i'll need to spend more time w it to see

    	○ anyway, today im gonna work on adding the cq statuses to the dashboard and test the assigning outcomes when the moderation has ended cos i was trying to do that yesterday but it wasn't working for some reasoning
    	○ the outocme assignment worked but the rationale wasn't being shown altho being saved so prob just some frontend issue but yeah will get that fixed
    	○ and yh thats pretty much it


Monday 5 Jan - Weekend
○ weekend was okay, not much just mostly worked on 2 final coursework pieces and watched more of psycho pass
○ ruth, zuza, aimilia - Company
○ on Friday had a 1 to 1 with krzys and worked on fixing issues with the evalutor view
○ today got cycle planning and im gonna work on refactoring the nav to add the browser focus when selecting a question and other fixes
○ matt,jack, jayke, ruth - Dev
○ not too much to say on Friday I worked on just fixing issues with the outcome selector being visible after outcome has been assigned
○ and then worked on refactoring the questioncards that were originally for evaluators but i ended up changing it for the moderationview and forgot to make new components for them so yeah did that so jaykes changes can be merged in
○ and started with refactoring the nav to show the active question selected and to bring the active question to the users focus
○ so yeah just gonna continue with this today, test out the cqs flow, and then work on updating the dashboards

Friday 2 Jan - Company
○ on Wednesday I worked on testing the outcomes and the statuses and added the filtering methods for the moderation
○ today got a 1 to 1 with krzys and I'm going to work on updating the dashboards and note feature
○ kezia - Dev
○ on Wednesday just spent time testing assigning outcomes and checking whether the status badges were being assigned properly
○ and then yeah just implemented the filtering and sorting methods
○ oh and also checked in with zuza on the pass and fail outcome assignment cos I originally thought that when you enter in the input that's the draft, like there would be some button to submit whatever the admin has entered
○ but no, the second the pass button is selected, the outcome is shown to evaluators, and then the rationale is only shown if the live draft is enabled OR if the moderation period has ended
○ so that message of Pass or Fail outcome assigned was missing so yeah was just clarifying all of that
○ and then yeah for today just gonna continue with the dashboards, and check on the note functionality on direct awards and copy that

================================

Wednesday 31 December - Company
○ yesterday i worked on implementing the cq modal and the status badges on the nav and question cards
○ today i'm gonna continue with that and move onto updating the dashboards and the suggested outcome and testing user flows
○ jack, krzys, - Dev
○ yesterday i just worked on creating the cq modal to view all the cqs and send them off
○ and then yeah just wrote some backend queries to get those draft cqs and connected this to the modal in the header
○ and then updated the highlighted application to also include the name since on one of the evaluator dashboards its shown there in a tooltip which i had missed, so got that added in
○ oh and also added in some statuses like for when the outcome has been drafted for all 3 outcomes like pass fail and draft cq
○ i think there are a few more statuses that i need to add so i'll need to look in to that
○ so yeah today gonna work on going through the dashboards on the admin side and add in anything that is missing,
○ i haven't tested any of the sorting or the filtering methods so will test that too
○ and then also check in with zuza on how the leave a note outcome is supposed to work cos there's no design for what happens when that is clicked
○ and then yeah that's it for today

Tuesday 30 December - Company
○ yh it was good just relaxed
○ yesterday i worked on live draft outcome feature and fixed some bugs on the evaluators side and started with the sending cqs section
○ today i'm gonna continue with that and work on the statuses for the nav and question cards - Dev
○ yesterday i worked on the live draft functionality, added the panel that expands with the toggle to share the draft live with evaluators and the input
○ then when the live sharing toggle is on made updates to the evaluators side so they can see the admins draft in real time with the typing indicator if the update has been made in the past minute
○ and added debouncing and only calls the mutation onchange so its not spamming the function
○ fixed minor issues with the warning icon not appear when outcome is missing and the purple dot for the spotlight
○ also added the breadcrumbs under the title and the cqs and suggested outcome tabs
○ and then yeah just made changes to the evaluator side so updated the header when teh moderation is active so it has that blue gradient
○ and also fixed another bug i found with the restart moderation which wasn't restarting when i was testing cos it wasn't setting it to false and resetting the enddate
○ but yeah for today gonna work on the cqs modal and just foucs on the statuses shown on the nav and the question card
○ and also look at the evaluator side to make sure its there too

Monday 29 December - Weekend
○ yeah it was good, went to winter wonderland which was nice,
○ went on some rides and played the games there, did not win anything sadly but im pretty sure all the games are rigged so yeah, it was fun tho
○ other than that not much else watched psycho pass and worked on coursework and yeah, it was a good break
○ uhhh \_\_\_ how was ur weekend - Company
○ on Wednesday I worked on adding the note option to the outcome selector when a moderation is complete
○ today I'm going to continue with that work along with the live draft cq feature
○ mili,
○ i did start early but my laptop was updating its firmware so i - Dev
○ not much to add to the other standup tbh
○ on wednesday I worked on the add note outcome and just worked on the chat history and messages shown like when moderation ends and if there isn't an outcome assigned it shows the status to add outcome
○ ummmm and yeah idk can't remember much else so for today gonna continue working on the live draft cq functionality and then the modal for the multiple cqs across all sections
○ then just statuses on the navbars an dquestion card on the evaluator side and rendering the chat history there too and then most things should be complete, but yeah will just get this done over the next few days
○ so yh thats it

    - questions
    	○ what do you think of semax
    	○ binaural beats
    	○ creatine - appetite
    		§ have you noticed your appetite has been supressed, like i dont get as hungry anymore and i dont even eat as much anymore but i cant really tell cos i havent measured i just feel that way
    	○ creatine - sleep
    		§ this hasn't affected me lately but a few weeks ago i noticed
    	○ creatine - vision
    		§ my vision seems better, reduced screen scaling from 150 to 125 and font scaling too and my eyes havent ached, haven't been straining them either
    		§ i have like an eye test on the opposite side of my room which i use to i use to

Wednesday 24 December - Company
○ yesterday i worked on the spotlight question feature for both admins and evaluators and the moderation statuses to the evaluation history along with implementing some other action ui stuff
○ today im gonna continue working on the live draft feature and add a note option when the moderation is complete - Dev
○ yesterday i worked on the spotlight question feature
○ implemented the purple border as a shadow like you said so there's no shift of the card contents as that did happen when i tried with border
○ also one question, i guess its more for zuza - but the purple colour that has been used is not in our theme, do you know why that is
○ and then yeah implemented the same thing for the evaluator side so its in sync with the admin view
○ and then also stored this all in the backend so spotlighting another question updates the previously spotlit question with the new one
○ and yeah it was so nice to test this in convex cos of the liveness of it right idk it was just so smooth with such little complexity behind it
○ and then yeah added some more modals and actions like modals for the moderstaion status changes since i think zuza added that in yesterday, i dont remember seeing it before so it must have been new
○ and then yeah added a moderation-started and moderation-finished to the outcome history so it appears in the question card when that starts and finishes
○ and yeah a bunch of other smaller things
○ today im gonna continue with the live draft feature and also some note feature that i see in a design, which is only visible when a moderation has been completed
○ so yeah will work on both of that and yeah thats p much it - questions
○ so ur celebrating christmas tonight right
○ alright well merry christmas and enjoy ur 12 meals

Tuesday 23 December - Company
○ yesterday i worked on refactoring the question card component for evaluations and implemented the moderation statuses and started with the live draft share
○ today im gonna continue with that work for all outcomes and then move onto the spotlight feature - Dev
○ Yesterday just refactored the evaluation question card component to get rid of the outcome and comment fields that were there before and instead replace it to show the description guidance and evaluation history
○ Added the iutcome selector for the pass and other options
○ Added the moderation statuses and field and wrote the queries and mutations for them so that the start pause and end moderation actions work
○ And then made a start with the live outcome viewer
○ Oh also added the highlight field for applications idk if I mentioned that before the highlight action works
○ I've just implemented it as a boolean cos it does this for both evaluators right, idk if jayke did it like this but I was looking at his database and he had it as an object with the timestamp, the evaluator id and the evaluator name which idk why but yeah
○ So yeah today gonna finish that off and then move onto the spotlight action and sync for both the frontend and backend - questions
○ cors policy question
○ how come we dont set this for prod, i can see its enabled for staging so that our local environments and staging can access it but i didnt see it for prod
○ ODS (Operational Data Store) – near-real-time operational reporting
HTAP – hybrid transactional + analytical
○ RTAP (Real-Time Analytical Processing) – low-latency analytics on streaming data
○ what is an LSM tree - apparently designed for time series stuff
○ how does mongodb's bson compare to json, what are the main differences and advantages that
○
○ oh yeah i watched a video last night on how big tech is broken and it basically referenced what you mentioned in our 1 to 1 last week of meta engineers building features just to justify promotions
○ where basically to get a promotion you build out a complex microservices even tho the solution might be just something simple, just to meet the complexity requirements to reach that promo
○ promotion driven engineering
○ how do you even beat that tho cos obvs on the other side like a person wouldn't get a promotion if they haven't worked on anything complex enough
○
○ polish question - u said sz is sh and cz is ch and dz is ji right
○ so then how would you pronounce words that start with sh and ch and ji
○ like shout or cheat is that the same or would it be said differently
○ do you know any products that use a graph db
○ how are the connections formed between the nodes in a graph db

Monday 22 December - Weekend
○ yeah weekend was okay, not much just relaxed and watched a few movies now you see me and the founder which were both good, and ya read a bit and yeah
○ uhh \_\_\_ how was your weekend
○ jack - Company
○ on Friday had a 1 to 1 with krzys and worked on fixing some issues with the tabs on the dashboard and refactored the sidebar fold
○ today got cycle planning and im gonna continue working on the moderation view and start with the live outcome assignment work - Dev
○ on Friday i worked on implementing the cqs tab
○ and then moved onto fixing the applications tab too, the columns for the clinical, communisisng and moderation weren't being shown properly, had 3 bars instead of 2 and weren't designed properly it was from the direct award design
○ so yeah got that changed and then also refactored the fold to be like how its for evaluators
○ and then just made a start with the moderation mode, so got the moderation dates added to the schema and the evaluationhistory
○ and then added that moderation status to the header
○ so yeah today i'm gonna work on the live indicator for the outcome assignment for all the 3 outcomes so pass fail and draft cq
○ and then also implement the spotlight once thats done so prob this entire week since Thursday and Friday is bank holiday
○ so yeah thats pretty much it

Tuesday
Wednesday - omega 3, choline - creatine for sleep deprivation - ask about christmas - what do you do, how do you celebrate it in poland or is the same as in the UK - do you cook and everyone comes together - who hosts - how long does it take

Friday 19 December - Company
○ yesterday i worked on the admin evaluation page and implemented the statuses and the more option parts
○ today I'm gonna continue with that, got a 1 to 1 with krzys, and make a start with the moderation view
○ krzys, matt - Dev
○ yesterday I worked on the admin evluation side
○ so got the page built, added the progress bars
○ added the modal to assign evaluators to the application
○ added the steps and modals to start the moderation meeting
○ added the more options dropdown with the edit evaluators modal
○ added the progress bars to see progress of the evaluation for each evaluator
○ and then added the application sidebar fold to collapse the nav, which for some reason is different to how the provider one was done but yeah
○ so yeah today gonna work on the moderation mode, and actually working on the backend for this to store the moderation start state
○ and the live draft viewing when the evaluator adds the note when selecting the outcome
○ so yeah that's it for today
○ and same for the fail outcome
○ and then will also look into how to sync this with the provider view which I think we already went over jayke so should bef ine to do
○ will just need to look into how to do the white backdrop blur css when the moderation view is active
○ but yeah will look into that when i get onto it
○ so yeah will just work on that today, obviously wont get it all done today so this will probably be done over the next few days

Thursday 18 December - Company
○ yesterday I started working on building out the moderation board page and the popup for the invite system for the moderation pages
○ today im gonna start with implementing the statuses and more options stuff on the admin evaluation page and yh
○ george - Dev
○ yesterday worked on the frontend cos theres quite a bit that was not implemented yet so for now just started working on the moderation board view under the technical evaluations
○ created the moderatrion board component with the filters by section with application name filters and evaluator text filters
○ added sort by date dropdowns for newest and oldest first
○ added the table for the evaluation pairs, the in progress and ready for moderation
○ and using mock data for now but just created the layout for the evaluation pairs column, the in progress and ready for modeartion columns
○ and then yeah hooked all of this to nuqs
○ and then also worked on the drawer for the invite system so all the frontend for that, creating the form, the cards
○ so yeah both are pretty much done just need connecting to the backend
○ and then started with the status header on the admin evaluation page to assign evaluators
○ so yeah gonna continue with this today along with the more options stuff and adding the sidebar fold
○ and then once that's all done then I can move onto the moderation view if I get time
○ oh yeah also removed a lot of direct award stuff, not sure why but there was some components left over from there on the pages, some texts mentioning it, the search bar, so yeah got that all removed to match the design
○ but yeah that's pretty much it

Wednesday 17 December - Company
○ yesterday I started working on building out the moderation board page and the popup for the invite system for the moderation pages
○ today im gonna continue with that work and start with the statuses and more options part of the page - Dev
○ yesterday went over the game plan with jayke on how to split the work for this so im gonna do all the admin side and hes working on the provider bit and then yeah just went over everything we need to do which seems mostly fine so far
○ so yeah started with the frontend cos theres quite a bit that was not implemented yet so for now just started working on the moderation board view under the technical evaluations
○ created the moderatrion board component with the filters by section with application name filters and evaluator text filters
○ added sort by date dropdowns for newest and oldest first
○ added the table for the evaluation pairs, the in progress and ready for moderation
○ and using mock data for now but just created the layout for the evaluation pairs column, the in progress and ready for modeartion columns
○ and then yeah hooked all of this to nuqs
○ and then started creating the popup for the invite system and the status header on the evaluation page to assign evaluators
○ so yeah gonna continue with this today
○ and probably catchup with u jayke to see where we're at
○ oh yeah also removed a lot of direct award stuff, not sure why but there was some components left over from there on the pages, some texts mentioning it, the search bar, so yeah got that all removed to match the design
○ so yeah that's pretty much it

Tuesday 16 December - Company
○ on Friday had the in person event and was reading some blog posts on throttling
○ today im gonna work on the moderation view with jayke, break those pages down and make a start on that work
○ george, - Dev
○ short update, not much to say for Friday, while watching that convex video for the live cursor implementation that we were talking about
○ saw a mention of the single flighting throttling in the convex helpers page so was just reading that blog post to understand how it throttles those requests sent to the server
○ and yeah for today gonna chat with jayke on the moderation view and how we'll work on that and split the tasks up and put them up on linear if theres a project for it,
○ i think admin provider side is a good way like u mentioned but yeah we can talk more about it after this meeting
○ but yeah thats p much it for today

Thursday 11 December - Company
○ yesterday had uni and just continued working on implementing the missing components for the dashboard page and evaluation statuses and refactored some files
○ today im gonna continue with that work and then see what to work on next
○ kryzs, - Dev
○ not much to say
○ yesterday just had uni and then continued working on integrating those newly created components which i think im almost finished with now
○ so yeah got the dashboardheader, dashboardpage, the filter sorting, the progress stats, the progress bar
○ then the outcome stuff so the outcome stat, the list, and history
○ so yeah just worked on integrating this all into the pages, cos the progress stuff wasn't actually being rendered on the page
○ and for the evaluation progress added the financial and compliance progress bars, it showed the cq status but not those 2 stats so added that
○ and then yeah the outcome status flow i think is complete now
○ so yeah for today morning, just gonna test out all the pages that use these components and then yeah if its all good then i think that should be it
○ but yeah not sure if there is anything else to work on so yeah i might be free if nothing else pops up, I think everything on the accessibility side was done i'll look at that pr too and get that ready if not
○ but yeah if there is anything else then yeah let me know
○ technical evalutor on the evaluations side
○ and yeah thats pretty much it for today

Tuesday 9 December - Company
○ yesterday i had uni and worked on copying over and refactoring the missing dashboard and evaluation components for eprocurement
○ today gonna continue with that work and then got uni again after
○ zuza, jack, - Dev
○ not toooo much to say
○ yesterday I worked on creating the components for the outcome stat for the applications,
○ the outcome letter history and list,
○ refactored the providerhomepage to use those evaluations dashboard components built
○ and then watched a few videos on that react vulnerability, kinda crazy that someone even found this, and it was good of them to report it imagine if it was a bad actor they couldve insta destroyed hundreds of websites, i saw a few tweets from people that self hosted that got their websites hacked so yeah rip to them
○ but yeah for today gonna work on i think the dashboard header, not sure tbh but i'll see what else to work on and test my changes out
○ and also refactor some of the code cos i was reading the files and there was some try catches for convex mutations which weren't needed and other sorts of stuff so i'll try remove those extras pieces of code and do the same in the direct awards if it's there too
○ also questions - shouldn't we move all of these generic components like the nuqs filters for all the types like radio filter, text filter into some ui package at the root which we can then import from directly in both eproc and direct awards so we don't have this duplication in both places
○ and yh thats it

Friday 5 December - Company
○ yesterday i worked on more responsiveness and accessibility stuff on the admin side and worked on copying over the missing components on the eprocurement dashboard
○ today got a 1 to 1 with krzys and just gonna continue with that work
○ uhhh i think thats everyone - Dev
○ yesterday focused on the eprocurement mainly on the dashboard components, so started with refactoring the provider side hoempage
○ changed application card, outcome app card, withdrawn cards to use the base status pattern, same as in the direct awards
○ so when the app is submitted, it shows the evaluation status properly, if its in waiting, cqs, or late and the outcome letter progress
○ then moved onto admin side and worked on the evaluation dashboard there
○ added the progress stats, so not started, in progress etc, just copied the progress bar cards, filters, all the components to sync it together
○ and yeah kept the convex queries in place so no conflicts there
○ today just gonna continue with that, but for the outcome stat for the applications, the outcome letter history, the letter list, and yeah got a few other places that need working on
○ but yeah that's p much it for today

Thursday 4 December - Company
○ yesterday i had uni and worked on screen responsiveness and accessibility for the admin pages on eprocurement
○ today im gonna continue with that and see what else to work on next
○ krzys, george, , - Dev
○ not much to say yesterday had uni and then worked on the responsiveness for the admin side of eprocurement and just based things from the provider side and tried to replicate this on the admin side
○ so worked on the admin layouts and added responsiveness for the navbar to show a menu option just
○ updated the admin nav to have an onnavigate prop to close the drawer when links are clicked
○ then on the dashboard page, the table header and the status cards made some changes to the search input to adjut its min width
○ and adjusted the column widths
○ then changed the sidebars on the evaluation page too and yeah made more sizing breakpoint changes to the template page and procurementsdashboard
○ so yeah, notes is launched now so nothing else came from that no issues with that which is good
○ and then with this not sure what else to do, so yeah for the morning gonna check all the pages and make sure they're good
○ i was gonna ask jayke if he needed any help with the questionnaire export but think he has uni
○ but yeah apart from that im pretty free to work on anything else that is ready for development
○ but yeah thats p much it
○ eprocurement dashboard, missing components
○ when application is submited -> show evaluation status . e.g progress
○ status of outcome letter, progress

Tuesday 2 December - Company
○ yesterday i had uni and worked on a minor bug with the notes backend and added permissions for frimely commissioners
○ today gonna see whats remaining with accessibility and work on that and then got uni again after
○ krzys - got my team learning session today - Dev
○ not much to say, had uni
○ just fixed the permission issues and an issue with the notes not having new lines which i used controlledtext to fix but got it it fixed by using some css white space styling so its using the text area component again
○ and then yeah continued with accessibility, i don't think there's much left cos the provider side seems to be done
○ and the admin side not much to say just continuing it's top priority but yeah just wondering if there's anything of higher importance right now otherwise if not i'll just continue working on those pages and making them not mobile responsive but at least responsive
○ so yeah thats it
○ questionnaire export -> direct awards -> provider can download after they submit

Friday 28 November - Company
○ yesterday I worked on the testing feedback for the commissioner notes and continued with accessibility work for the form inputs and components
○ today got 1 to 1 with krzys, ai workshop, a coffee chat, and I'm just gonna continue with that work - no yeah im gonna do it next week on Tuesday - if asked -> yeah i can do tday - Dev
○ yesterday worked on those changes that i mentioned yesterday for the commissioner notes
○ updated permissions, updated styling based on testing, and updated some texts, and also added this notes for the sussex and frimely aqps too cos that was missing
○ and yeah
○ worked on adding a questiontype prop to the questioncard to identify which type and then changed the label handling with regular text to avoid having multiple labels for the same form input
○ and made the guidance and description accessible by using the tax index to tab on them and the role to make it screen reader accessible
○ and yeah just continued with some other aria labels in other places
○ today need to fix a bug with the backend for the notes not returning the icb
○ and then yeah not sure how much more accessibility work there is cos i just looked into those form inputs but yeah will see and just keep working on that just let me know jayke if theres
○ which we can prob go over during the 1 to 1 krzys

Thursday 26 November - Company
○ yesterday had uni and worked on the testing feedback for the commissioner notes
○ today just gonna continue with that and also continue with helping out jayke with the accessibility work for eprocurement
○ krzys, george - Dev
○ not much had uni yesterday and then just worked on the stuff brought up by zuza and kezia from testing
○ a few styling issues, one issue about the refetch not happening when making an update, and the other issue about permissions that wasn't correct
○ it's supposed to be based on the icb that posted the note
○ and that only one icb can post/view notes to start with
○ so yeah just worked on those issues, so need to finish that up this morning and then that should be it
○ didn't get much time for the accessibility work so i'll continue with that in the afternoon
○ and yeah that's pretty much it

Tuesday 25 November - Company
○ yesterday I had uni and worked on helping jayke out with the accessibility issues on the eprocurement and worked a bit on my team learning session too which I'll present on Thursday since it's not ready yet, almost there
○ today I have uni again and just going to continue with that accessibility work
○ yeah unfortunately I changed my presentation last minute so it's not quite ready yet, almost finished tho, so I'll present on Thursday instead of today - Dev
○ yesterday just worked on getting this team learning session ready
○ oh and for the commissioner notes I didn't realise but i didn't make an api for the id page
○ and also the design for that and needed to make some adjustments cos you couldn't add a note to a home unless it already contained notes so just got that cleared up with zuza
○ oh and also pushed a fix to the api returning the user object instead of the first name and last name so that got that fixed too
○ and then yeah spent some time looking into jaykes branch for the accessibility changes for the eprocurement
○ and just one question, I just did this during the standup now and it edited like 8 files in a min
○ but why don't we get an agent to do this for us or use cursors composer model or grok fast
○ cos those models are very quick and perfect for these small edits, and they can go through entire folders and add these aria labels for us
○ like we can just say we need to add aria labels or ids or props to every single component in these files, add these labels in and I'm pretty sure it can do it especially if we give it a background agent
○ actually i'll wait till you do ur update so u dont get skipped

Friday 21 November - Company
○ yesterday i worked on adding a delete note api and was testing the frontend to make sure it's all good and then spent time on the team learning session
○ today I'm gonna continue with that, got a 1 to 1 with krzys, and i'll see what to work on next
○ george, jack - i think krzys is going today, right, i'll go next week, probably on Thursday, since my slides aren't ready yet - i couldn't get my slides ready in time so i'll go next week on thursday - i'll - Dev
○ yesterday i just was testing the frontend and also making sure the backend was good
○ added a delete note endpoint and realised i didn't have an id field so quickly added that in
○ and also made sure it uses soft deletes so it's not permanently removed
○ so yeah just need the migration for this to be applied and then it's done
○ and then spent bit of time on the team learning session
○ so i have 3 ideas,
○ 2 are quite generic cos honestly couldn't think of anything more interesting to present
○ and then the final one is just an introduction to the uni project idea
○ so yeah what youre seeing rn is like the draft of the draft so very quick but yeah i'll just quickly go over each slide then u guys can tell me which is best to present
○ only reason i was against uni project idea is cos i've just submitted the proposal and it's early stage and my next Friday session is in march which so thought that would be a better time
○ idk i was overthinking it like realistically i can still do it now and then do an update session in march but yeah
○ but yeah as for today like i mentioned just the migrration needs ot be done and then this should be finished like i can hand it off for testing so no real work on my side so im free to work on anything that is there

Thursday 20 November - Company
○ yesterday i had uni and worked on creating the backend apis to add the commssioner notes for a home
○ today im gonna continue with that and do testing for it and then work on my team learning session too
○ milli, zuza, - Dev
○ not much to say,
○ yesterday i had uni and then just worked on adding the notes field to each home so that it stores the users name the date and the note itself
○ and then worked on creating an api to add a note to the home
○ and then modified the existing apis so that it also returns the note
○ so yeah just need to get this backend connected to the frontend now
○ so i'll let you know in a bit whne its ready for the migration so that i can test it on the frontend after and yeah should be done after that
○ so will be free to work on anything
○ and also need to focus on my Friday session today which im gonna do on Tuesday but i'll try get ready for tomorrow so we can review it during the dev standup
○ so yeah thats pretty much it

Tuesday 18 November - Company
○ yesterday i had uni and worked on the backend for the commissioner notes
○ today got uni again and just gonna continue with that work and get it finished off
○ george, krzys, jack, matt, simran, - if asked
○ yeah it was good, attended my cousins wedding which was amazing, met a lot of people, ate a ton of food pretty sure I gained 10 kilos just from that day and yeah it was a lot of fun lot of celebrations and yeah was nice
○ and met up with the grandad too and had some days out planned so got to spend some time with him too which was nice
○ and yeah good time off
○ The wedding was only for 3 days and I was out with my grandad for the other 2 days so really only 1 week but we had to do shopping and stuff and that took most of the time, one week. I went to like 10 different stores before I could find the fit I wanted
First day was mehndi
Second day was haldi
Third day was wedding and wedding night - Dev
○ not much to say
○ just spent time looking through all the changes made to the codebase and updating what i had
○ and fixing a weird issue with my laptop not being compatible with the security updates
○ and then yeah just looked back at my pr for the commissioner notes and continued with that
○ today got uni and just gonna continue with that
○ also got my Friday session presentation that i need to work on, wait krzys are you gonna do yours this Friday or some other day
○ cos i think im scheduled for this Friday but idk if its been shifted or not
○ also got a meeting with my supervisor for the project, I submitted the proposal for the memory project and that got approved a few days ago so good news for that
○ so yeah thats pretty much it for today - ask george about how to negotiate for rate and what rate he'd expect me to push for

Tuesday 28 October - Company
○ yesterday I had uni and starting working on the modal for the aqp notes feature
○ today I'm gonna continue with that and got my cdm, and then got uni again after
○ i think thats everyone now - Dev
○ not much to say yesterday had uni and started work the aqp notes functionality
○ just got starting on the modal and the card components for showing the notes
○ then just checked in with kezia regarding the timing functionality, basically in the emails matt mentions of time limiting the comments to 3 months of reviewing them every 3 months, so kezia just said to only show the recent 3 months for now.
○ so yeah when i fetch for them i'll just filter to make sure only notes created in the past 3 months are shown
○ then maybe in the future if we need to display them we can have an admin only thing that shows all notes if that's ever needed
○ but yeah and then for the supa, simran said on Friday that she'll continue testing as a frimely commissioner that wasn't done i assume
○ and also she said we may get feedback from commissioners for signed supas to be deletable too, but she said she'll check in with matt to confirm on that
○ so yeah i mean from my side until i hear back on that there was nothing left, few things were fixed on Friday but since then there's not been anything
○ so yeah for today got my cdm, then got uni in the afternoon
○ and whatever free time i have today and tomorrow afternoon after uni will just go towards the notes functionality.
○ im on leave for 2 weeks from Thursday so i should get that finished before Thursday.
○ i do have an extra uni meeting this week on Wednesday for the personal project so very limited on time but yeah i'll see should be okay

    	○

had a meeting with someone from uni so couldnt attend, tbh i wasnt involved in the referral portal project anyway and it was shown as optional for me so i thought it was ok to skip
