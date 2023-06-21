const UpdateMonday = require("./update-monday");
const updateMonday = new UpdateMonday();
let YOUTUBE_API_KEY = process.env.YOUTUBE_API;
let EXTRA_YOUTUBE_KEYS = process.env.EXTRA_YOUTUBE_KEYS;
const axios = require('axios');

class GetChannelInfo {

    async updateChannelInfo(res, channelInfo) {

        return this.makeChannelAPICall(res, channelInfo);
    }

    async getData(url, data) {
        return axios.get(url)
            .then(response => {
                return response.data;
            })
            .catch(error => {
                console.log("Error caught in getData");
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
                } else {
                    throw error;
                }
            });
    }


    validateResponse(response, callType) {
        try {
            return response.items[0];
        }
        catch(err) {
            if (response.hasOwnProperty("error") && response.error.hasOwnProperty("errors")) {
                if (response.error.errors[0].reason === "quotaExceeded") {
                    console.log("You have exceeded your quota of Youtube API requests, please try again later.");
                    throw new Error("quotaExceeded");
                }
                if (response.error.code === 404) {
                    console.log("Error " + response.error.code + ": Not found");
                    return 0;
                }
                console.log("Invalid response:");
                console.log(response);
                return 0;

            } else if (response.hasOwnProperty("pageInfo") && response.pageInfo.hasOwnProperty("totalResults")) {
                if (callType === 1) {
                    console.log("Channel no longer exists");
                    return 1;
                } else if (callType === 2) {
                    console.log("No public content on channel");
                    return 3;
                } else {
                    console.log("This should not have happened");
                }
                return 0;
            } else {
                console.log(response);
                return 0;
            }
        }
    }

    async makeChannelAPICall(res, channelInfo, retry=false) {
        let channelId = channelInfo.channelId;

        let url = "https://youtube.googleapis.com/youtube/v3/channels?" +
            "key=" + YOUTUBE_API_KEY +
            "&id=" + channelId + "&part=snippet%2CcontentDetails%2Cstatistics";

        return this.getData(url)
            .then( dataObj => {
                //console.log(dataObj);
                if (dataObj === "key swap needed") {
                    if (retry) {
                        console.log("Key swap failed.");
                        throw Error("YouTube Auth Failed.");
                    } else {
                        console.log("New key: " + YOUTUBE_API_KEY);
                        return this.makeChannelAPICall(res, channelInfo, true);
                    }
                }

                let validatedResponse = this.validateResponse(dataObj, 1);
                if (validatedResponse !== 0 && validatedResponse !== 1) {

                    let uploadPlaylistId = validatedResponse.contentDetails.relatedPlaylists.uploads;

                    //updating other info:
                    let subCount = validatedResponse.statistics.subscriberCount;
                    let viewCount = validatedResponse.statistics.viewCount;
                    let videoCount = validatedResponse.statistics.videoCount;

                    channelInfo.uploadPlaylistId = uploadPlaylistId;
                    channelInfo.subscriberCount = subCount;
                    channelInfo.viewCount = viewCount;
                    channelInfo.videoCount = videoCount;

                    return this.getPlaylistItemInfo(res, channelInfo);
                } else if (validatedResponse === 1) {
                    updateMonday.markDeleted(res, channelInfo);
                    channelInfo.status = "deleted";
                    return channelInfo;
                } else {
                    console.log("Information could not be found on the channel " + channelInfo.name);
                    updateMonday.updateStatus(res, channelInfo, "error");
                    channelInfo.status = "not found";
                    return channelInfo;
                }
            })
            .catch(error => {
                console.log(error.message);
                channelInfo.status = "error: " + error.message;
                return channelInfo;
            });
    }

    async getPlaylistItemInfo(res, channelInfo, retry=false) {

        let url = "https://youtube.googleapis.com/youtube/v3/playlistItems?" +
            "key=" + YOUTUBE_API_KEY +
            "&playlistId=" + channelInfo.uploadPlaylistId + "&maxResults=1&part=snippet%2CcontentDetails";

        return this.getData(url)
            .then(result => {

                if (result === "key swap needed") {
                    if (retry) {
                        console.log("Key swap failed.");
                        throw Error("YouTube Auth Failed.");
                    } else {
                        console.log("New key: " + YOUTUBE_API_KEY);
                        return this.getPlaylistItemInfo(res, channelInfo, false);
                    }
                }

                let dataObj = result;

                let validatedResponse = this.validateResponse(dataObj, 2);
                if (validatedResponse !== 0 && validatedResponse !== 3) {

                    validatedResponse = this.validateResponse(dataObj, 3);
                    if (validatedResponse !== 0) {

                        let recentVideo = {name: validatedResponse.snippet.title,
                            date: validatedResponse.contentDetails.videoPublishedAt};
                        channelInfo.mostRecentVideo = recentVideo;

                        return channelInfo;

                    } else {
                        console.log("Information could not be found on the most recent video for " + channelInfo.name);
                        updateMonday.updateStatus(res, channelInfo, "error");

                        channelInfo.status = "Information could not be found on the most recent video";
                        return channelInfo;
                    }

                } else if (validatedResponse === 0) {
                    console.log("Information could not be found on the channel " + channelInfo.name);
                    updateMonday.updateStatus(res, channelInfo, "error");

                    return {status: "Information could not be found on the channel"};
                } else { //3
                    console.log("There is no content on the channel " + channelInfo.name);
                    updateMonday.updateStatus(res, channelInfo, "no content");

                    channelInfo.status = "There is no content on the channel";
                    return channelInfo;
                }
            })
            .catch(error => {
                if (error.message === "Request failed with status code 404") {
                    console.log("There is no content on the channel " + channelInfo.name);
                    updateMonday.updateStatus(res, channelInfo, "no content");

                    channelInfo.status = "There is no content on the channel";
                    return channelInfo;
                } else {
                    channelInfo.status = "Error: " + error.message;
                    return channelInfo;
                }
            });
    }
}

module.exports = GetChannelInfo;