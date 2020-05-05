<template>
  <div class="columns">
    <div class="column is-3">
      <b-table :data="templates" :hoverable="true" :narrowed="true" @click="selectTemplate">
        <template v-slot:default="template">
          <b-table-column field="name" label="Name">
            {{ template.row.name }}
          </b-table-column>
          <b-table-column field="id" label="ID">
            {{ template.row.id }}
          </b-table-column>
        </template>
      </b-table>
    </div>
    <div class="column is-8">
      <b-field label="Name">
        <b-input required ref="templateName" v-model="templateName"></b-input>
      </b-field>
      <b-field label="Template content">
        <b-input required ref="templateContent" v-model="templateContent" type="textarea"></b-input>
      </b-field>
      <b-field grouped>
        <p class="control" v-if="templateId">
          <button class="button is-primary" @click="updateTemplate">Save changes</button>
        </p>
        <p class="control" v-if="templateId">
          <button class="button is-danger" @click="confirmDeleteTemplate">Delete template</button>
        </p>
        <p class="control" v-if="!templateId">
          <button class="button is-primary" @click="updateTemplate">Add new template</button>
        </p>
        <p class="control">
          <button class="button is-light" @click="deselectTemplate">Clear form</button>
        </p>
      </b-field>
      Example template body:
      <span v-pre>
        <pre>
&lt;arbitrary&gt;
{% for obs in elements %}{{ obs.value }}
{% endfor %}
&lt;/arbitrary&gt;</pre
        >
      </span>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "TemplateList",
  data() {
    return {
      templates: [],
      templateName: null,
      templateContent: null,
      templateId: null
    };
  },
  mounted() {
    this.listExportTemplates();
  },
  methods: {
    listExportTemplates() {
      axios
        .get("/api/exporttemplate/")
        .then(response => {
          this.templates = response.data;
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    selectTemplate(row) {
      this.templateName = row.name;
      this.templateContent = row.template;
      this.templateId = row.id;
    },
    deselectTemplate() {
      this.templateName = this.templateContent = this.templateId = null;
    },
    updateTemplate() {
      var valid = this.$refs.templateName.checkHtml5Validity();
      valid &= this.$refs.templateContent.checkHtml5Validity();
      if (!valid) {
        return;
      }
      var params = {
        name: this.templateName,
        template: this.templateContent
      };
      axios
        .post(`/api/exporttemplate/${this.templateId || ""}`, params)
        .then(() => {
          this.deselectTemplate();
          this.listExportTemplates();
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    confirmDeleteTemplate() {
      this.$buefy.dialog.confirm({
        title: "Delete template",
        message: `You're about to <b>delete</b> Template <code>${this.templateName}</code>. Proceed?`,
        confirmText: "Delete template",
        type: "is-danger",
        hasIcon: true,
        onConfirm: this.deleteTemplate
      });
    },
    deleteTemplate() {
      axios
        .delete(`/api/exporttemplate/${this.templateId}`)
        .then(() => {
          this.deselectTemplate();
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {
          this.listExportTemplates();
        });
    }
  }
};
</script>
