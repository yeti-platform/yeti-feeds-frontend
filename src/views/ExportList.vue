<template>
  <div class="columns">
    <div class="column is-9 exportlist">
      <task-list task-type="export" ref="exportList" @taskSelected="task => (this.selectedExport = task)"> </task-list>
    </div>
    <div class="column is-3">
      <b-field label="Name">
        <b-input v-model="selectedExport.name" required ref="exportName"></b-input>
      </b-field>
      <b-field label="Description">
        <b-input v-model="selectedExport.description"></b-input>
      </b-field>
      <b-field label="Include tags">
        <b-taginput label="Include tags" v-model="selectedExport.include_tags" icon="tag"></b-taginput>
      </b-field>
      <b-field label="Ignore tags">
        <b-taginput label="Ignore tags" v-model="selectedExport.ignore_tags" icon="tag"></b-taginput>
      </b-field>
      <b-field label="Exclude tags">
        <b-taginput label="Exclude tags" v-model="selectedExport.exclude_tags" icon="tag"></b-taginput>
      </b-field>
      <b-field label="Acts on">
        <b-taginput
          label="Acts on"
          v-model="selectedExport.acts_on"
          icon="tag"
          autocomplete
          :allow-new="false"
          placeholder="Add observable types"
          :data="Object.keys(defaultTypes)"
        ></b-taginput>
      </b-field>
      <b-field>
        <b-select
          v-model="selectedExport.template_name"
          placeholder="Select template to use"
          required
          ref="exportTemplate"
          expanded
        >
          <option v-for="template in exportTemplates" v-bind:key="template">{{ template }}</option>
        </b-select>
      </b-field>
      <b-field grouped>
        <p class="control" v-if="selectedExport.id">
          <button class="button is-primary" @click="updateExport">Save changes</button>
        </p>
        <p class="control" v-if="selectedExport.id">
          <button class="button is-danger" @click="confirmDeleteExport">Delete export</button>
        </p>
        <p class="control" v-if="!selectedExport.id">
          <button class="button is-primary" @click="newExport">Add new export</button>
        </p>

        <p class="control">
          <button class="button is-light" @click="selectedExport = {}">Clear form</button>
        </p>
      </b-field>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import utils from "@/utils";
import TaskList from "@/views/TaskList.vue";

var defaultTypes = {
  ip: "IP",
  // AutonomousSystem: "Autonomous System",
  url: "URL",
  hostname: "Hostname"
  // Hash: "Hash",
  // File: "File",
  // Certificate: "Certificate",
  // CertificateSubject: "Certificate Subject",
  // Email: "Email",
  // Text: "Text",
  // Bitcoin: "Bitcoin address",
  // Path: "Path",
  // MacAddress: "MAC address"
};

export default {
  name: "ExportList",
  components: {
    TaskList
  },
  data() {
    return {
      defaultTypes: defaultTypes,
      exports: [],
      exportTemplates: [],
      selectedExport: {},
      timerListTemplates: null
    };
  },
  mounted() {
    this.listTemplates();
  },
  created() {
    this.timerListTemplates = setInterval(this.listTemplates, 2000);
  },
  beforeDestroy() {
    clearInterval(this.timerListTemplates);
  },
  methods: {
    listTemplates() {
      axios
        .post("/api/v2/templates/search", { name: "" })
        .then(response => (this.exportTemplates = response.data.templates.map(template => template.name)))
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    updateExport() {
      let exportTask = {
        id: this.selectedExport.id,
        name: this.selectedExport.name,
        description: this.selectedExport.description,
        include_tags: this.selectedExport.include_tags,
        ignore_tags: this.selectedExport.ignore_tags,
        exclude_tags: this.selectedExport.exclude_tags,
        acts_on: this.selectedExport.acts_on,
        template_name: this.selectedExport.template_name
      };

      axios
        .patch(`/api/v2/tasks/export/${this.selectedExport.name}`, { export: exportTask })
        .then(() => {
          this.$refs.exportList.listTasks();
          this.selectedExport = {};
        })
        .catch(error => console.log(error))
        .finally(() => {});
    },
    newExport() {
      let exportTask = {
        name: this.selectedExport.name,
        acts_on: this.selectedExport.acts_on,
        description: this.selectedExport.description,
        template_name: this.selectedExport.template_name,
        exclude_tags: this.selectedExport.exclude_tags,
        ignore_tags: this.selectedExport.ignore_tags,
        include_tags: this.selectedExport.include_tags
      };
      axios
        .post(`/api/v2/tasks/export/new`, { export: exportTask })
        .then(() => {
          this.$refs.exportList.listTasks();
          this.selectedExport = {};
          console.log("clear");
        })
        .catch(error => console.log(error))
        .finally(() => {});
    },
    confirmDeleteExport() {
      this.$buefy.dialog.confirm({
        title: "Delete export",
        message: `You're about to <b>delete</b> export <code>${this.selectedExport.name}</code>. Proceed?`,
        confirmText: "Delete Export",
        type: "is-danger",
        hasIcon: true,
        onConfirm: this.deleteExport
      });
    },
    downloadExport(singleExport) {
      axios
        .get(`/api/v2/tasks/export/${singleExport.id}/content`)
        .then(response => {
          var fileURL = window.URL.createObjectURL(new Blob([response.data]));
          var fileLink = document.createElement("a");
          var fileName = response.headers["content-disposition"].split("filename=")[1];
          fileLink.href = fileURL;
          fileLink.setAttribute("download", fileName);
          document.body.appendChild(fileLink);
          fileLink.click();
        })
        .catch(error => {
          console.log(error);
        });
    },
    formatTimestamp(timestamp, local) {
      return utils.formatTimestamp(timestamp, local);
    }
  }
};
</script>

<style scoped lang="scss">
@import "@/style.scss";

.exportlist ::v-deep .disabled {
  opacity: 0.5;
}

.exportlist .is-success strong {
  color: $success-fontcolor;
}

.exportlist .is-danger strong {
  color: $danger-fontcolor;
}

.exportlist .is-warning strong {
  color: $warning-fontcolor;
}

.exportlist ::v-deep .is-success {
  background: $success;
  color: $success-fontcolor;
}

.exportlist ::v-deep tbody tr.is-success:hover {
  background-color: $success-hover;
}

.exportlist ::v-deep .is-danger {
  background: $danger;
  color: $danger-fontcolor;
}

.exportlist ::v-deep tbody tr.is-danger:hover {
  background: $danger-hover;
}

.exportlist ::v-deep .is-warning {
  background: $warning;
  color: $warning-fontcolor;
}

.exportlist ::v-deep tbody tr.is-warning:hover {
  background: $warning-hover;
}
</style>
