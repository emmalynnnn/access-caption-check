<script>
const converter = require("./assets/dur-iso");

module.exports = {
  // add here all the methods, props… to share
  methods: {

    async auditChannel(channelId, format, pubAfter, pubBefore) {

      console.log("Auditing " + channelId);
      console.log(channelId, format, pubAfter, pubBefore);

      let resultsObj = {numVid: 0, numCap: 0, totSec: 0, secCap: 0, vidInfo: []}

      const API_KEY = process.env.VUE_APP_YOUTUBE_API;

      let url = "https://youtube.googleapis.com/youtube/v3/channels?" +
          "key=" + API_KEY +
          "&id=" + channelId + "&part=snippet%2CcontentDetails%2Cstatistics&";

      try {
        return fetch(url)
            .then( response => response.json() )
            .then( json => {
              resultsObj.numVid = json.items[0].statistics.videoCount;
              let playlistId = json.items[0].contentDetails.relatedPlaylists.uploads;
              //console.log(playlistId);
              url = "https://youtube.googleapis.com/youtube/v3/playlistItems?playlistId=" + playlistId + "&key=" +
                  API_KEY + "&maxResults=" + resultsObj.numVid;
              return fetch(url);
            })
            .then( response => response.json() )
            .then( json => {

              let playlistItemIds = [];
              for (let i = 0; i < json.items.length; i++) {
                playlistItemIds.push(json.items[i].id);
              }

              for (let i = 0; i < playlistItemIds.length; i++) {
                url = "https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet%2CcontentDetails%2Cstatus&id=" +
                    playlistItemIds[i] + "&maxResults=1&key=" + API_KEY;

                resultsObj.vidInfo.push(fetch(url)
                    .then( response => response.json() )
                    .then( json => {
                      console.log(json);

                      let id = json.items[0].snippet.resourceId.videoId;

                      url = "https://www.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatistics&" +
                          "id=" + id + "&key=" + API_KEY;
                      return fetch(url);
                    })
                    .then( response => response.json() )
                    .then( json => {

                      let durISO = json.items[0].contentDetails.duration;
                      let formatted = converter.convertYouTubeDuration(durISO);
                      console.log(formatted);

                      let info = {title: json.items[0].snippet.title,
                        url: "https://www.youtube.com/watch?v=" + json.items[0].id,
                        date: json.items[0].snippet.publishedAt.substring(0, json.items[0].snippet.publishedAt.indexOf("T")),
                        dur: formatted, rawDur: durISO,
                        views: json.items[0].statistics.viewCount, profile: "Yes"};

                      //resultsObj.totSec += converter.convertToSecond(durISO);

                      if (json.items[0].contentDetails.caption) {
                        info.cap = "Yes";
                        resultsObj.numCap += 1;
                        //resultsObj.secCap += converter.convertToSecond(durISO);
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

      /*let results = {numVid: 18, numCap: 18, totSec: 2866, secCap: 2866, vidInfo: [
          {title: "1 5 hours of audio editing in under 1 minute", url: "https://youtube.com",
            date: "2021-09-20", dur: "00:00:52", cap: "Yes", views: 24, profile: "Yes"},
          {title: "Dido and Aeneas - Highlights (USU Opera)", url: "https://youtube.com",
            date: "2021-09-20", dur: "00:00:52", cap: "No", views: 24, profile: "Yes"},
          {title: "Ghost Quartet - Highlights (USU Opera)", url: "https://youtube.com",
            date: "2021-09-20", dur: "00:00:52", cap: "Yes", views: 24, profile: "Yes"},
          {title: "Orpheus in the Underworld - Highlights (USU Opera)", url: "https://youtube.com",
            date: "2021-09-20", dur: "00:00:52", cap: "Yes", views: 24, profile: "No"},
        ]}*/

    }

  }
}
</script>



