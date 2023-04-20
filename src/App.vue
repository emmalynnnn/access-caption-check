<template>
  <div id="app">
    <div v-if="noData">
      <h1>YouTube Caption Auditor (YTCA-USU)</h1>
      <p>Built and currently maintained by Emma Lynn (a02391851@usu.edu).</p>
      <p>Based off Terrill Thompson (University of Washington)'s <a href="https://github.com/terrill/YTCA">YTCA</a>.</p>
      <p>Use the following form to generate a report regarding the indicated YouTube channel(s). For YTCA-USU source
        code and documentation, see <a href="https://github.com/emmalynnnn/YTCA-USU">YTCA-USU on GitHub</a>.</p>
      <channel-info-form @form-submitted="auditTheChannel"></channel-info-form>
    </div>

    <div v-else>
      <h1>YouTube Caption Auditor (YTCA) Report</h1>
      <p><strong>Apr 20, 2023</strong></p>
      <h2>Channel 1 of 1:</h2>
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
          <th scope="col">Listed on Profile?</th>
        </tr>
        </thead>

        <tbody>

        <tr v-for="vid in vidInfo" :key="vid.url">
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


  </div>
</template>

<script>
import "./assets/app.css";

//import ToDoItem from "./components/ToDoItem.vue";
import ChannelInfoForm from "./components/ChannelInfoForm";
import uniqueId from "lodash.uniqueid";

export default {
  name: 'App',
  components: {
    ChannelInfoForm,
  },
  mixins: [
    require('./myMixins.vue')
  ],

  data() {
    return {
      noData: true,
      numVid: 0,
      numCap: 0,
      totSec: 0,
      secCap: 0,
      vidInfo: [],
    };
  },

  methods: {
    addToDo(toDoLabel) {
      this.ToDoItems.push({id:uniqueId('todo-'), label: toDoLabel, done: false});
    },
    updateDoneStatus(toDoId) {
      const toDoToUpdate = this.ToDoItems.find((item) => item.id === toDoId)
      toDoToUpdate.done = !toDoToUpdate.done
    },
    deleteToDo(toDoId) {
      const itemIndex = this.ToDoItems.findIndex((item) => item.id === toDoId);
      this.ToDoItems.splice(itemIndex, 1);
    },
    editToDo(toDoId, newLabel) {
      const toDoToEdit = this.ToDoItems.find((item) => item.id === toDoId);
      toDoToEdit.label = newLabel;
    },

    auditTheChannel(channelId, format, pubAfter, pubBefore) {
      //console.log(channelId, format, pubAfter, pubBefore);

      this.auditChannel(channelId, format, pubAfter, pubBefore)
          .then (results => {
            console.log("We have gotten the results back!!");
            console.log(results);

            this.numVid = results.numVid;
            this.numCap = results.numCap;
            this.totSec = results.totSec;
            this.secCap = results.secCap;
            this.vidInfo = results.vidInfo;

            this.noData = false;
          });
    }
  },

  computed: {
    percentCap() {
      if (this.numCap === 0) {
        return 0;
      }
      return (this.numVid / this.numCap) * 100
    },
  }

};

</script>

