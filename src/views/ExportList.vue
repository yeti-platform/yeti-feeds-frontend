<template>
  <div class="columns">
    <div class="column is-9">
      <b-table
        :data="exports"
        :hoverable="true"
        :narrowed="true"
        :row-class="getRowClass"
        @click="row => (this.selectedExport = JSON.parse(JSON.stringify(row)))"
      >
        <template v-slot:default="singleExport">
          <b-table-column field="name" label="Name">
            <strong>{{ singleExport.row.name }}</strong>
          </b-table-column>
          <b-table-column field="frequency" label="Runs every">
            {{ singleExport.row.frequency }}
          </b-table-column>
          <b-table-column field="last_run" label="Last run">
            {{ singleExport.row.last_run || "Never" }}
          </b-table-column>
          <b-table-column field="description" label="Description">
            {{ singleExport.row.description }}
          </b-table-column>
          <b-table-column field="acts_on" label="Acts on">
            {{ singleExport.row.acts_on }}
          </b-table-column>
          <b-table-column field="ignore" label="Ignore">
            <b-taglist>
              <b-tag v-for="tag in singleExport.row.ignore_tags" v-bind:key="tag">
                {{ tag }}
              </b-tag>
            </b-taglist>
          </b-table-column>
          <b-table-column field="include" label="include">
            <b-taglist>
              <b-tag v-for="tag in singleExport.row.include_tags" v-bind:key="tag">
                {{ tag }}
              </b-tag>
            </b-taglist>
          </b-table-column>
          <b-table-column field="exclude" label="exclude">
            <b-taglist>
              <b-tag v-for="tag in singleExport.row.exclude_tags" v-bind:key="tag">
                {{ tag }}
              </b-tag>
            </b-taglist>
          </b-table-column>
          <b-table-column field="singleExport.template" label="Template">
            {{ singleExport.row.template }}
          </b-table-column>
          <b-table-column field="status" label="Status">
            {{ singleExport.row.status || "N/A" }}
          </b-table-column>
          <b-table-column field="toggle" label="Toggle">
            <div @click="toggle(singleExport.row)" class="toggle">
              <b-switch v-model="singleExport.row.enabled" :disabled="singleExport.row.status === 'Updating...'">
              </b-switch>
            </div>
          </b-table-column>
          <b-table-column field="refresh" label="">
            <b-button
              :disabled="singleExport.row.status === 'Updating...'"
              @click="refresh(singleExport.row)"
              size="is-small"
            >
              <b-icon
                v-if="singleExport.row.enabled"
                pack="fas"
                icon="sync"
                size="is-small"
                :custom-class="singleExport.row.status === 'Updating...' ? 'fa-spin' : ''"
              ></b-icon>
            </b-button>
          </b-table-column>
        </template>
      </b-table>
    </div>
    <div class="column is-3">
      <b-field label="Name">
        <b-input v-model="selectedExport.name" required ref="exportName"></b-input>
      </b-field>
      <b-field label="Description">
        <b-input v-model="selectedExport.description"></b-input>
      </b-field>
      <b-field label="Include tags">
        <yeti-tag-input v-model="selectedExport.include_tags"></yeti-tag-input>
      </b-field>
      <b-field label="Ignore tags">
        <yeti-tag-input v-model="selectedExport.ignore_tags"></yeti-tag-input>
      </b-field>
      <b-field label="Exclude tags">
        <yeti-tag-input v-model="selectedExport.exclude_tags"></yeti-tag-input>
      </b-field>
      <b-field>
        <b-select
          v-model="selectedExport.acts_on"
          placeholder="Select type to export"
          required
          ref="exportActsOn"
          expanded
        >
          <option v-for="type in Object.keys(defaultTypes)" v-bind:key="type" :value="type">
            {{ defaultTypes[type] }}
          </option>
        </b-select>
      </b-field>
      <b-field>
        <b-select
          v-model="selectedExport.template"
          placeholder="Select template to use"
          required
          ref="exportTemplate"
          expanded
        >
          <option v-for="template in exportTemplates" v-bind:key="template">
            {{ template }}
          </option>
        </b-select>
      </b-field>
      <b-field grouped>
        <p class="control" v-if="selectedExport.id">
          <button class="button is-primary" @click="updateExport">
            Save changes
          </button>
        </p>
        <p class="control" v-if="selectedExport.id">
          <button class="button is-danger" @click="confirmDeleteExport">
            Delete export
          </button>
        </p>
        <p class="control" v-if="!selectedExport.id">
          <button class="button is-primary" @click="updateExport">
            Add new export
          </button>
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
import YetiTagInput from "@/components/YetiTagInput";

var defaultTypes = {
  Ip: "Ip",
  AutonomousSystem: "Autonomous System",
  Url: "URL",
  Hostname: "Hostname",
  Hash: "Hash",
  File: "File",
  Certificate: "Certificate",
  CertificateSubject: "Certificate Subject",
  Email: "Email",
  Text: "Text",
  Bitcoin: "Bitcoin address",
  Path: "Path",
  MacAddress: "MAC Address"
};

export default {
  name: "ExportList",
  components: {
    YetiTagInput
  },
  data() {
    return {
      defaultTypes: defaultTypes,
      exports: [],
      exportTemplates: [],
      newExport: {},
      selectedExport: {},
      timer: null
    };
  },
  mounted() {
    this.listExports();
    this.listExportTemplates();
  },
  created() {
    this.timer = setInterval(this.listExports, 5000);
  },
  beforeDestroy() {
    clearInterval(this.timer);
  },
  methods: {
    toggle(feed) {
      console.log(feed);
      var url = "/api/export/" + feed.id + "/toggle";
      axios
        .post(url)
        .then(() => {
          // feed.enabled = !feed.enabled;
        })
        .catch(error => {
          console.log(error);
        });
    },
    listExports() {
      axios
        .get("/api/export/")
        .then(response => (this.exports = response.data))
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    listExportTemplates() {
      axios
        .get("/api/exporttemplate/")
        .then(response => (this.exportTemplates = response.data.map(template => template.name)))
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    refresh(feed) {
      var url = "/api/export/" + feed.id + "/refresh";
      axios
        .post(url)
        .then(() => {})
        .catch(error => {
          console.log(error);
        });
    },
    isRefreshing(feed) {
      return feed.status === "Updating...";
    },
    getRowClass(row) {
      if (!row.enabled) {
        return "disabled";
      }
      if (row.status === "OK") {
        return "is-success";
      }
    },
    updateExport() {
      var valid = this.$refs.exportActsOn.checkHtml5Validity();
      valid &= this.$refs.exportTemplate.checkHtml5Validity();
      valid &= this.$refs.exportName.checkHtml5Validity();
      if (!valid) {
        return false;
      }
      var params = {
        acts_on: this.selectedExport.acts_on,
        description: this.selectedExport.description,
        name: this.selectedExport.name,
        template: this.selectedExport.template
      };

      if (!this.selectedExport.exclude_tags) {
        this.selectedExport.exclude_tags = [];
      }
      if (!this.selectedExport.ignore_tags) {
        this.selectedExport.ignore_tags = [];
      }
      if (!this.selectedExport.include_tags) {
        this.selectedExport.include_tags = [];
      }

      params.exclude_tags = this.selectedExport.exclude_tags.map(tag => tag.name || tag);
      params.ignore_tags = this.selectedExport.ignore_tags.map(tag => tag.name || tag);
      params.include_tags = this.selectedExport.include_tags.map(tag => tag.name || tag);
      axios
        .post(`/api/export/${this.selectedExport.id || ""}`, params)
        .then(() => this.listExports())
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
    deleteExport() {
      axios
        .delete(`/api/export/${this.selectedExport.id}`)
        .then(() => {
          this.listExports();
          this.selectedExport = {};
        })
        .catch(error => console.log(error))
        .finally(() => {});
    }
  }
};
</script>

<style>
.disabled {
  opacity: 0.5;
}

.is-success {
  background: rgb(172, 255, 172);
}

div.toggle {
  cursor: pointer;
}
</style>
