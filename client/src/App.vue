<template>
  <div id="app">
    <div v-if="noData">
      <h1>YouTube Caption Check Tool</h1>
      <p>Built and currently maintained by Emma Lynn (a02391851@usu.edu).</p>
      <p>Use the following form to generate a report regarding the indicated YouTube channel(s). For YouTube Caption Check source
        code and documentation, see <a href="https://github.com/emmalynnnn/access-caption-check">YouTube Caption Check on GitHub</a>.</p>
      <channel-info-form @form-submitted="auditTheChannel"></channel-info-form>

    </div>

    <div v-else>
      <div id="toDownload">
        <h1>YouTube Caption Check Report</h1>
        <p><strong>{{currDate}}</strong></p>
        <h2>{{name}}</h2>
        <p>{{this.channelId}}</p>

        <p v-if="sheetId"><a :href="sheetLink">Click here</a> to view the report as a google sheet.</p>

        <ul>
          <li>Number of videos: <strong>{{numVid}}</strong></li>
          <li>Number captioned: <strong>{{numCap}} ({{percentCap}}%)</strong></li>
          <li>Total seconds: <strong>{{totSec}}</strong></li>
          <li>Seconds captioned: <strong>{{secCap}}</strong></li>
        </ul>

        <table class="table table-bordered table-striped mce-item-table" style="border-collapse: collapse;">
          <thead>
          <tr>
            <th scope="row">Video Title</th>
            <th scope="col">Date</th>
            <th scope="col">Duration</th>
            <th scope="col">Captioned</th>
            <th scope="col">Views</th>
            <th scope="col">Live Stream?</th>
          </tr>
          </thead>

          <tbody>

          <tr v-for="vid in displayVids" :key="vid.url">
            <th scope="row"><a :href="vid.url">{{vid.title}}</a></th>
            <td>{{vid.date}}</td>
            <td>{{vid.dur}}</td>
            <td :class="vid.cap">{{vid.cap}}</td>
            <td class="data">{{vid.views}}</td>
            <td :class="vid.profile">{{vid.profile}}</td>
          </tr>

          </tbody>

        </table>
      </div>
      <div>
        <br>
        <div class="button-box" id="backBox">
          <a @click="goBack" class="btn btn__primary btn__lg">Back</a>
        </div>
        <br>
        <div class="button-box" id="downloadBox">
          <a @click="download" id="downloadLink"
             href="#" :download="downloadName" class="btn btn__primary btn__lg">Download</a>
        </div>
      </div>
      <br>

    </div>


  </div>
</template>

<script>
/* eslint-disable */

import "./assets/app.css";
const converter = require("./assets/dur-iso");

import ChannelInfoForm from "./components/ChannelInfoForm";

export default {
  name: 'App',
  components: {
    ChannelInfoForm,
  },

  data() {
    return {
      noData: true,
      numVid: 0,
      name: "",
      numCap: 0,
      totSec: 0,
      secCap: 0,
      vidInfo: [],
      channelId: "",
      downloaded: false,
      //SERVER_URL: "http://localhost:8000/",
      SERVER_URL: "https://phv9qevh0a.execute-api.us-east-1.amazonaws.com/prod/",
      sheetId: "",
      vidsFound: 0,
      numToCheckFor: 0,
      VID_CHUNK_SIZE: 100,
      toSheet: undefined,
    };
  },

  watch: {
    vidsFound(newVidsFound, oldVidsFound) {
      //console.log("Changed to " + newVidsFound + ". Is it " + this.numToCheckFor + "??");

      if (this.vidInfo[this.vidInfo.length - 1] === "nope") {
        //console.log("Found a bad one :(");
        this.numToCheckFor++;
      }

      if (newVidsFound === parseInt(this.numToCheckFor) && this.toSheet) {
        //console.log("Found them all");

        this.postData(this.SERVER_URL + "size-sheet/", {sheetId: this.sheetId, vidNum: this.numVid})
            .then(response => {
              console.log(response);

              return this.sendToSheetInChunks()
            })
            .then(resp => {
              this.postData(this.SERVER_URL + "sort-sheet/", {sheetId: this.sheetId});
            });
      }
    }
  },

  methods: {
    async sendToSheetInChunks() {
      let vidChunks = [[]];
      let chunkIndex = 0;

      for (let i = 0; i < this.vidInfo.length; i++) {
        if (vidChunks[chunkIndex].length >= this.VID_CHUNK_SIZE) {
          chunkIndex++;
          vidChunks.push([]);
        }
        vidChunks[chunkIndex].push(this.vidInfo[i]);
      }

      //console.log("There are " + vidChunks.length + " chunks of videos.")

      for (let i = 0; i < vidChunks.length; i++) {
        let firstIndex = i * this.VID_CHUNK_SIZE;
        console.log(firstIndex);
        let sheetRes = await this.postData(this.SERVER_URL + "fill-sheet/", {sheetId: this.sheetId, vidInfo: vidChunks[i], firstIndex: firstIndex});
        //console.log("Chunk " + (i + 1) + " with " + JSON.stringify(vidChunks[i]));
        //console.log("sheetRes:", sheetRes);
      }
    },
    download() {

      document.getElementById("downloadBox").style="display: none;";
      document.getElementById("backBox").style="display: none;";

      let theLink = document.getElementById("downloadLink");
      theLink.href='data:text/html;charset=UTF-8,'+encodeURIComponent(document.documentElement.outerHTML);

      document.getElementById("downloadBox").style="";
      document.getElementById("backBox").style="";

      this.downloaded = true;
    },

    goBack() {
      if (!this.downloaded) {
        if (confirm("Are you sure you want to go back? If you continue without saving, " +
            "all data from this scan will be lost.")) {
          this.reset();
        }
      } else {
        this.reset();
      }
    },

    reset() {
      this.noData = true;
      this.numVid = 0;
      this.numCap = 0;
      this.totSec = 0;
      this.secCap = 0;
      this.vidInfo = [];
      this.channelId = "";
      this.downloaded = false;
      this.name = "";
      this.vidsFound = 0;
    },

    auditTheChannel(channelId, format, pubAfter, pubBefore, foldName) {
      //console.log(channelId, format, pubAfter, pubBefore);

      console.log("Outputting to " + format + " " + foldName);

      let emptyInfo = {title: "", url: "",
        date: "", dur: "", cap: "", views: "", profile: ""};
      //let ourVidInfo = [];

      this.channelId = channelId;

      let inputData = {channelId: channelId, format: format, pubAfter: pubAfter, pubBefore: pubBefore, foldName: foldName}

      this.postData(this.SERVER_URL + "audit-channel/", inputData).then((data) => {
        let results = data.result;
        //console.log(results);
        //console.log("We have gotten the results back!!");

        this.noData = false;

        this.numVid = results.numVid;
        this.numToCheckFor = results.numVid;
        this.name = results.name;
        this.numCap = results.numCap;
        this.totSec = 0;
        this.secCap = results.secCap;

        //console.log("The sheet id is: " + results.sheetId);

        if (foldName) {
          this.toSheet = true;
          console.log("There is a foldName so we're doing this " + foldName)
          this.downloaded = true;
          this.postData(this.SERVER_URL + "create-sheet/", {foldName: foldName, name: this.name})
              .then ( result => {
                console.log("The id is " + result.id);
                this.sheetId = result.id;
                return result.id;
              })
              .then (sheetId => {
                for (let i = 0; i < results.vidIds.length; i++) {
                  //console.log(results.vidIds[i]);
                  let isLast = false;
                  if (i === results.vidIds.length - 1) {
                    isLast = true;
                  }

                  this.postData(this.SERVER_URL + "get-vid-info/", {id: results.vidIds[i]})
                      .then (result => {

                        let vidInfo = result.result;

                        this.vidInfo.push(vidInfo);
                        this.vidsFound++;

                        let vidSec = converter.convertToSecond(vidInfo.rawDur);

                        this.totSec += vidSec;

                        if (vidInfo.cap === "Yes") {
                          this.numCap++;
                          this.secCap += vidSec;
                        }

                      })
                }
              })
        } else {
          this.toSheet = false;
          for (let i = 0; i < results.vidIds.length; i++) {
            //console.log(results.vidIds[i]);

            this.postData(this.SERVER_URL + "get-vid-info/", {id: results.vidIds[i], sheetId: "", vidNum: "", isLast: false, vidInfo: ""})
                .then (result => {

                  let vidInfo = result.result;

                  this.vidInfo.push(vidInfo);
                  this.vidsFound++;

                  let vidSec = converter.convertToSecond(vidInfo.rawDur);

                  this.totSec += vidSec;

                  if (vidInfo.cap === "Yes") {
                    this.numCap++;
                    this.secCap += vidSec;
                  }
                })
          }
        }

      });

    },
    postData(url, data, contentType="application/json") {
      return fetch(url, {
        method: "POST",
        /*mode: "no-cors",*/
        cache: "no-cache",
        credentials: "same-origin",
        connection: "keep-alive",
        headers: {
          Accept: 'application.json',
          "Content-Type": contentType,
        },
        body: JSON.stringify(data)
      })
          .then(res => {
            return res.json();
          })
          .then((obj) => {
            return obj;
          })
          .catch(err => {
            console.log(err);
          });
    },

  },

  computed: {
    percentCap() {
      if (this.numCap === 0) {
        return 0;
      }
      return Math.round((this.numCap / this.numVid) * 100);
    },
    currDate() {
      let dateObj = new Date();
      return dateObj.toLocaleDateString();
    },
    downloadName() {
      return "ytca-report-" + this.channelId + ".html";
    },
    displayVids() {
      let toReturn = [];
      for (let i = 0; i < this.vidInfo.length; i++) {
        if (this.vidInfo[i].title) {
          toReturn.push(this.vidInfo[i]);
        }
      }
      return toReturn;
    },
    sheetLink() {
      return `https://docs.google.com/spreadsheets/d/${this.sheetId}/`;
    }
  }

};

</script>

