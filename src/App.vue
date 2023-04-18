<template>
  <div id="app">
    <h1>YTCA-USU</h1>
    <p>Created and currently maintained by Emma Lynn (a02391851@usu.edu)</p>
    <p>Use the following form to generate a report regarding the indicated YouTube channel(s). For YTCA-USU source
    code and documentation, see <a href="https://github.com/emmalynnnn/access-YTCA-USU">YTCA-USU on GitHub</a>.</p>
    <to-do-form @todo-added="addToDo"></to-do-form>
    <h2>{{listSummary}}</h2>
    <ul aria-labelledby="list-summary" class="stack-large">
      <li v-for="item in ToDoItems" :key="item.id">
        <to-do-item
            :label="item.label"
            :done="item.done"
            :id="item.id"
            @checkbox-changed="updateDoneStatus(item.id)"
            @item-deleted="deleteToDo(item.id)"
            @item-edited="editToDo(item.id, $event)">
        </to-do-item>

      </li>
    </ul>
  </div>
</template>

<script>
import "./assets/app.css";

import ToDoItem from "./components/ToDoItem.vue";
import ToDoForm from "./components/ToDoForm";
import uniqueId from "lodash.uniqueid";

export default {
  name: 'App',
  components: {
    ToDoItem,
    ToDoForm,
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

