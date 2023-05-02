require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const converter = require("../frontend/src/assets/dur-iso");
const app = express();
app.use(bodyParser.json());

const cors = require('cors');
app.use(cors({
    origin: 'http://localhost:8080'
}));

const YOUTUBE_API_KEY = process.env.YOUTUBE_API;


app.get('/', (req, res) => {
    res.send("Heyyyyy friends");
});

app.post("/", function(req, res) {
    console.log(req.body);
    let resultsObj = auditChannel(req.body.channelId, req.body.format, req.body.pubAfter, req.body.pubAfter);
    res.status(200).json({result: resultsObj});
})

async function auditChannel(channelId, format, pubAfter, pubBefore) {

    console.log("Auditing " + channelId);
    console.log(channelId, format, pubAfter, pubBefore);

    if (pubAfter) {
        var yearAft = parseInt(pubAfter.substring(0, 4));
        var monthAft = parseInt(pubAfter.substring(5, 7));
        var dayAft = parseInt(pubAfter.substring(8));
    }

    if (pubBefore) {
        var yearBef = parseInt(pubBefore.substring(0, 4));
        var monthBef = parseInt(pubBefore.substring(5, 7));
        var dayBef = parseInt(pubBefore.substring(8));
    }

    let resultsObj = {numVid: 0, name: "", numCap: 0, totSec: 0, secCap: 0, vidInfo: []}

    let url = "https://youtube.googleapis.com/youtube/v3/channels?" +
        "key=" + YOUTUBE_API_KEY +
        "&id=" + channelId + "&part=snippet%2CcontentDetails%2Cstatistics";
    let indicesToDelete = [];

    try {
        return fetch(url)
            .then( response => response.json() )
            .then( json => {
                resultsObj.numVid = json.items[0].statistics.videoCount;
                resultsObj.name = json.items[0].snippet.title;
                let playlistId = json.items[0].contentDetails.relatedPlaylists.uploads;

                //Getting the playlist item info
                url = "https://youtube.googleapis.com/youtube/v3/playlistItems?playlistId=" + playlistId + "&key=" +
                    YOUTUBE_API_KEY + "&maxResults=50&part=snippet%2CcontentDetails%2Cstatus";

                console.log(url);
                return fetch(url);
            })
            .then( response => response.json() )
            .then( json => {

                for (let i = 0; i < json.items.length; i++) {

                    //console.log(json);

                    let id = json.items[i].snippet.resourceId.videoId;
                    let name = json.items[i].snippet.title;
                    console.log(name);
                    let dateUploaded = json.items[i].snippet.publishedAt;

                    //date filtering:
                    if (pubAfter) {
                        if (parseInt(dateUploaded.substring(0, 4)) < yearAft) {
                            console.log(name + " is before the year range, moving on.")
                            resultsObj.numVid--;
                            continue;
                        } else if (parseInt(dateUploaded.substring(0, 4)) === yearAft) {
                            if (parseInt(dateUploaded.substring(5, 7)) < monthAft) {
                                console.log(name + " is before the month range, moving on.")
                                resultsObj.numVid--;
                                continue;
                            } else if (parseInt(dateUploaded.substring(5, 7)) === monthAft) {
                                if (parseInt(dateUploaded.substring(8, 10)) < dayAft) {
                                    console.log(name + " is before the day range, moving on.")
                                    resultsObj.numVid--;
                                    continue;
                                }
                            }
                        }
                    }

                    if (pubBefore) {
                        if (parseInt(dateUploaded.substring(0, 4)) > yearBef) {
                            console.log(name + " is after the year range, moving on.")
                            resultsObj.numVid--;
                            continue;
                        } else if (parseInt(dateUploaded.substring(0, 4)) === yearBef) {
                            if (parseInt(dateUploaded.substring(5, 7)) > monthBef) {
                                console.log(name + " is after the date month because " + dateUploaded.substring(5, 7) + " is greater than " + monthBef);
                                resultsObj.numVid--;
                                continue;
                            } else if (parseInt(dateUploaded.substring(5, 7)) === monthBef) {
                                if (parseInt(dateUploaded.substring(8, 10)) > dayBef) {
                                    console.log(name + " is after the day range, moving on.")
                                    resultsObj.numVid--;
                                    continue;
                                }
                            }
                        }
                    }

                    url = "https://www.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2CliveStreamingDetails%2Cstatistics&" +
                        "id=" + id + "&key=" + YOUTUBE_API_KEY;

                    resultsObj.vidInfo.push(fetch(url)
                        .then( response => response.json() )
                        .then( json => {

                            let durISO = json.items[0].contentDetails.duration;
                            let formatted = converter.convertYouTubeDuration(durISO);
                            //console.log(formatted);

                            let info = {title: json.items[0].snippet.title,
                                url: "https://www.youtube.com/watch?v=" + json.items[0].id,
                                date: json.items[0].snippet.publishedAt.substring(0, json.items[0].snippet.publishedAt.indexOf("T")),
                                dur: formatted, rawDur: durISO,
                                views: json.items[0].statistics.viewCount, profile: "No"};

                            if (json.items[0].hasOwnProperty('liveStreamingDetails')) {
                                console.log("Found a live stream");
                                info.profile = "Yes";
                            }

                            if (converter.convertToSecond(info.rawDur) === 0 && info.views === "0") {
                                console.log("Deleting video " + info.title);
                                return "nope";
                            }

                            if (json.items[0].contentDetails.caption) {
                                info.cap = "Yes";
                                resultsObj.numCap += 1;
                            } else {
                                info.cap = "No";
                            }

                            return info;
                        })
                    );

                }
                return resultsObj;
            })


    } catch (error) {
        console.log(error.message);
        return "";
    }

}

const server = app.listen(8000, () => {
    console.log('Running at 8000');
});