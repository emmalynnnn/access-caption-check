<template>
  <div id="app">
    <h1>YouTube Caption Auditor (YTCA-USU)</h1>
    <p>Built and currently maintained by Emma Lynn (a02391851@usu.edu).</p>
    <p>Based off Terrill Thompson (University of Washington)'s <a href="https://github.com/terrill/YTCA">YTCA</a>.</p>
    <p>Use the following form to generate a report regarding the indicated YouTube channel(s). For YTCA-USU source
    code and documentation, see <a href="https://github.com/emmalynnnn/access-YTCA-USU">YTCA-USU on GitHub</a>.</p>
    <channel-info-form @todo-added="addToDo"></channel-info-form>

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
    //ToDoItem,
    ChannelInfoForm,
  },

  data() {
    return {
      ToDoItems: [
        { id: uniqueId("todo-"), label: "Learn Vue", done: false },
        { id: uniqueId("todo-"), label: "Create a Vue project with the CLI", done: true },
        { id: uniqueId("todo-"), label: "Have fun", done: true },
        { id: uniqueId("todo-"), label: "Create a to-do list", done: false },
      ],
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
  },

  computed: {
    listSummary() {
      const numberFinishedItems = this.ToDoItems.filter((item) =>item.done).length
      return `${numberFinishedItems} out of ${this.ToDoItems.length} items completed`
    },
  }

};

</script>

