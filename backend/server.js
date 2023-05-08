require('dotenv').config();

const {google} = require('googleapis');
let privatekey = require("./service_account.json");

const express = require('express');
const bodyParser = require('body-parser');
const converter = require("../frontend/src/assets/dur-iso");
const app = express();
app.use(bodyParser.json());

const axios = require('axios');

const cors = require('cors');
app.use(cors({
    origin: 'http://localhost:8080'
}));

const YOUTUBE_API_KEY = process.env.YOUTUBE_API;
const VIDS_ON_PAGE = 50;

app.get('/', (req, res) => {
    res.send("Heyyyyy friends");
});

app.post("/", function(req, res) {
    console.log(req.body);

    auditChannel(req.body.channelId, req.body.format, req.body.pubAfter, req.body.pubAfter, req.body.foldName)
        .then( results => {
            console.log(results);
            return res.status(200).json({result: results});
        }).catch( err => {
            console.log(err);
        return res.status(500).json({result: "Error: channel audit failed"});
    });
})

app.post("/get-vid-info", function(req, res) {
    console.log("About to print the vid params")
    console.log(req.body);

    getVidInfo(req.body.id, req.body.foldName)
        .then( results => {
            console.log(results);
            return res.status(200).json({result: results});
        }).catch( err => {
            console.log(err);
            return res.status(500).json({result: "Error: channel audit failed"});
        });
})

async function getVidInfo(id, foldName) {
    let url = "https://www.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2CliveStreamingDetails%2Cstatistics&" +
        "id=" + id + "&key=" + YOUTUBE_API_KEY;
    return axios.get(url)
            .then( json => {
                let durISO = json.data.items[0].contentDetails.duration;
                let formatted = converter.convertYouTubeDuration(durISO);
                //console.log(formatted);

                let info = {title: json.data.items[0].snippet.title,
                    url: "https://www.youtube.com/watch?v=" + json.data.items[0].id,
                    date: json.data.items[0].snippet.publishedAt.substring(0, json.data.items[0].snippet.publishedAt.indexOf("T")),
                    dur: formatted, rawDur: durISO,
                    views: json.data.items[0].statistics.viewCount, profile: "No"};

                if (json.data.items[0].hasOwnProperty('liveStreamingDetails')) {
                    console.log("Found a live stream");
                    info.profile = "Yes";
                }

                if (converter.convertToSecond(info.rawDur) === 0 && info.views === "0") {
                    console.log("Deleting video " + info.title);
                    return "nope";
                }

                if (json.data.items[0].contentDetails.caption) {
                    info.cap = "Yes";
                } else {
                    info.cap = "No";
                }

                if (foldName) {
                    createRow(foldName, JSON.stringify(info))
                }

                //console.log("info: " + JSON.stringify(info));
                return info;
            });
}

async function auditChannel(channelId, format, pubAfter, pubBefore, foldName) {

    console.log("Auditing " + channelId);
    console.log(channelId, format, pubAfter, pubBefore, foldName);

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

    let resultsObj = {numVid: 0, name: "", numCap: 0, totSec: 0, secCap: 0, vidIds: []}

    let url = "https://youtube.googleapis.com/youtube/v3/channels?" +
        "key=" + YOUTUBE_API_KEY +
        "&id=" + channelId + "&part=snippet%2CcontentDetails%2Cstatistics";

    try {
        return axios.get(url)
            .then( response => {
                let json = response.data;

                resultsObj.numVid = json.items[0].statistics.videoCount;
                resultsObj.name = json.items[0].snippet.title;
                let playlistId = json.items[0].contentDetails.relatedPlaylists.uploads;

                let pagination = false;
                if (resultsObj.numVid > VIDS_ON_PAGE) {
                    pagination = true;
                }

                createSheet(foldName, resultsObj.name);

                return getVidIds(pagination, resultsObj, playlistId, pubAfter, pubBefore, yearAft, monthAft, dayAft,
                    yearBef, monthBef, dayBef, "");})

    } catch (error) {
        console.log(error.message);
        return "";
    }

}

async function getVidIds(pagination, resultsObj, playlistId, pubAfter, pubBefore, yearAft, monthAft, dayAft,
                         yearBef, monthBef, dayBef, nextPageToken) {
    let url = "https://youtube.googleapis.com/youtube/v3/playlistItems?playlistId=" + playlistId + "&key=" +
        YOUTUBE_API_KEY + "&maxResults=50&part=snippet%2CcontentDetails%2Cstatus";

    if (nextPageToken) {
        url += ("&pageToken=" + nextPageToken)
    }

    return axios.get(url)
        .then( response => {
            let json = response.data;

            for (let i = 0; i < json.items.length; i++) {

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

                resultsObj.vidIds.push(id);
            }

            if (!pagination) {
                console.log("Andddd we're done");
                return resultsObj;
            } else {
                let newNextPageToken = json.nextPageToken;
                if (newNextPageToken === undefined) {
                    console.log("Andddd we're done");
                    return resultsObj;
                }
                return getVidIds(pagination, resultsObj, playlistId, pubAfter, pubBefore, yearAft, monthAft, dayAft,
                    yearBef, monthBef, dayBef, newNextPageToken);
            }
        })

}

async function createSheet(foldName, name) {
    console.log("Creating the sheet for " + name + " in " + foldName);

    let jwtClient = authorizeGoogle();

    const service = google.drive({version: 'v3', jwtClient});

    let folderId = "13h-35-rhh0Rl9lGn7F9eYYttPXvAulyk";


    const fileMetadata = {
        name: 'Test file',
        parents: [folderId],
    };
    const media = {
        mimeType: 'application/vnd.google-apps.spreadsheet',
        /*body: fs.createReadStream('files/photo.jpg'),*/
    };

    service.files.create({
        auth: jwtClient,
        resource: fileMetadata,
        media: media,
        fields: 'id'
    }, function (err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
        } else {
            console.log('File Id:', response.data.id);
            return response.data.id;
        }
    });


    /*
    READING:
    let spreadsheetId = '1-YV9BR1TVWMeheoMdNoHSVSEnfOK1Qge0bMVCT0SL_8';
    let sheetName = 'Test!A1:B14'
    let sheets = google.sheets('v4');

    sheets.spreadsheets.values.get({
        auth: jwtClient,
        spreadsheetId: spreadsheetId,
        range: sheetName
    }, function (err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
        } else {
            console.log('List from Google Sheets:');
            console.log(response.data.values)
        }
    });*/
}

function authorizeGoogle() {
    let jwtClient = new google.auth.JWT(
        privatekey.client_email,
        null,
        privatekey.private_key,
        ['https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/drive.metadata']);
    //authenticate request
    jwtClient.authorize(function (err, tokens) {
        if (err) {
            console.log(err);
        } else {
            console.log("Successfully connected!");
        }
    });
    return jwtClient;
}

async function createRow(foldName, info) {
    //console.log("Creating a new row with " + info);
    let jwtClient = authorizeGoogle();
    let sheets = google.sheets({version: 'v4', jwtClient});

    //TODO: currently modifying to follow this example: https://developers.google.com/sheets/api/guides/values

    let fileId = "1SkNgZZZ-LNdGogmh95yAfFWXba6CFL43";

    let values = [
        ["Cool", "wow", "fun"],
        ["bagel", "bagel", "bagel"]
    ];
    const resource = {
        values,
    };

    sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: sheetName
    }, function (err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
        } else {
            console.log('List from Google Sheets:');
            console.log(response.data.values)
        }
    });

}

const server = app.listen(8000, () => {
    console.log('Running at 8000');
});