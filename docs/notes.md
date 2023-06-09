# YouTube Caption Check Tool (YCCT)
Digital Accessibility Services - Utah State University
* Created by Emma Lynn (e.lynn@usu.edu)
* Supervised by Christopher Phillips, Electronic & Information Technology Accessibility Coordinator (christopher.phillips@usu.edu)
* On request from Christopher Phillips, Electronic & Information Technology Accessibility Coordinator & Megan Spackman, Caption Program Coordinator

## Project Specs from Megan
### Current Process
* [Overview Video](https://www.loom.com/share/b901ee3be49b4ade8302780633df7195)
* After getting all the overall channel information, we currently have to run a report using the YTCA tool for each channel to get a list of videos the captioned videos, seconds, seconds uncaptioned, the date published, and views that displays as an HTML table.
* We currently have 7 different YouTube API keys that we shuffle through to be able to check all of our videos. Ideally, at some point in the process that switching of API keys could happen automatically OR we get our quota increased from Google (difficult process).
* This report is then copied and pasted into a Google Sheet in a folder for that channel, and then we take the summary information we need and copy and paste it into the Monday board. We then move the previous report to an archives folder  (as you can see a lot of manual work). Here is a video showing this process:  
### Goals
* The goal would be to automate the entire process as much as possible. This would require checking individual videos on each channel. We are hopeful that we can increase our API limit, but may need a solution in the short-term where we cycle through multiple API keys. Here are some thoughts on how to do this:
  * Create YouTube Channel Caption Information Application Service
    * The current YTCA tool is a web app where we manually add channel ID and then it retrieves all the information, however that tool is buggy and has a number of issues that we have struggled to fix. We would like to rewrite this general purpose tool to better meet our specific needs.
    * While we may leverage Monday with this tool - the goal would be to build this as a separate web app outside of Monday that has an API that we could call using Monday.
  * Monday
    * Once the service is built - have a process/button in Monday that works with the current “Update now” button that kicks off this part of the process to pull detailed information from Monday and then pull the relevant summary of that detailed report back into Monday.

### Minimum Viable Product
### Phase 1
Build replacement YTCA functionality. You can see/tryout the current YTCA Tool [here](https://elearn.usu.edu/accessibility/ytca/1/).
* Rebuild the functionality of the current YTCA tool with a more limited feature set we think will only need the following fields:

<img src="1.png"/>

* YouTube Channel:
  * YouTube Channel ID: Code provided by YouTube to identify channel
* Output:
  * Format: HTML
* Dates:
  * Published after (YYYY-MM-DD): We use these dates to divide channels that have a large amount of videos into certain time ranges.
  * Published before (YYYY-MM-DD):
  
* We can also update the user interface for this to use something like Bootstrap.
* When you press submit it would create a report in an HTML table like in [this example](https://elearn.usu.edu/accessibility/ytca/1/ytca.php?channelid=UCp_UB-VevoEj0BUKPVieTYA&channels=&report=details&output=&filtertype=&filtervalue=&date-start=&date-end=&debug=0&submit=Submit) that would include the following information:

<img src="2.png"/>

* Summary Information:
  * Number of videos
  * Number captioned
  * Total seconds
  * Seconds captioned
* Table Information:
  * Video Title
  * Date
  * Duration
  * Captioned
  * Views
* Determine if we can pull information on whether a video is unlisted or not. If so, add that information to the report.
  
### Phase 2
Create an API for the report in Phase 1 and create a new output to Google Sheets.
* Currently, the YTCA tool provides us the information in an HTML format that we then copy into Google Sheets.
  * We are hopeful a tool might be built to publish directly to Google Sheets with the table information shown in the Channel Caption Info Report.
    * Have a “Google Sheets” format option in the YouTube Caption Info interface.
    * Be able to select the folder destination - so we would somehow have to link the Google Drive folder with this.
    * When we hit submit in the interface, have it automatically populate a new Google Sheet with the table information.

    * <img src="3.png"/>
    * The name of the document should be “DATE REPORT PULLED + YOUTUBE CHANNEL NAME”

### Phase 3
Create a trigger in Monday that will kick off the process to run a report that will create a Google Sheet for channels with new videos and update the detailed summary information:

* Update the current automation so that if new videos have been detected since it last ran (Most Recent Video), then run the YouTube channel caption tool, create Google Sheet, and update Monday information.
  * Steps:
    * IF New video exists since last update THEN sent Import Channel ID to YouTube Channel Caption Info.
    * Generate a report and add to Google Sheet.
    * Update Monday board information
      * For the Monday board the information we need:
        * Videos captioned
        * Seconds (or minutes/hours)
        * Seconds captioned (We don’t necessarily have to do seconds, it can be minutes or hours if that’s easier.)
          * These all come from the report generated from YTCA.
          * <img src="4.png"/>
      * There are other columns in Monday, but they are generated based off these three columns. (Seconds uncaptioned, hours uncaptioned, caption everything cost). 

<img src="5.png"/>


## Progress/Notes

### 4.17.23
* Read through project requirements
* Started setting up shell vue project

### 4.18.23
* Finishing todos tutorial
* Beginning to adapt UI

### 4.19.23
* Created dashboard UI

### 4.20.23
* Starting to get YouTube info
* It looks like the original YTCA uses the search queries :/
  * Running it on USU Opera costs 123 units
  * I believe running my tool (when it is complete) on USU Opera will only cost 6 units!!
  * Cool cool cool

### 4.21.23
* Added the rest of the channel summary data

### 4.24.23
* Fixed duration formatting
* Fixed pagination issue for getting playlist item ids
* Added USU favicon
* Input validation
* Added date filtering
* Added back button

### 4.25.23
* Added download button
* Added warning for leaving the page without saving
* Worked on some of the inconsistency problems (Aggie Radio, Men's Volleyball)
  * Currently trying to remove video with a duration of 0 sec from the data

### 4.26.23
* Fixed picking up "nonexistent" videos problem
* Added check if was live stream
* Phase 1 complete

### 5.2.23
* Starting phase 1.5 - converting backend to API

### 5.4.23
* Finished converting backend to API
* Working on stopping at 50 pagination problem
* Converted backend to use axios

### 5.5.23
* Fixed pagination problem
* Ran into an issue with Chrome - POST (server url) net::ERR_INSUFFICIENT_RESOURCES
  * Wasn't a problem with 700ish videos, was with 1400ish videos

### 5.8.23
* Started working on phase 2
* I think I need to wait for google drive permissions to propagate through the system so I'll come back to this
* Working on getting drive api to work

### 5.9.23
* Creating and naming the spreadsheet is working, now working on filling it in and formatting it
* Spreadsheets filled in and formatted

### 5.10.23
* Fixed issues with spreadsheets and minimized API calls needed
* Add folder ids for production folders
* Finished with phase 2

### 5.11.23
* Beginning on phase 3

### 5.12.23
* Adapting MondayYoutube code for this project
* Refactored backend some
* Kept working on enabling webhook functionality

### 5.17.23
* Working more on the webhook
* Current issue: how do we get the sheet id and the individual video info at the same time to fill in the sheet??

### 5.18.23
* Finished implementing webhook feature
* Added usage docs

### 5.19.23
* Fixed strange README formatting
* Added license
* Troubleshooting ECONNRESET error
  * I think it must be something to do with channels that have a lot of videos
  * Observed on `Empower Teaching` (318) and `College of Humanities...` (277) with webhook
  * Only observed when the channel needs a full audit
  * Not observed for `College of Humanities...` using GUI - even with creating sheet
  * ECONNRESET is now being caught and marked as an error so it will not crash the server anymore - 
  still not sure how to fix it tho
  * Sheet is created but filling it in fails
    * But only from the webhook for whatever reason- it works with the GUI
  * Not observed for `Ecology Center` with 130 videos
  * Observed for `College of Engineering` with 180 videos
  * Observed for `Campus Recreation` with 161 videos
  * One of the videos: `Promise { <rejected> [AxiosError] }`
    * That could be the issue because `Promise.all` will fail if any promise rejects
  * With `Campus Recreation`:
    * Failed for 77 videos cause of ECONNRESET error
* Fixed double quote sheets formula parsing error

### 5.23.23
* Still working on ECONNRESET error
  * Tried allowing it to try again which seems to help but it doesn't solve the issue
  * This might be helpful: https://dev.to/karataev/handling-a-lot-of-requests-in-javascript-with-promises-1kbb
    * "The point is that Node can't handle a lot of connections at the same time and we need to rethink the solution."
    * Can I somehow force the function to get the vid info one at a time, and not concurrently in a for loop??? Hmmm

### 5.31.23
* Changing name to YouTube Caption Check Tool
* Working more on ECONNRESET error
  * Not observed on `Campus Rec`
  * Initially observed on `College of Humanities` but caught successfully by retry
  * Completely failed on `Empower Teaching`- no courses found
  * Tried again with `College of Humanities` and mostly failed

### 6.1.23
* Prepped a demo for Megan
  * Rescheduled
* Worked more on filtering requests
  * Tried on Campus Recreation, only got 43 videos - still ECONNRESET
  * Tried again, only got 21
* I wonder if I also need to filter resolving the promises
* Tried to fix that too and still only got 75 videos
* It seems to be doing a little better- but still not consistently good :(

### 6.5.23
* Tried to follow this instructions [here](https://stackoverflow.com/questions/53340878/econnreset-in-express-js-node-js-with-multiple-requests) to fix ECONNRESET but they didn't work
* Asked the dli-coding-projects slack channel for help
  * Carter thought I could try adding a wait between requests
  * Or maybe try axios interceptors
* Adding the throttle works!!
* Fixed the negative uncaptioned seconds issue
  * I think that maybe time for videos that were originally live streams got left out of the original count

### 6.8.23
* Looking at large channel repetition error
  * Observed on Extension (1666), Extension Forestry (but not the first time) (465), UtahStateAthletics (1488), Huntsman Business School (712)
  * Tried again with Extension Forestry and not observed
  * Tried again with Huntsman Business School and not observed
* Finally hit quota limit of API key
* Added error handling for hitting quota limits
* Going back to repetition error
  * Tried again with Extension Forestry and not observed
  * Tried again with Huntsman Business School and not observed
  * Tried again with UtahStateAthletics and observed
    * Didn't really see anything in the logs of why that could be happening
    * No obvious repetitions

### 6.9.23
* Changed client to send data in chunks to the server to be added to the sheet
* Tested UtahStateAthletics with web application
  * Repetition problem not observed I don't think but there is a different problem
    * Big gaps in the sheet
    * I think it's probably something to do with the offsets used to keep data from getting overwritten

### 6.13.23
* Remaining issues:
  * Duplication in large sheets - webhook
    * Only observed in channels with more than 1000 videos- `Extension` and `UtahStateAthletics`
  * Big gaps in large sheets - GUI
    * Only observed in channels with more than 1000 videos- `Extension` and `UtahStateAthletics`
* They could be something with having to extend the sheet??
* Added a call to increase the sheet size before adding - that seems to have fixed the duplication problem!!
  * I'll try adding it to the GUI as well to see if that helps with its problem
  * Wellll it didn't exactly work- I think I might just continue and fix it in a later version since I think they would rather have the tool sooner than wait longer for a feature to work that they probably won't use much.

### 6.15.23
* Got permissions and deployed frontend
  * Tested with local server
* Started setting up backend deployment

### 6.16.23
* Worked on backend deployment
  * Things seem to be going okay, while using the webhook I'm having a few of the same async/response sending issues that I had with
  the last YouTube tool, but I'm working through them.
  * The web application seems to be working good.
* The webhook won't fill the sheet with data
  * It seems like AWS is pickier about how your async stuff works than running it locally is

### 6.21.23
* Worked on deployment async issues on backend
* Fixed sheet not filling in issue
* Now having the duplication issue again
  * Not observed in the GUI
  * Observed with `55` videos
    * Not with `25`
    * Not with `33`
  * I'm guessing it's something to do with the video chunks
  * With `QCNRUSU`, each video is list twice
  * Adds each video for every vid chunk that is made
  * Okay fixed it, it looks like something just got messed up with adding the chunks
    * I'm going to try to remove the chunk feature because I think we might not need it
* Increased the waiting time a little bit just to ensure the function has enough time to execute
* Tested bulk update and GUI again
* I think we're just about done and ready to release this version!!!
* Updating docs
* 

## TODO

Next version:
* Google drive folder selection
* Table formatting
* Fix large channel (1000+ vids) GUI google sheet
* Different updated and already up to date statuses
* Big refactor
* Faster web application performance
* Bug report form

## Sources/References

Vue
* https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Client-side_JavaScript_frameworks/Vue_getting_started

HTML
* Download current page: https://stackoverflow.com/questions/26219180/download-current-html-file

YouTube
* Pagination: https://stackoverflow.com/questions/49693727/youtube-api-playlist-video-restricted-to-50-how-do-i-fetch-more

Google Drive/Sheets:
* https://developers.google.com/sheets/api/guides/create 
* https://developers.google.com/drive/api/guides/folder#create_a_file_in_a_folder



