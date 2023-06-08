const axios = require("axios");
require('dotenv').config();
let YOUTUBE_API_KEY = process.env.YOUTUBE_API;
let EXTRA_YOUTUBE_KEYS = process.env.EXTRA_YOUTUBE_KEYS;

const VIDS_ON_PAGE = 50;
const converter = require("./dur-iso");

const ECONNRESET_TRIES = 2;

class Auditor {

    async postData(url, data, headers) {

        return axios.post(url, data, headers)
            .then(response => {
                return response.data;
            })
            .catch(error => {
                if (error.message === "Request failed with status code 403") {
                    console.log("Error 403 in request: time to switch to a new API key.");
                    console.log("Old key: " + YOUTUBE_API_KEY);
                    let keys = EXTRA_YOUTUBE_KEYS.split(",");
                    YOUTUBE_API_KEY = keys[0];
                    let temp = "";
                    for (let i = 1; i < keys.length; i++) {
                        temp += (keys[i] + ",");
                    }
                    EXTRA_YOUTUBE_KEYS = temp;
                    console.log("New key: " + YOUTUBE_API_KEY);
                    console.log("Extras: " + EXTRA_YOUTUBE_KEYS);

                    return "key swap needed";
                }
                throw error;
            });
    }
    async getData(url) {

        return axios.get(url)
            .then(response => {
                return response;
            })
            .catch(error => {
                if (error.message === "Request failed with status code 403") {
                    console.log("Error 403 in request: time to switch to a new API key.");
                    console.log("Old key: " + YOUTUBE_API_KEY);
                    let keys = EXTRA_YOUTUBE_KEYS.split(",");
                    YOUTUBE_API_KEY = keys[0];
                    let temp = "";
                    for (let i = 1; i < keys.length; i++) {
                        temp += (keys[i] + ",");
                    }
                    EXTRA_YOUTUBE_KEYS = temp;
                    console.log("New key: " + YOUTUBE_API_KEY);
                    console.log("Extras: " + EXTRA_YOUTUBE_KEYS);

                    return "key swap needed";
                }
                throw error;
            });
    }
    async auditChannel(channelId, format, pubAfter, pubBefore, foldName, previousInfo=undefined, retry=false) {

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

        if (previousInfo !== undefined) {
            resultsObj.numVid = previousInfo.videoCount;
            resultsObj.name = previousInfo.name;
            //resultsObj.numCap = previousInfo.capedVids;
            //resultsObj.totSec = previousInfo.secs;
            //resultsObj.secCap = previousInfo.capedSecs;

            let pagination = false;
            if (resultsObj.numVid > VIDS_ON_PAGE) {
                pagination = true;
            }

            return this.getVidIds(pagination, resultsObj, previousInfo.uploadPlaylistId, pubAfter, pubBefore, yearAft, monthAft, dayAft,
                yearBef, monthBef, dayBef, "")
                .then(allInfo => {
                    allInfo.numVid = previousInfo.videoCount;
                    return allInfo;
                });
        }

        let url = "https://youtube.googleapis.com/youtube/v3/channels?" +
            "key=" + YOUTUBE_API_KEY +
            "&id=" + channelId + "&part=snippet%2CcontentDetails%2Cstatistics";

        return this.getData(url)
            .then( response => {
                if (response === "key swap needed") {
                    if (retry) {
                        console.log("Key swap failed.")
                        throw Error("YouTube Auth Failed.")
                    } else {
                        console.log("New key: " + YOUTUBE_API_KEY);
                        return this.auditChannel(channelId, format, pubAfter, pubBefore, foldName, previousInfo, true);
                    }
                }

                let json = response.data;

                resultsObj.numVid = json.items[0].statistics.videoCount;
                resultsObj.name = json.items[0].snippet.title;
                let playlistId = json.items[0].contentDetails.relatedPlaylists.uploads;

                let pagination = false;
                if (resultsObj.numVid > VIDS_ON_PAGE) {
                    pagination = true;
                }

                return this.getVidIds(pagination, resultsObj, playlistId, pubAfter, pubBefore, yearAft, monthAft, dayAft,
                    yearBef, monthBef, dayBef, "");
            })
            .catch(error => {
                console.log(error.message);
                return "";
            });

    }

    async getVidInfo(id, tries=0, retry=false) {
        let url = "https://www.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2CliveStreamingDetails%2Cstatistics&" +
            "id=" + id + "&key=" + YOUTUBE_API_KEY;
        return axios.get(url)
            .then( json => {
                if (json === "key swap needed") {
                    if (retry) {
                        console.log("Key swap failed.")
                        throw Error("YouTube Auth Failed.")
                    } else {
                        console.log("New key: " + YOUTUBE_API_KEY);
                        return this.getVidInfo(id, tries, true);
                    }
                }

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

                //console.log("info: " + JSON.stringify(info));
                return info;
            })
            .catch( err => {
                console.log("This error was caught while getting the vid info", err.message);
                if (err.message === "read ECONNRESET" && tries < ECONNRESET_TRIES) {
                    console.log(`${id}: Trying again - ${tries}`)
                    return this.getVidInfo(id, tries + 1)
                } else if (err.message === "read ECONNRESET") {
                    console.log("Out of retries for ECONNRESET")
                }
                return "nope";
            });
    }

    async getVidIds(pagination, resultsObj, playlistId, pubAfter, pubBefore, yearAft, monthAft, dayAft,
                             yearBef, monthBef, dayBef, nextPageToken, retry=false) {
        let url = "https://youtube.googleapis.com/youtube/v3/playlistItems?playlistId=" + playlistId + "&key=" +
            YOUTUBE_API_KEY + "&maxResults=50&part=snippet%2CcontentDetails%2Cstatus";

        if (nextPageToken) {
            url += ("&pageToken=" + nextPageToken)
        }

        return this.getData(url)
            .then( response => {
                if (response === "key swap needed") {
                    if (retry) {
                        console.log("Key swap failed.")
                        throw Error("YouTube Auth Failed.")
                    } else {
                        console.log("New key: " + YOUTUBE_API_KEY);
                        return this.getVidIds(pagination, resultsObj, playlistId, pubAfter, pubBefore, yearAft, monthAft, dayAft,
                            yearBef, monthBef, dayBef, nextPageToken, true);
                    }
                }

                console.log(response.data)
                let json = response.data;

                for (let i = 0; i < json.items.length; i++) {

                    let id = json.items[i].snippet.resourceId.videoId;
                    let name = json.items[i].snippet.title;
                    //console.log(name);
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
                    //console.log("Andddd we're done");
                    return resultsObj;
                } else {
                    let newNextPageToken = json.nextPageToken;
                    if (newNextPageToken === undefined) {
                        //console.log("Andddd we're done");
                        return resultsObj;
                    }
                    return this.getVidIds(pagination, resultsObj, playlistId, pubAfter, pubBefore, yearAft, monthAft, dayAft,
                        yearBef, monthBef, dayBef, newNextPageToken);
                }
            });

    }
}

module.exports = Auditor;