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

const FOLDER_IDS = {

}

const TEST_FOLDER_IDS = {
    "Test 1": "1-zaZ8NACPMCdOKMosR-mei-TjEA77i3W",
    "Test 2": "1CdXZn20E2jhsLpzH3oH-dpsxTpBP27Fx",
}

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
    //console.log("About to print the vid params")
    //console.log(req.body);

    getVidInfo(req.body.id, req.body.sheetId, req.body.vidNum)
        .then( results => {
            console.log(results);
            return res.status(200).json({result: results});
        }).catch( err => {
            console.log(err);
            return res.status(500).json({result: "Error: channel audit failed"});
        });
})

app.post("/create-sheet", function (req, res) {
    console.log("Creating a sheet")

    let name = req.body.name;
    let foldName = req.body.foldName;

    //TODO: get folder id from foldName
    //let folderId = "13h-35-rhh0Rl9lGn7F9eYYttPXvAulyk";
    let folderId = TEST_FOLDER_IDS[foldName];

    if (!foldName) {
        return res.status(200).json({id: "You don't need thatttt"});
    }

    let jwtClient = authorizeGoogle();

    const sheets = google.sheets({version: 'v4', auth: jwtClient});

    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();

    let title = year + "-" + month + "-" + date + " " + name

    const resource = {
        properties: {
            title: title,
        },
    };
    sheets.spreadsheets.create({
        resource,
        fields: 'spreadsheetId',
    }, function (err, response) {
        if (err) {
            console.log(err);
        } else {
            moveSheet(response.data.spreadsheetId, folderId, jwtClient);
            addHeader(response.data.spreadsheetId, jwtClient);
            formatSheet(response.data.spreadsheetId, jwtClient);
            return res.status(200).json({id: response.data.spreadsheetId});
        }
    });
})

async function getVidInfo(id, sheetId, vidNum) {
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

                if (sheetId) {
                    addRow(sheetId, JSON.stringify(info), vidNum);
                }

                //console.log("info: " + JSON.stringify(info));
                return info;
            });
}

async function addRow(fileId, info, vidNum) {
    info = JSON.parse(info);
    //console.log("Adding a new row for " + info.title);

    let jwtClient = authorizeGoogle();
    let sheets = google.sheets({version: 'v4', auth: jwtClient});

    let linkTitle = '=HYPERLINK("' + info.url + '", "' + info.title + '")';

    let values = [
        [linkTitle, info.date, info.dur, info.cap, info.views, info.profile]
    ];
    const resource = {
        values,
    };

    let range = "Sheet1!A" + (vidNum + 2) + ":F" + (vidNum + 2);

    sheets.spreadsheets.values.append({
        spreadsheetId: fileId,
        range: range,
        valueInputOption: "user_entered",
        resource: resource
    }, function (err, response) {
        if (err) {
            console.log('The API returned an error. ' + err);
        } else {
            //console.log('Result:');
            //console.log(response.data)
        }
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

            return getVidIds(pagination, resultsObj, playlistId, pubAfter, pubBefore, yearAft, monthAft, dayAft,
                yearBef, monthBef, dayBef, "");
        })
        .catch(error => {
            console.log(error.message);
            return "";
    });

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

async function moveSheet(id, folderId, jwtClient) {
    //let jwtClient = authorizeGoogle();
    const service = google.drive({version: 'v3', auth: jwtClient});
    try {
        // Retrieve the existing parents to remove
        const file = await service.files.get({
            fileId: id,
            fields: 'parents',
        });

        // Move the file to the new folder
        const previousParents = file.data.parents
            .join(',');
        const files = await service.files.update({
            fileId: id,
            addParents: folderId,
            removeParents: previousParents,
            fields: 'id, parents',
        });
        //console.log(files.status);
        //console.log("Here is the spreadsheet id from within moveSheet: " + id);
    } catch (err) {
        console.log(err);
        //throw err;
    }
}

async function addHeader(id, jwtClient) {
    let sheets = google.sheets({version: 'v4', auth: jwtClient});

    let values = [
        ["Video Title", "Date", "Duration", "Captioned", "Views", "Live Stream"]
    ];
    const resource = {
        values,
    };

    let range = "Sheet1!A1:F1";

    sheets.spreadsheets.values.append({
        spreadsheetId: id,
        range: range,
        valueInputOption: "user_entered",
        resource: resource
    }, function (err, response) {
        if (err) {
            console.log('The API returned an error. ' + err);
        } else {
            //console.log('Result:');
            //console.log(response.data)
        }
    });
}

async function formatSheet(id, jwtClient) {
    let service = google.sheets({version: 'v4', auth: jwtClient});
    const myRange = {
        sheetId: 0
    };
    const headerRange = {
        sheetId: 0,
        startRowIndex: 0,
        endRowIndex: 1,
        startColumnIndex: 0
    }
    const requests = [
        {
            addConditionalFormatRule: {
                rule: {
                    ranges: [myRange],
                    booleanRule: {
                        condition: {
                            type: 'TEXT_EQ',
                            values: [{userEnteredValue: 'Yes'}],
                        },
                        format: {
                            textFormat: {foregroundColor: {green: 0.6}},
                        },
                    },
                },
                index: 0,
            },
        },
        {
            addConditionalFormatRule: {
                rule: {
                    ranges: [myRange],
                    booleanRule: {
                        condition: {
                            type: 'TEXT_EQ',
                            values: [{userEnteredValue: 'No'}],
                        },
                        format: {
                            textFormat: {foregroundColor: {red: 0.8}},
                        },
                    },
                },
                index: 1,
            },
        },
        {
            addConditionalFormatRule: {
                rule: {
                    ranges: [headerRange],
                    booleanRule: {
                        condition: {
                            type: 'NOT_BLANK',
                        },
                        format: {
                            textFormat: {bold: true},
                        },
                    },
                },
                index: 2,
            },
        },
        {
            updateSheetProperties: {
                properties: {
                    sheetId: 0,
                    gridProperties: {
                        frozenRowCount: 1
                    }
                },
                fields: "gridProperties.frozenRowCount"
            }
        }
    ];
    const resource = {
        requests,
    };
    try {
        const response = await service.spreadsheets.batchUpdate({
            spreadsheetId: id,
            resource,
        });
        //console.log(`${response.data.replies.length} cells updated.`);
        return response;
    } catch (err) {
        console.log(err);
        //throw err;
    }

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

const server = app.listen(8000, () => {
    console.log('Running at 8000');
});